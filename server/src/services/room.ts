import mongoose, { type QueryFilter } from "mongoose";
import Room from "../models/Room";
import User from "../models/User";
import Message from "../models/Message";
import type { IRoom } from "../types";
import { emitSystemMessage } from "./systemMessages";
import { escapeRegex } from "../utils/regex";
import cloudinary from "../config/cloudinary";
import { getSocketIO } from "../config/io";
import { isRoomCreator, isRoomCreatorOrAdmin } from "../utils/roomAuth";
import {
    deleteCloudinaryAttachments,
    cloudinaryPublicIdFromUrl,
} from "./cloudinary";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "../utils/errors";
import { logger } from "../config/logger";
import { invalidateRoom } from "../socket/roomCache";

const GROUP_PHOTO_FOLDER = "chat_app_groupPhoto";

function broadcastRoomUpdated(roomId: string, payload: unknown): void {
    getSocketIO()?.to(roomId).emit("room_updated", payload);
}

export async function getRoomsWithMeta(userId: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);

    const me = await User.findById(userId).select("blockedUsers").lean();
    const blocked = new Set(
        (me?.blockedUsers ?? []).map((id) => id.toString()),
    );

    const rooms = await Room.find({ participants: userId })
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
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
    let mentionAgg: { _id: mongoose.Types.ObjectId; count: number }[] = [];
    if (roomIds.length > 0) {
        const agg = await Message.aggregate([
            {
                $match: {
                    room: { $in: roomIds },
                    sender: { $ne: userObjId },
                    type: { $ne: "system" },
                    deleted: { $ne: true },
                    deletedFor: { $ne: userObjId },
                },
            },
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
                            {
                                $getField: {
                                    field: userId,
                                    input: "$roomInfo.lastReadAt",
                                },
                            },
                            null,
                        ],
                    },
                    isMention: {
                        $in: [userObjId, "$mentions"],
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
                    isMention: 1,
                },
            },
            {
                $facet: {
                    unread: [
                        { $match: { isUnread: true } },
                        { $group: { _id: "$room", count: { $sum: 1 } } },
                    ],
                    mentions: [
                        { $match: { isMention: true, isUnread: true } },
                        { $group: { _id: "$room", count: { $sum: 1 } } },
                    ],
                },
            },
        ]);
        unreadAgg = agg[0]?.unread ?? [];
        mentionAgg = agg[0]?.mentions ?? [];
    }

    const unreadMap = new Map(
        unreadAgg.map((u) => [u._id.toString(), u.count]),
    );
    const mentionMap = new Map(
        mentionAgg.map((u) => [u._id.toString(), u.count]),
    );

    let lastMsgMap = new Map<string, { content: string; createdAt: Date }>();
    if (roomIds.length > 0) {
        const lastMsgAgg = await Message.aggregate([
            { $match: { room: { $in: roomIds }, deleted: { $ne: true }, type: { $ne: "system" } } },
            { $sort: { createdAt: -1 as const } },
            { $group: { _id: "$room", content: { $first: "$content" }, createdAt: { $first: "$createdAt" } } },
        ]);
        lastMsgMap = new Map(
            lastMsgAgg.map((m) => [m._id.toString(), { content: m.content, createdAt: m.createdAt }]),
        );
    }

    return visibleRooms.map((r) => {
        const lastMsg = lastMsgMap.get(r._id.toString());
        return {
            ...r,
            unreadCount: unreadMap.get(r._id.toString()) || 0,
            mentionUnreadCount: mentionMap.get(r._id.toString()) || 0,
            lastMessageAt: r.lastMessageAt || r.createdAt,
            lastMessagePreview: lastMsg?.content ?? null,
        };
    });
}

export async function createDirectRoom(myId: string, otherUserId: string) {
    if (otherUserId === myId.toString()) {
        throw new BadRequestError(
            "Não é possível iniciar conversa consigo mesmo.",
        );
    }

    const targetUser = await User.findById(otherUserId)
        .select("_id")
        .lean();
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
    })
        .populate("participants", "name email publicId")
        .lean();

    if (existing) {
        return { room: existing, created: false };
    }

    const room = await Room.create({
        type: "direct",
        participants: [myId, otherUserId],
        name: "",
    });

    const populated = await Room.findById(room._id)
        .populate("participants", "name email publicId avatar status")
        .lean();

    return { room: populated, created: true };
}

export async function createGroupRoom(
    creatorId: string,
    name: string,
    description: string,
    participantIds: string[],
    visibility: "private" | "public" = "private",
) {
    const memberIds = Array.from(
        new Set<string>([
            creatorId.toString(),
            ...participantIds.filter(
                (id) => id !== creatorId.toString(),
            ),
        ]),
    );

    const existingUsers = await User.find({
        _id: { $in: memberIds },
    })
        .select("_id")
        .lean();
    if (existingUsers.length !== memberIds.length) {
        throw new BadRequestError("Um ou mais usuários não existem.");
    }

    const room = await Room.create({
        name,
        description: description || "",
        type: "group",
        visibility,
        createdBy: creatorId,
        participants: memberIds,
    });

    const populated = await Room.findById(room._id)
        .populate("participants", "name email publicId avatar status")
        .lean();

    const creator = await User.findById(creatorId).select("name").lean();
    const memberNames = await User.find({ _id: { $in: memberIds } })
        .select("name")
        .lean();
    emitSystemMessage(
        room._id.toString(),
        `${creator?.name || "Alguém"} criou o grupo com ${memberNames.length} participantes.`,
    );

    return populated;
}

export async function updateGroupRoom(
    roomId: string,
    myId: string,
    updates: { name?: string; description?: string },
) {
    const room = await Room.findById(roomId)
        .select("type createdBy participants admins name description")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
        throw new BadRequestError("Apenas grupos podem ser editados.");
    }

    if (
        updates.name !== undefined &&
        updates.name !== room.name &&
        !isRoomCreator(room, myId.toString())
    ) {
        throw new ForbiddenError("Apenas o criador pode renomear o grupo.");
    }
    if (
        updates.description !== undefined &&
        !isRoomCreatorOrAdmin(room, myId.toString())
    ) {
        throw new ForbiddenError("Sem permissão para editar o grupo.");
    }

    const filteredUpdates: { name?: string; description?: string } = {};
    if (updates.name !== undefined) filteredUpdates.name = updates.name;
    if (updates.description !== undefined) filteredUpdates.description = updates.description;

    const updated = await Room.findByIdAndUpdate(roomId, filteredUpdates, {
        new: true,
        runValidators: true,
    })
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
        .lean();

    const actor = await User.findById(myId).select("name").lean();
    if (filteredUpdates.name && filteredUpdates.name !== room.name) {
        emitSystemMessage(
            roomId,
            `${actor?.name || "Alguém"} renomeou o grupo para "${filteredUpdates.name}".`,
        );
    } else if (
        filteredUpdates.description !== undefined &&
        filteredUpdates.description !== room.description
    ) {
        emitSystemMessage(
            roomId,
            `${actor?.name || "Alguém"} atualizou a descrição do grupo.`,
        );
    }

    broadcastRoomUpdated(roomId, updated);
    return updated;
}

export async function updateGroupVisibility(
    roomId: string,
    myId: string,
    visibility: "private" | "public",
) {
    const room = await Room.findById(roomId)
        .select("type visibility createdBy admins participants name")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
        throw new BadRequestError("Apenas grupos possuem visibilidade.");
    }

    if (!isRoomCreatorOrAdmin(room, myId.toString())) {
        throw new ForbiddenError(
            "Apenas o criador ou administradores podem alterar a visibilidade.",
        );
    }

    if (room.visibility === visibility) {
        return Room.findById(roomId)
            .populate("participants", "name email publicId avatar status")
            .populate("admins", "name email publicId avatar status")
            .lean();
    }

    const updated = await Room.findByIdAndUpdate(
        roomId,
        { visibility },
        { new: true, runValidators: true },
    )
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
        .lean();

    invalidateRoom(roomId);

    const actor = await User.findById(myId).select("name").lean();
    emitSystemMessage(
        roomId,
        visibility === "public"
            ? `${actor?.name || "Alguém"} tornou o grupo público. Qualquer pessoa pode entrar.`
            : `${actor?.name || "Alguém"} tornou o grupo privado.`,
    );

    broadcastRoomUpdated(roomId, updated);
    return updated;
}

export interface PublicRoomListing {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    avatar: string;
    participantCount: number;
    createdAt: Date;
    visibility: "public";
}

export async function getPublicRooms(
    userId: string,
    query: string,
    limit: number,
    before?: string,
) {
    const filter: QueryFilter<IRoom> = {
        visibility: "public",
        type: "group",
        participants: { $ne: new mongoose.Types.ObjectId(userId) },
    };

    const term = query.trim();
    if (term) {
        filter.name = { $regex: escapeRegex(term), $options: "i" };
    }

    if (before) {
        filter._id = { $gt: new mongoose.Types.ObjectId(before) };
    }

    const found = await Room.find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .select("name description avatar participants createdAt visibility")
        .lean();

    const hasMore = found.length > limit;
    const page = hasMore ? found.slice(0, limit) : found;

    const rooms: PublicRoomListing[] = page.map((r) => ({
        _id: r._id,
        name: r.name,
        description: r.description ?? "",
        avatar: r.avatar ?? "",
        participantCount: (r.participants ?? []).length,
        createdAt: r.createdAt,
        visibility: "public" as const,
    }));

    return {
        rooms,
        nextCursor: hasMore ? page[page.length - 1]._id.toString() : null,
    };
}

export async function joinPublicRoom(roomId: string, myId: string) {
    const room = await Room.findById(roomId)
        .select("type visibility participants")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
        throw new BadRequestError("Apenas grupos podem ser ingressados.");
    }

    if (room.visibility !== "public") {
        throw new ForbiddenError("Este grupo é privado.");
    }

    if (
        (room.participants ?? []).some((p) => p.toString() === myId.toString())
    ) {
        throw new BadRequestError("Você já participa deste grupo.");
    }

    const updated = await Room.findByIdAndUpdate(
        roomId,
        { $addToSet: { participants: new mongoose.Types.ObjectId(myId) } },
        { new: true, runValidators: true },
    )
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
        .lean();

    invalidateRoom(roomId);

    const actor = await User.findById(myId).select("name").lean();
    emitSystemMessage(roomId, `${actor?.name || "Alguém"} entrou no grupo.`);

    broadcastRoomUpdated(roomId, updated);
    return updated;
}

export async function addMemberToRoom(roomId: string, myId: string, newMemberId: string) {
    const room = await Room.findById(roomId)
        .select("type createdBy participants admins")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
        throw new BadRequestError(
            "Apenas grupos podem ter membros adicionados.",
        );
    }

    if (!isRoomCreatorOrAdmin(room, myId.toString())) {
        throw new ForbiddenError("Sem permissão para adicionar membros.");
    }

    const targetUser = await User.findById(newMemberId)
        .select("_id")
        .lean();
    if (!targetUser) {
        throw new NotFoundError("Usuário não encontrado.");
    }

    if (room.participants.some((p) => p.toString() === newMemberId)) {
        throw new BadRequestError("Usuário já participa do grupo.");
    }

    const updated = await Room.findByIdAndUpdate(
        roomId,
        { $addToSet: { participants: newMemberId } },
        { new: true, runValidators: true },
    )
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
        .lean();
    invalidateRoom(roomId);

    const [actor, targetUserDoc] = await Promise.all([
        User.findById(myId).select("name").lean(),
        User.findById(newMemberId).select("name").lean(),
    ]);
    emitSystemMessage(
        roomId,
        `${actor?.name || "Alguém"} adicionou ${targetUserDoc?.name || "um novo membro"} ao grupo.`,
    );

    broadcastRoomUpdated(roomId, updated);
    return updated;
}

export async function removeMemberFromRoom(roomId: string, myId: string, removeId: string) {
    const room = await Room.findById(roomId)
        .select("type createdBy participants admins")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
        throw new BadRequestError(
            "Apenas grupos podem ter membros removidos.",
        );
    }

    if (!isRoomCreatorOrAdmin(room, myId.toString())) {
        throw new ForbiddenError("Sem permissão para remover membros.");
    }

    if (!room.createdBy || removeId === room.createdBy.toString()) {
        throw new BadRequestError(
            "O criador não pode ser removido do grupo.",
        );
    }

    if (!room.participants.some((p) => p.toString() === removeId)) {
        throw new BadRequestError("Usuário não participa do grupo.");
    }

    const updated = await Room.findByIdAndUpdate(
        roomId,
        { $pull: { participants: removeId, admins: removeId } },
        { new: true, runValidators: true },
    )
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
        .lean();
    invalidateRoom(roomId);

    const [actor, targetUserDoc] = await Promise.all([
        User.findById(myId).select("name").lean(),
        User.findById(removeId).select("name").lean(),
    ]);
    emitSystemMessage(
        roomId,
        `${actor?.name || "Alguém"} removeu ${targetUserDoc?.name || "um membro"} do grupo.`,
    );

    broadcastRoomUpdated(roomId, updated);
    return updated;
}

export async function leaveGroupRoom(roomId: string, myId: string) {
    const room = await Room.findById(roomId)
        .select("type createdBy participants admins")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
        throw new BadRequestError("Apenas grupos possuem saída de membros.");
    }

    const participantIds = (room.participants ?? []).map((p) => p.toString());
    if (!participantIds.includes(myId.toString())) {
        throw new ForbiddenError("Você não participa deste grupo.");
    }

    const isCreator = isRoomCreator(room, myId.toString());

    if (isCreator) {
        if (participantIds.length <= 1) {
            throw new BadRequestError(
                "Você é o único membro. Exclua o grupo em vez de sair.",
            );
        }
        const otherAdmins = (room.admins ?? [])
            .map((a) => a.toString())
            .filter((id) => id !== myId.toString());
        if (otherAdmins.length === 0) {
            throw new BadRequestError(
                "Promova um administrador antes de sair do grupo.",
            );
        }
        const successor = otherAdmins[0];
        const updated = await Room.findByIdAndUpdate(
            roomId,
            {
                $pull: {
                    participants: new mongoose.Types.ObjectId(myId),
                    admins: new mongoose.Types.ObjectId(myId),
                },
                $set: { createdBy: new mongoose.Types.ObjectId(successor) },
            },
            { new: true, runValidators: true },
        )
            .populate("participants", "name email publicId avatar status")
            .populate("admins", "name email publicId avatar status")
            .lean();
        invalidateRoom(roomId);

        const [actor, successorDoc] = await Promise.all([
            User.findById(myId).select("name").lean(),
            User.findById(successor).select("name").lean(),
        ]);
        emitSystemMessage(
            roomId,
            `${actor?.name || "Alguém"} saiu do grupo. ${successorDoc?.name || "Um administrador"} agora é o criador.`,
        );

        broadcastRoomUpdated(roomId, updated);
        return updated;
    }

    const updated = await Room.findByIdAndUpdate(
        roomId,
        {
            $pull: {
                participants: new mongoose.Types.ObjectId(myId),
                admins: new mongoose.Types.ObjectId(myId),
            },
        },
        { new: true, runValidators: true },
    )
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
        .lean();
    invalidateRoom(roomId);

    const actor = await User.findById(myId).select("name").lean();
    emitSystemMessage(roomId, `${actor?.name || "Alguém"} saiu do grupo.`);

    broadcastRoomUpdated(roomId, updated);
    return updated;
}

export async function deleteRoomService(roomId: string, myId: string) {
    const room = await Room.findById(roomId)
        .select("type participants createdBy avatar")
        .lean();
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
            roomId,
            { $pull: { participants: myId } },
            { new: true },
        )
            .select("participants type name")
            .populate("participants", "name email publicId avatar status")
            .lean();
        invalidateRoom(roomId);

        const remainingParticipants = updated?.participants ?? [];
        if (remainingParticipants.length === 0) {
            const messages = await Message.find({ room: roomId })
                .select("attachments")
                .lean();
            await deleteCloudinaryAttachments(
                messages.flatMap((m) => m.attachments ?? []),
            );
            await Message.deleteMany({ room: roomId });
            await Room.findByIdAndDelete(roomId);
        }

        if (io) {
            if (remainingParticipants.length > 0) {
                io.to(roomId).emit("room_updated", updated);
            } else {
                io.to(roomId).emit("room_deleted", roomId);
            }
            const sockets = await io.in(roomId).fetchSockets();
            for (const s of sockets) {
                s.leave(roomId);
            }
        }

        return { type: "direct" as const, remainingParticipants: remainingParticipants.length };
    }

    if (room.avatar) {
        const publicId = cloudinaryPublicIdFromUrl(
            room.avatar,
            GROUP_PHOTO_FOLDER,
        );
        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (error) {
                logger.error(
                    { publicId, error },
                    "erro ao remover avatar do grupo no Cloudinary",
                );
            }
        }
    }

    const messages = await Message.find({ room: roomId })
        .select("attachments")
        .lean();
    await deleteCloudinaryAttachments(
        messages.flatMap((m) => m.attachments ?? []),
    );

    await Message.deleteMany({ room: roomId });
    await Room.findByIdAndDelete(roomId);

    if (io) {
        io.to(roomId).emit("room_deleted", roomId);
        const sockets = await io.in(roomId).fetchSockets();
        for (const s of sockets) {
            s.leave(roomId);
        }
    }

    return { type: "group" as const };
}

export async function addAdminToRoom(roomId: string, myId: string, newAdminId: string) {
    const room = await Room.findById(roomId)
        .select("type createdBy participants admins")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
        throw new BadRequestError(
            "Apenas grupos podem ter administradores.",
        );
    }

    if (!isRoomCreator(room, myId.toString())) {
        throw new ForbiddenError(
            "Apenas o criador pode definir administradores.",
        );
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
        roomId,
        { $addToSet: { admins: newAdminId } },
        { new: true, runValidators: true },
    )
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
        .lean();

    const [actor, targetUserDoc] = await Promise.all([
        User.findById(myId).select("name").lean(),
        User.findById(newAdminId).select("name").lean(),
    ]);
    emitSystemMessage(
        roomId,
        `${actor?.name || "Alguém"} promoveu ${targetUserDoc?.name || "um membro"} a administrador do grupo.`,
    );

    broadcastRoomUpdated(roomId, updated);
    return updated;
}

export async function removeAdminFromRoom(roomId: string, myId: string, removeAdminId: string) {
    const room = await Room.findById(roomId)
        .select("type createdBy participants admins")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
        throw new BadRequestError(
            "Apenas grupos podem ter administradores.",
        );
    }

    if (!isRoomCreator(room, myId.toString())) {
        throw new ForbiddenError(
            "Apenas o criador pode remover administradores.",
        );
    }

    if (!room.admins.some((a) => a.toString() === removeAdminId)) {
        throw new BadRequestError("Usuário não é administrador do grupo.");
    }

    const updated = await Room.findByIdAndUpdate(
        roomId,
        { $pull: { admins: removeAdminId } },
        { new: true, runValidators: true },
    )
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
        .lean();

    const [actor, targetUserDoc] = await Promise.all([
        User.findById(myId).select("name").lean(),
        User.findById(removeAdminId).select("name").lean(),
    ]);
    emitSystemMessage(
        roomId,
        `${actor?.name || "Alguém"} rebaixou ${targetUserDoc?.name || "um administrador"} a membro.`,
    );

    broadcastRoomUpdated(roomId, updated);
    return updated;
}

export async function updateGroupAvatar(
    roomId: string,
    myId: string,
    fileBuffer: Buffer,
    mimetype: string,
) {
    const room = await Room.findById(roomId)
        .select("type createdBy admins avatar")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
        throw new BadRequestError("Apenas grupos podem ter avatar.");
    }

    if (!isRoomCreatorOrAdmin(room, myId.toString())) {
        throw new ForbiddenError(
            "Sem permissão para alterar o avatar do grupo.",
        );
    }

    const dataUri = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;

    if (room.avatar) {
        const oldPublicId = cloudinaryPublicIdFromUrl(
            room.avatar,
            GROUP_PHOTO_FOLDER,
        );
        if (oldPublicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId);
            } catch (error) {
                logger.error(
                    { publicId: oldPublicId, error },
                    "erro ao remover avatar antigo do grupo",
                );
            }
        }
    }

    const result = await cloudinary.uploader.upload(dataUri, {
        folder: GROUP_PHOTO_FOLDER,
        transformation: [{ width: 256, height: 256, crop: "fill" }],
    });

    const updated = await Room.findByIdAndUpdate(
        roomId,
        { avatar: result.secure_url },
        { new: true, runValidators: true },
    )
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
        .lean();

    const actor = await User.findById(myId).select("name").lean();
    emitSystemMessage(
        roomId,
        `${actor?.name || "Alguém"} alterou a foto do grupo.`,
    );

    broadcastRoomUpdated(roomId, updated);
    return updated;
}

export async function removeGroupAvatarService(roomId: string, myId: string) {
    const room = await Room.findById(roomId)
        .select("type createdBy admins avatar")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (room.type !== "group") {
        throw new BadRequestError("Apenas grupos podem ter avatar.");
    }

    if (!isRoomCreatorOrAdmin(room, myId.toString())) {
        throw new ForbiddenError(
            "Sem permissão para alterar o avatar do grupo.",
        );
    }

    if (room.avatar) {
        const publicId = cloudinaryPublicIdFromUrl(
            room.avatar,
            GROUP_PHOTO_FOLDER,
        );
        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (error) {
                logger.error(
                    { publicId, error },
                    "erro ao remover avatar do grupo",
                );
            }
        }
    }

    const updated = await Room.findByIdAndUpdate(
        roomId,
        { avatar: "" },
        { new: true, runValidators: true },
    )
        .populate("participants", "name email publicId avatar status")
        .populate("admins", "name email publicId avatar status")
        .lean();

    broadcastRoomUpdated(roomId, updated);
    return updated;
}

export async function getPinnedMessages(roomId: string, myId: string) {
    const room = await Room.findById(roomId)
        .select("participants pinnedMessages")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (!room.participants.some((p) => p.toString() === myId.toString())) {
        throw new ForbiddenError("Acesso negado.");
    }

    const pinned = (room.pinnedMessages ?? [])
        .slice()
        .sort(
            (a, b) =>
                new Date(b.pinnedAt).getTime() -
                new Date(a.pinnedAt).getTime(),
        );

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
    return pinned
        .map((p) => ({
            ...p,
            pinnedAt: p.pinnedAt,
            message: messageMap.get(p.message.toString()) ?? null,
        }))
        .filter((p) => p.message != null);
}
