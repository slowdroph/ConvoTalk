import { Response } from "express";
import mongoose from "mongoose";
import Room from "../models/Room";
import User from "../models/User";
import Message from "../models/Message";
import { AuthRequest } from "../middleware/auth";
import { emitSystemMessage } from "../services/systemMessages";
import cloudinary from "../config/cloudinary";
import { getSocketIO } from "../config/io";
import { isRoomCreator, isRoomCreatorOrAdmin } from "../utils/roomAuth";
import { deleteCloudinaryAttachments, cloudinaryPublicIdFromUrl } from "../services/cloudinary";
import { BadRequestError, ForbiddenError, NotFoundError, ValidationError, handleError } from "../utils/errors";
import { audit } from "../utils/audit";
import { logger } from "../config/logger";

const GROUP_PHOTO_FOLDER = "chat_app_groupPhoto";

function broadcastRoomUpdated(roomId: string, payload: unknown): void {
  getSocketIO()?.to(roomId).emit("room_updated", payload);
}

function getParamId(raw: unknown): string {
  const id = Array.isArray(raw) ? raw[0] : raw;
  return id;
}

export async function listRooms(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!._id;

    const me = await User.findById(userId).select("blockedUsers").lean();
    const blocked = new Set(
      (me?.blockedUsers ?? []).map((id) => id.toString()),
    );

    const rooms = await Room.find({ participants: userId })
      .sort({ name: 1 })
      .populate("participants", "name email avatar status")
      .populate("admins", "name email avatar status")
      .lean();

    const visibleRooms = rooms.filter((r) => {
      if (r.type !== "direct") return true;
      const other = (r.participants ?? []).find(
        (p) => p._id.toString() !== userId.toString(),
      );
      if (!other) return true;
      return !blocked.has(other._id.toString());
    });

    const roomIds = visibleRooms.map((r) => r._id);
    let unreadAgg: { _id: mongoose.Types.ObjectId; count: number }[] = [];
    if (roomIds.length > 0) {
      unreadAgg = await Message.aggregate([
        { $match: { room: { $in: roomIds }, sender: { $ne: new mongoose.Types.ObjectId(userId) }, type: { $ne: "system" } } },
        {
          $lookup: {
            from: "rooms",
            localField: "room",
            foreignField: "_id",
            as: "roomInfo",
          },
        },
        { $unwind: "$roomInfo" },
        {
          $addFields: {
            lastRead: {
              $ifNull: [
                { $getField: { field: userId, input: "$roomInfo.lastReadAt" } },
                null,
              ],
            },
          },
        },
        {
          $project: {
            room: 1,
            isUnread: {
              $cond: {
                if: { $eq: ["$lastRead", null] },
                then: true,
                else: { $gt: ["$createdAt", "$lastRead"] },
              },
            },
          },
        },
        {
          $group: {
            _id: "$room",
            count: { $sum: { $cond: ["$isUnread", 1, 0] } },
          },
        },
      ]);
    }

    const unreadMap = new Map(unreadAgg.map((u) => [u._id.toString(), u.count]));
    const result = visibleRooms.map((r) => ({
      ...r,
      unreadCount: unreadMap.get(r._id.toString()) || 0,
    }));

    res.json(result);
  } catch (error) {
    handleError(error, res, "Erro ao buscar salas.");
  }
}

export async function createDirectRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId: otherUserId } = req.body;
    const myId = req.user!._id;

    if (otherUserId === myId.toString()) {
      throw new BadRequestError("Não é possível iniciar conversa consigo mesmo.");
    }

    const targetUser = await User.findById(otherUserId).select("_id").lean();
    if (!targetUser) {
      throw new NotFoundError("Usuário não encontrado.");
    }

    const isBlocked = await User.exists({
      _id: { $in: [myId, otherUserId] },
      blockedUsers: { $in: [myId, otherUserId] },
    });
    if (isBlocked) {
      throw new ForbiddenError(
        "Não é possível iniciar conversa com este usuário.",
      );
    }

    const existing = await Room.findOne({
      type: "direct",
      participants: { $all: [myId, otherUserId], $size: 2 },
    }).populate("participants", "name email").lean();

    if (existing) {
      res.json(existing);
      return;
    }

    const room = await Room.create({
      type: "direct",
      participants: [myId, otherUserId],
      name: "",
    });

    const populated = await Room.findById(room._id)
      .populate("participants", "name email avatar status")
      .lean();

    audit({
      action: "room.create_direct",
      actorId: myId.toString(),
      targetId: otherUserId,
      ip: req.ip,
      details: { roomId: room._id.toString() },
    });

    res.status(201).json(populated);
  } catch (error) {
    handleError(error, res, "Erro ao criar conversa.");
  }
}

export async function createGroupRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, participantIds } = req.body;
    const creatorId = req.user!._id;

    const memberIds = Array.from(
      new Set<string>([
        creatorId.toString(),
        ...(participantIds as string[]).filter(
          (id) => id !== creatorId.toString(),
        ),
      ]),
    );

    const existingUsers = await User.find({
      _id: { $in: memberIds },
    }).select("_id").lean();
    if (existingUsers.length !== memberIds.length) {
      throw new BadRequestError("Um ou mais usuários não existem.");
    }

    const room = await Room.create({
      name,
      description: description || "",
      type: "group",
      createdBy: creatorId,
      participants: memberIds,
    });

    const populated = await Room.findById(room._id)
      .populate("participants", "name email avatar status")
      .lean();

    const creator = await User.findById(creatorId).select("name").lean();
    const memberNames = await User.find({ _id: { $in: memberIds } })
      .select("name")
      .lean();
    emitSystemMessage(
      room._id.toString(),
      `${creator?.name || "Alguém"} criou o grupo com ${memberNames.length} participantes.`,
    );

    audit({
      action: "room.create_group",
      actorId: creatorId.toString(),
      ip: req.ip,
      details: { roomId: room._id.toString(), name, memberCount: memberIds.length },
    });

    res.status(201).json(populated);
  } catch (error) {
    handleError(error, res, "Erro ao criar grupo.");
  }
}

export async function updateGroupRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req.params.id);
    const myId = req.user!._id;

    const room = await Room.findById(id).select("type createdBy participants admins name description").lean();
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
      throw new BadRequestError("Apenas grupos podem ser editados.");
    }

    const updates: { name?: string; description?: string } = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;

    if (updates.name !== undefined && updates.name !== room.name && !isRoomCreator(room, myId.toString())) {
      throw new ForbiddenError("Apenas o criador pode renomear o grupo.");
    }
    if (
      updates.description !== undefined &&
      !isRoomCreatorOrAdmin(room, myId.toString())
    ) {
      throw new ForbiddenError("Sem permissão para editar o grupo.");
    }

    const updated = await Room.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("participants", "name email avatar status")
      .populate("admins", "name email avatar status")
      .lean();

    const actor = await User.findById(myId).select("name").lean();
    if (updates.name && updates.name !== room.name) {
      emitSystemMessage(
        id,
        `${actor?.name || "Alguém"} renomeou o grupo para "${updates.name}".`,
      );
    } else if (
      (updates.description !== undefined) &&
      updates.description !== room.description
    ) {
      emitSystemMessage(
        id,
        `${actor?.name || "Alguém"} atualizou a descrição do grupo.`,
      );
    }

    broadcastRoomUpdated(id, updated);
    res.json(updated);
  } catch (error) {
    handleError(error, res, "Erro ao editar grupo.");
  }
}

export async function addMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req.params.id);
    const { userId: newMemberId } = req.body;
    const myId = req.user!._id;

    const room = await Room.findById(id).select("type createdBy participants admins").lean();
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
      throw new BadRequestError("Apenas grupos podem ter membros adicionados.");
    }

    if (!isRoomCreatorOrAdmin(room, myId.toString())) {
      throw new ForbiddenError("Sem permissão para adicionar membros.");
    }

    const targetUser = await User.findById(newMemberId).select("_id").lean();
    if (!targetUser) {
      throw new NotFoundError("Usuário não encontrado.");
    }

    if (room.participants.some((p) => p.toString() === newMemberId)) {
      throw new BadRequestError("Usuário já participa do grupo.");
    }

    const updated = await Room.findByIdAndUpdate(
      id,
      { $addToSet: { participants: newMemberId } },
      { new: true, runValidators: true },
    )
      .populate("participants", "name email avatar status")
      .populate("admins", "name email avatar status")
      .lean();

    const [actor, targetUserDoc] = await Promise.all([
      User.findById(myId).select("name").lean(),
      User.findById(newMemberId).select("name").lean(),
    ]);
    emitSystemMessage(
      id,
      `${actor?.name || "Alguém"} adicionou ${targetUserDoc?.name || "um novo membro"} ao grupo.`,
    );

    audit({
      action: "room.add_member",
      actorId: myId.toString(),
      targetId: newMemberId,
      ip: req.ip,
      details: { roomId: id },
    });

    broadcastRoomUpdated(id, updated);
    res.json(updated);
  } catch (error) {
    handleError(error, res, "Erro ao adicionar membro.");
  }
}

export async function removeMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req.params.id);
    const { userId: removeId } = req.params as unknown as { userId: string };
    const myId = req.user!._id;

    const room = await Room.findById(id).select("type createdBy participants admins").lean();
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
      throw new BadRequestError("Apenas grupos podem ter membros removidos.");
    }

    if (!isRoomCreatorOrAdmin(room, myId.toString())) {
      throw new ForbiddenError("Sem permissão para remover membros.");
    }

    if (!room.createdBy || removeId === room.createdBy.toString()) {
      throw new BadRequestError("O criador não pode ser removido do grupo.");
    }

    if (!room.participants.some((p) => p.toString() === removeId)) {
      throw new BadRequestError("Usuário não participa do grupo.");
    }

    const updated = await Room.findByIdAndUpdate(
      id,
      { $pull: { participants: removeId, admins: removeId } },
      { new: true, runValidators: true },
    )
      .populate("participants", "name email avatar status")
      .populate("admins", "name email avatar status")
      .lean();

    const [actor, targetUserDoc] = await Promise.all([
      User.findById(myId).select("name").lean(),
      User.findById(removeId).select("name").lean(),
    ]);
    emitSystemMessage(
      id,
      `${actor?.name || "Alguém"} removeu ${targetUserDoc?.name || "um membro"} do grupo.`,
    );

    audit({
      action: "room.remove_member",
      actorId: myId.toString(),
      targetId: removeId,
      ip: req.ip,
      details: { roomId: id },
    });

    broadcastRoomUpdated(id, updated);
    res.json(updated);
  } catch (error) {
    handleError(error, res, "Erro ao remover membro.");
  }
}

export async function deleteRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req.params.id);
    const myId = req.user!._id;

    const room = await Room.findById(id).select("type participants createdBy avatar").lean();
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }

    if (!room.participants.some((p) => p.toString() === myId.toString())) {
      throw new ForbiddenError("Você não participa desta conversa.");
    }

    if (room.type === "group" && !isRoomCreator(room, myId.toString())) {
      throw new ForbiddenError("Apenas o criador pode excluir o grupo.");
    }

    const io = getSocketIO();

    if (room.type === "direct") {
      const updated = await Room.findByIdAndUpdate(
        id,
        { $pull: { participants: myId } },
        { new: true },
      )
        .select("participants type name")
        .populate("participants", "name email avatar status")
        .lean();

      const remainingParticipants = updated?.participants ?? [];
      if (remainingParticipants.length === 0) {
        const messages = await Message.find({ room: id }).select("attachments").lean();
        await deleteCloudinaryAttachments(messages.flatMap((m) => m.attachments ?? []));
        await Message.deleteMany({ room: id });
        await Room.findByIdAndDelete(id);
      }

      if (io) {
        if (remainingParticipants.length > 0) {
          io.to(id).emit("room_updated", updated);
        } else {
          io.to(id).emit("room_deleted", id);
        }
        const sockets = await io.in(id).fetchSockets();
        for (const s of sockets) {
          s.leave(id);
        }
      }

      audit({
        action: "room.delete",
        actorId: myId.toString(),
        ip: req.ip,
        details: { roomId: id, type: "direct", remainingParticipants: remainingParticipants.length },
      });

      res.json({ message: "Conversa excluída com sucesso." });
      return;
    }

    if (room.avatar) {
      const publicId = cloudinaryPublicIdFromUrl(room.avatar, GROUP_PHOTO_FOLDER);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          logger.error({ publicId, error }, "erro ao remover avatar do grupo no Cloudinary");
        }
      }
    }

    const messages = await Message.find({ room: id }).select("attachments").lean();
    await deleteCloudinaryAttachments(messages.flatMap((m) => m.attachments ?? []));

    await Message.deleteMany({ room: id });
    await Room.findByIdAndDelete(id);

    if (io) {
      io.to(id).emit("room_deleted", id);
      const sockets = await io.in(id).fetchSockets();
      for (const s of sockets) {
        s.leave(id);
      }
    }

    audit({
      action: "room.delete",
      actorId: myId.toString(),
      ip: req.ip,
      details: { roomId: id },
    });

    res.json({ message: "Conversa excluída com sucesso." });
  } catch (error) {
    handleError(error, res, "Erro ao excluir conversa.");
  }
}

export async function addAdmin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req.params.id);
    const { userId: newAdminId } = req.body;
    const myId = req.user!._id;

    const room = await Room.findById(id).select("type createdBy participants admins").lean();
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
      throw new BadRequestError("Apenas grupos podem ter administradores.");
    }

    if (!isRoomCreator(room, myId.toString())) {
      throw new ForbiddenError("Apenas o criador pode definir administradores.");
    }

    if (!room.createdBy || newAdminId === room.createdBy.toString()) {
      throw new BadRequestError("O criador já administra o grupo.");
    }

    if (!room.participants.some((p) => p.toString() === newAdminId)) {
      throw new BadRequestError("Usuário não participa do grupo.");
    }

    if (room.admins.some((a) => a.toString() === newAdminId)) {
      throw new BadRequestError("Usuário já é administrador do grupo.");
    }

    const updated = await Room.findByIdAndUpdate(
      id,
      { $addToSet: { admins: newAdminId } },
      { new: true, runValidators: true },
    )
      .populate("participants", "name email avatar status")
      .populate("admins", "name email avatar status")
      .lean();

    const [actor, targetUserDoc] = await Promise.all([
      User.findById(myId).select("name").lean(),
      User.findById(newAdminId).select("name").lean(),
    ]);
    emitSystemMessage(
      id,
      `${actor?.name || "Alguém"} promoveu ${targetUserDoc?.name || "um membro"} a administrador do grupo.`,
    );

    audit({
      action: "room.add_admin",
      actorId: myId.toString(),
      targetId: newAdminId,
      ip: req.ip,
      details: { roomId: id },
    });

    broadcastRoomUpdated(id, updated);
    res.json(updated);
  } catch (error) {
    handleError(error, res, "Erro ao definir administrador.");
  }
}

export async function removeAdmin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req.params.id);
    const { userId: removeAdminId } = req.params as unknown as { userId: string };
    const myId = req.user!._id;

    const room = await Room.findById(id).select("type createdBy participants admins").lean();
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
      throw new BadRequestError("Apenas grupos podem ter administradores.");
    }

    if (!isRoomCreator(room, myId.toString())) {
      throw new ForbiddenError("Apenas o criador pode remover administradores.");
    }

    if (!room.admins.some((a) => a.toString() === removeAdminId)) {
      throw new BadRequestError("Usuário não é administrador do grupo.");
    }

    const updated = await Room.findByIdAndUpdate(
      id,
      { $pull: { admins: removeAdminId } },
      { new: true, runValidators: true },
    )
      .populate("participants", "name email avatar status")
      .populate("admins", "name email avatar status")
      .lean();

    const [actor, targetUserDoc] = await Promise.all([
      User.findById(myId).select("name").lean(),
      User.findById(removeAdminId).select("name").lean(),
    ]);
    emitSystemMessage(
      id,
      `${actor?.name || "Alguém"} rebaixou ${targetUserDoc?.name || "um administrador"} a membro.`,
    );

    audit({
      action: "room.remove_admin",
      actorId: myId.toString(),
      targetId: removeAdminId,
      ip: req.ip,
      details: { roomId: id },
    });

    broadcastRoomUpdated(id, updated);
    res.json(updated);
  } catch (error) {
    handleError(error, res, "Erro ao remover administrador.");
  }
}

export async function updateGroupAvatar(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req.params.id);
    const myId = req.user!._id;

    if (!req.file) {
      throw new BadRequestError("Nenhuma imagem enviada.");
    }

    const room = await Room.findById(id).select("type createdBy admins avatar").lean();
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
      throw new BadRequestError("Apenas grupos podem ter avatar.");
    }

    if (!isRoomCreatorOrAdmin(room, myId.toString())) {
      throw new ForbiddenError("Sem permissão para alterar o avatar do grupo.");
    }

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    if (room.avatar) {
      const oldPublicId = cloudinaryPublicIdFromUrl(room.avatar, GROUP_PHOTO_FOLDER);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (error) {
          logger.error({ publicId: oldPublicId, error }, "erro ao remover avatar antigo do grupo");
        }
      }
    }

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: GROUP_PHOTO_FOLDER,
      transformation: [{ width: 256, height: 256, crop: "fill" }],
    });

    const updated = await Room.findByIdAndUpdate(
      id,
      { avatar: result.secure_url },
      { new: true, runValidators: true },
    )
      .populate("participants", "name email avatar status")
      .populate("admins", "name email avatar status")
      .lean();

    const actor = await User.findById(myId).select("name").lean();
    emitSystemMessage(
      id,
      `${actor?.name || "Alguém"} alterou a foto do grupo.`,
    );

    broadcastRoomUpdated(id, updated);
    res.json(updated);
  } catch (error) {
    handleError(error, res, "Erro ao atualizar avatar do grupo.");
  }
}

export async function removeGroupAvatar(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req.params.id);
    const myId = req.user!._id;

    const room = await Room.findById(id).select("type createdBy admins avatar").lean();
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
      throw new BadRequestError("Apenas grupos podem ter avatar.");
    }

    if (!isRoomCreatorOrAdmin(room, myId.toString())) {
      throw new ForbiddenError("Sem permissão para alterar o avatar do grupo.");
    }

    if (room.avatar) {
      const publicId = cloudinaryPublicIdFromUrl(room.avatar, GROUP_PHOTO_FOLDER);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          logger.error({ publicId, error }, "erro ao remover avatar do grupo");
        }
      }
    }

    const updated = await Room.findByIdAndUpdate(
      id,
      { avatar: "" },
      { new: true, runValidators: true },
    )
      .populate("participants", "name email avatar status")
      .populate("admins", "name email avatar status")
      .lean();

    broadcastRoomUpdated(id, updated);
    res.json(updated);
  } catch (error) {
    handleError(error, res, "Erro ao remover avatar do grupo.");
  }
}

export async function getPinnedMessages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req.params.id);
    const myId = req.user!._id;

    const room = await Room.findById(id).select("participants pinnedMessages").lean();
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }

    if (!room.participants.some((p) => p.toString() === myId.toString())) {
      throw new ForbiddenError("Acesso negado.");
    }

    const pinned = (room.pinnedMessages ?? [])
      .slice()
      .sort((a, b) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime());

    const messageIds = pinned.map((p) => p.message);
    const messages = await Message.find({ _id: { $in: messageIds } })
      .populate("sender", "name avatar status")
      .populate({
        path: "parentMessage",
        select: "sender content attachments deleted",
        populate: { path: "sender", select: "name avatar status" },
      })
      .lean();

    const messageMap = new Map(messages.map((m) => [m._id.toString(), m]));
    const result = pinned
      .map((p) => ({
        ...p,
        pinnedAt: p.pinnedAt,
        message: messageMap.get(p.message.toString()) ?? null,
      }))
      .filter((p) => p.message != null);

    res.json({ pinnedMessages: result });
  } catch (error) {
    handleError(error, res, "Erro ao buscar mensagens fixadas.");
  }
}
