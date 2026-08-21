import { Server as SocketIOServer, Socket } from "socket.io";
import type { Types } from "mongoose";
import Message from "../models/Message";
import Room from "../models/Room";
import User from "../models/User";
import { deleteCloudinaryAttachments } from "../services/cloudinary";
import type { IAttachment } from "../types";
import {
  objectId,
  socketMessageSchema,
  socketReplySchema,
  socketTypingSchema,
  socketDeleteMessageSchema,
  socketEditMessageSchema,
  socketReactionSchema,
  socketReadManySchema,
  socketPinMessageSchema,
  safeParse,
} from "../validations/socket";
import { logger } from "../config/logger";
import {
  getClientIp,
  isRateLimited,
  isIpEventRateLimited,
  isRoomRateLimited,
  isTypingThrottled,
  scheduleTypingTimeout,
  clearTypingTimer,
  cleanupSocketRateLimits,
  clearTypingForUser,
} from "./rateLimit";
import {
  broadcastOnlineUsers,
  setOnlineUserInfo,
  addUserSocket,
  removeUserSocket,
  getUserSocketIds,
} from "./onlineUsers";
import { getRoomInfo } from "./roomCache";

interface SenderInfo {
    name: string;
    avatar: string;
    status: string;
}

interface PopulatedSender {
    _id?: Types.ObjectId | string;
    name?: string;
    avatar?: string;
    status?: string;
}

interface ParentMessageLean {
    _id: Types.ObjectId;
    sender?: Types.ObjectId | PopulatedSender | null;
    content?: string | null;
    attachments?: IAttachment[];
    deleted?: boolean;
}

function senderPayloadFrom(info: SenderInfo | null, userId: string) {
    return {
        _id: userId,
        name: info?.name ?? "Usuário",
        avatar: info?.avatar ?? "",
        status: info?.status ?? "",
    };
}

function parentPayload(parent: ParentMessageLean) {
    const sender = parent.sender;
    return {
        _id: String(parent._id),
        sender:
            sender && typeof sender === "object" && "name" in sender
                ? {
                      _id: String(sender._id),
                      name: sender.name,
                      avatar: sender.avatar,
                      status: sender.status,
                  }
                : null,
        content: parent.content ?? "",
        attachments: parent.attachments ?? [],
        deleted: !!parent.deleted,
    };
}

function isDuplicateClientMessageId(error: unknown): boolean {
    return (
        !!error &&
        typeof error === "object" &&
        (error as { code?: number }).code === 11000 &&
        !!(error as { keyPattern?: Record<string, unknown> })
            .keyPattern?.clientMessageId
    );
}

async function isRoomParticipant(roomId: string, userId: string): Promise<boolean> {
    const room = await getRoomInfo(roomId);
    if (!room) return false;
    return room.participants.includes(userId);
}

async function isBlockedBetween(a: string, b: string): Promise<boolean> {
    const blocked = await User.exists({
        _id: { $in: [a, b] },
        blockedUsers: { $in: [a, b] },
    });
    return !!blocked;
}

async function isRoomBlocked(roomId: string, userId: string): Promise<boolean> {
    const room = await getRoomInfo(roomId);
    if (!room) return false;
    if (room.type !== "direct") return false;
    const other = room.participants.find((p) => p !== userId);
    if (!other) return false;
    return isBlockedBetween(userId, other);
}

const socketHandler = (io: SocketIOServer): void => {
    io.on("connection", async (socket: Socket) => {
        const userId = socket.userId!;
        logger.info({ userId, socketId: socket.id }, "usuário conectado");

        // Registrar usuário online
        const user = await User.findById(userId).select("name avatar status");
        let senderInfo: SenderInfo | null = user
            ? {
                  name: user.name,
                  avatar: user.avatar || "",
                  status: user.status || "",
              }
            : null;
        const getSenderInfo = async (): Promise<SenderInfo | null> => {
            if (!senderInfo) {
                const fetched = await User.findById(userId)
                    .select("name avatar status")
                    .lean<{
                        name?: string;
                        avatar?: string;
                        status?: string;
                    }>();
                if (fetched) {
                    senderInfo = {
                        name: fetched.name ?? "Usuário",
                        avatar: fetched.avatar ?? "",
                        status: fetched.status ?? "",
                    };
                }
            }
            return senderInfo;
        };
        if (user) {
            setOnlineUserInfo(userId, {
                name: user.name,
                avatar: user.avatar || "",
                status: user.status || "",
            });
            addUserSocket(userId, socket.id);
            await User.updateOne(
                { _id: userId },
                { lastSeen: new Date(), lastIp: getClientIp(socket), lastIpAt: new Date() },
            );
            broadcastOnlineUsers(io);
        }

        // Entrar na sala
        socket.on("join", async (roomId: string) => {
          if (isIpEventRateLimited(getClientIp(socket), "join")) return;
          const parsed = objectId.safeParse(roomId);
          if (!parsed.success) return;

          const room = await Room.findById(parsed.data).select("participants").lean();
          if (!room) return;

          const isParticipant = room.participants.some(
            (p) => p.toString() === userId
          );
          if (!isParticipant) return;

          socket.join(parsed.data);
          logger.info({ userId, roomId: parsed.data }, "usuário entrou na sala");
        });

        // Sair da sala
        socket.on("leave", (roomId: string) => {
            socket.leave(roomId);
            logger.info({ userId, roomId }, "usuário saiu da sala");
        });

        // Enviar mensagem
        socket.on(
            "message",
            async (
                data: { roomId: string; content: string; clientMessageId?: string; attachments?: { url: string; filename: string; mimetype: string; size: number; publicId: string }[] },
                ack?: (res: { error?: string }) => void,
            ) => {
                try {
                    if (isRateLimited(socket.id)) {
                        if (typeof ack === "function") {
                            ack({
                                error:
                                    "Você está enviando mensagens rápido demais. Aguarde um pouco.",
                            });
                        }
                        return;
                    }

                    if (isIpEventRateLimited(getClientIp(socket), "message")) {
                        if (typeof ack === "function") {
                            ack({
                                error:
                                    "Muitas mensagens. Aguarde um pouco antes de continuar.",
                            });
                        }
                        return;
                    }

                    const parsed = safeParse(socketMessageSchema, data);
                    if (!parsed.success) {
                        if (typeof ack === "function") {
                            ack({ error: parsed.error });
                        }
                        return;
                    }
                    const { roomId, content, attachments, clientMessageId } = parsed.data;

                    if (isRoomRateLimited(roomId, socket.id)) {
                        if (typeof ack === "function") {
                            ack({
                                error:
                                    "Esta conversa está recebendo muitas mensagens. Aguarde um pouco.",
                            });
                        }
                        return;
                    }

                    if (!(await isRoomParticipant(roomId, userId))) {
                        if (typeof ack === "function") {
                            ack({ error: "Você não participa desta conversa." });
                        }
                        return;
                    }

                    if (await isRoomBlocked(roomId, userId)) {
                        if (typeof ack === "function") {
                            ack({ error: "Não é possível enviar mensagem para este usuário." });
                        }
                        return;
                    }

                    const info = await getSenderInfo();

                    // Índice único { sender, clientMessageId } cobre duplicatas:
                    // erro 11000 é tratado no catch abaixo.
                    const message = await Message.create({
                        sender: userId,
                        room: roomId,
                        content,
                        attachments: attachments || [],
                        clientMessageId: clientMessageId || null,
                    });

                    Room.updateOne(
                        { _id: roomId },
                        { $set: { [`lastReadAt.${userId}`]: new Date() } },
                    ).catch(() => {});

                    const payload = {
                        _id: String(message._id),
                        sender: senderPayloadFrom(info, userId),
                        content: message.content ?? "",
                        type: "text" as const,
                        room: roomId,
                        deleted: false,
                        edited: false,
                        reactions: {} as Record<string, string[]>,
                        attachments: (message.attachments ?? []).map((a) => ({
                            url: a.url,
                            filename: a.filename,
                            mimetype: a.mimetype,
                            size: a.size,
                            publicId: a.publicId,
                        })),
                        readBy: [] as string[],
                        parentMessage: null,
                        createdAt: message.createdAt.toISOString(),
                        ...(clientMessageId
                            ? { clientMessageId }
                            : {}),
                    };

                    io.to(roomId).emit("message", payload);
                    if (typeof ack === "function") {
                        ack({});
                    }
                } catch (error) {
                    if (isDuplicateClientMessageId(error)) {
                        if (typeof ack === "function") {
                            ack({});
                        }
                        return;
                    }
                    logger.error({ userId, error }, "erro ao salvar mensagem");
                    if (typeof ack === "function") {
                        ack({ error: "Erro ao enviar mensagem." });
                    }
                }
            },
        );

        // Responder a uma mensagem (thread)
        socket.on(
            "reply",
            async (
                data: { roomId: string; parentId: string; content: string; attachments?: { url: string; filename: string; mimetype: string; size: number; publicId: string }[] },
                ack?: (res: { error?: string }) => void,
            ) => {
                try {
                    if (isRateLimited(socket.id)) {
                        if (typeof ack === "function") {
                            ack({
                                error:
                                    "Você está enviando mensagens rápido demais. Aguarde um pouco.",
                            });
                        }
                        return;
                    }

                    if (isIpEventRateLimited(getClientIp(socket), "reply")) {
                        if (typeof ack === "function") {
                            ack({
                                error:
                                    "Muitas mensagens. Aguarde um pouco antes de continuar.",
                            });
                        }
                        return;
                    }

                    const parsed = safeParse(socketReplySchema, data);
                    if (!parsed.success) {
                        if (typeof ack === "function") {
                            ack({ error: parsed.error });
                        }
                        return;
                    }
                    const { roomId, parentId, content, attachments, clientMessageId } = parsed.data;

                    if (isRoomRateLimited(roomId, socket.id)) {
                        if (typeof ack === "function") {
                            ack({
                                error:
                                    "Esta conversa está recebendo muitas mensagens. Aguarde um pouco.",
                            });
                        }
                        return;
                    }

                    if (!(await isRoomParticipant(roomId, userId))) {
                        if (typeof ack === "function") {
                            ack({ error: "Você não participa desta conversa." });
                        }
                        return;
                    }

                    if (await isRoomBlocked(roomId, userId)) {
                        if (typeof ack === "function") {
                            ack({ error: "Não é possível enviar mensagem para este usuário." });
                        }
                        return;
                    }

                    const parent = await Message.findOne({
                        _id: parentId,
                        room: roomId,
                    })
                        .select("sender content attachments deleted")
                        .populate("sender", "name avatar status")
                        .lean<ParentMessageLean>();
                    if (!parent) {
                        if (typeof ack === "function") {
                            ack({ error: "Mensagem original não encontrada." });
                        }
                        return;
                    }

                    const info = await getSenderInfo();

                    const message = await Message.create({
                        sender: userId,
                        room: roomId,
                        content,
                        attachments: attachments || [],
                        parentMessage: parentId,
                        clientMessageId: clientMessageId || null,
                    });

                    Room.updateOne(
                        { _id: roomId },
                        { $set: { [`lastReadAt.${userId}`]: new Date() } },
                    ).catch(() => {});

                    const payload = {
                        _id: String(message._id),
                        sender: senderPayloadFrom(info, userId),
                        content: message.content ?? "",
                        type: "text" as const,
                        room: roomId,
                        deleted: false,
                        edited: false,
                        reactions: {} as Record<string, string[]>,
                        attachments: (message.attachments ?? []).map((a) => ({
                            url: a.url,
                            filename: a.filename,
                            mimetype: a.mimetype,
                            size: a.size,
                            publicId: a.publicId,
                        })),
                        readBy: [] as string[],
                        parentMessage: parentPayload(parent),
                        createdAt: message.createdAt.toISOString(),
                        ...(clientMessageId
                            ? { clientMessageId }
                            : {}),
                    };

                    io.to(roomId).emit("message", payload);
                    io.to(roomId).emit("thread_reply", {
                        parentId,
                        message: payload,
                    });
                    if (typeof ack === "function") {
                        ack({});
                    }
                } catch (error) {
                    if (isDuplicateClientMessageId(error)) {
                        if (typeof ack === "function") {
                            ack({});
                        }
                        return;
                    }
                    logger.error({ userId, error }, "erro ao salvar resposta");
                    if (typeof ack === "function") {
                        ack({ error: "Erro ao enviar resposta." });
                    }
                }
            },
        );

// Indicador de digitação
socket.on("typing", async (data: { roomId: string; isTyping: boolean }) => {
            const parsed = safeParse(socketTypingSchema, data);
            if (!parsed.success) return;
            if (!(await isRoomParticipant(parsed.data.roomId, userId))) return;
            const typingKey = `${userId}:${parsed.data.roomId}`;
            if (parsed.data.isTyping) {
                const key = `${socket.id}:${parsed.data.roomId}`;
                if (isTypingThrottled(key)) return;
                scheduleTypingTimeout(
                    socket,
                    parsed.data.roomId,
                    userId,
                    user?.name,
                    user?.avatar,
                );
            } else {
                clearTypingTimer(typingKey);
            }
            socket.to(parsed.data.roomId).emit("typing", {
                userId,
                name: user?.name,
                avatar: user?.avatar,
                isTyping: parsed.data.isTyping,
            });
        });

        // Excluir mensagem
        socket.on("delete_message", async (data: { messageId: string; roomId: string; forMe?: boolean }) => {
            try {
                const parsed = safeParse(socketDeleteMessageSchema, data);
                if (!parsed.success) return;
                const { messageId, roomId, forMe } = parsed.data;

                if (forMe) {
                    const message = await Message.findById(messageId).select("room").lean();
                    if (!message) return;
                    if (message.room.toString() !== roomId) return;
                    if (!(await isRoomParticipant(roomId, userId))) return;

                    await Message.findByIdAndUpdate(messageId, {
                        $addToSet: { deletedFor: userId },
                    });
                    const targetSockets = getUserSocketIds(userId);
                    if (targetSockets) {
                        for (const socketId of targetSockets) {
                            io.to(socketId).emit("message_deleted_for_me", {
                                messageId,
                                roomId,
                                userId,
                            });
                        }
                    }
                    return;
                }

                const message = await Message.findById(messageId).select("sender room attachments").lean();
                if (!message || !message.sender) return;
                if (message.sender.toString() !== userId) return;
                if (message.room.toString() !== roomId) return;
                if (!(await isRoomParticipant(roomId, userId))) return;

                await deleteCloudinaryAttachments(
                    message.attachments as IAttachment[] | undefined,
                );
                await Message.findByIdAndDelete(messageId);
                io.to(roomId).emit("message_deleted", messageId);
            } catch (error) {
                logger.error({ userId, error }, "erro ao excluir mensagem");
            }
        });

        // Editar mensagem
        socket.on("edit_message", async (data: { messageId: string; roomId: string; content: string }, ack?: (res: { error?: string }) => void) => {
            try {
                if (isRateLimited(socket.id)) {
                    if (typeof ack === "function") {
                        ack({ error: "Ação rápida demais. Aguarde um pouco." });
                    }
                    return;
                }

                const parsed = safeParse(socketEditMessageSchema, data);
                if (!parsed.success) {
                    if (typeof ack === "function") {
                        ack({ error: parsed.error });
                    }
                    return;
                }
                const { messageId, roomId, content } = parsed.data;

                const message = await Message.findById(messageId).select("sender room").lean();
                if (!message || !message.sender) return;
                if (message.sender.toString() !== userId) return;
                if (message.room.toString() !== roomId) return;
                if (!(await isRoomParticipant(roomId, userId))) return;

                const updated = await Message.findByIdAndUpdate(
                    messageId,
                    { content, edited: true },
                    { new: true },
                )
                    .select("content edited updatedAt")
                    .lean();
                if (!updated) return;
                io.to(roomId).emit("message_edited", {
                    messageId,
                    content: updated.content,
                    updatedAt: updated.updatedAt,
                });
            } catch (error) {
                logger.error({ userId, error }, "erro ao editar mensagem");
            }
        });

        // Reagir com emoji
        socket.on("toggle_reaction", async (data: { messageId: string; roomId: string; emoji: string }) => {
            try {
                const parsed = safeParse(socketReactionSchema, data);
                if (!parsed.success) return;
                const { messageId, roomId, emoji } = parsed.data;

                if (!(await isRoomParticipant(roomId, userId))) return;

                const messageExists = await Message.findOne({
                    _id: messageId,
                    room: roomId,
                }).select("_id").lean();
                if (!messageExists) return;

                const hasReacted = await Message.findOne({
                    _id: messageId,
                    [`reactions.${emoji}`]: userId,
                }).lean();

                if (hasReacted) {
                    await Message.updateOne(
                        { _id: messageId },
                        { $pull: { [`reactions.${emoji}`]: userId } },
                    );
                } else {
                    await Message.updateOne(
                        { _id: messageId },
                        { $addToSet: { [`reactions.${emoji}`]: userId } },
                    );
                }

                const updated = await Message.findById(messageId).select("reactions").lean();
                const formatted: Record<string, string[]> = {};
                if (updated?.reactions) {
                    for (const [emoji, userIds] of Object.entries(updated.reactions as unknown as Record<string, string[]>)) {
                        formatted[emoji] = userIds.map((u) => u.toString());
                    }
                }

                io.to(roomId).emit("reaction_updated", { messageId, reactions: formatted });
            } catch (error) {
                logger.error({ userId, error }, "erro ao reagir à mensagem");
            }
        });

        // Fixar mensagem
        socket.on(
            "pin_message",
            async (
                data: { roomId: string; messageId: string },
                ack?: (res: { error?: string }) => void,
            ) => {
                try {
                    if (isIpEventRateLimited(getClientIp(socket), "pin_message")) {
                        if (typeof ack === "function") {
                            ack({ error: "Muitas ações de fixar. Aguarde um pouco." });
                        }
                        return;
                    }
                    const parsed = safeParse(socketPinMessageSchema, data);
                    if (!parsed.success) {
                        if (typeof ack === "function") {
                            ack({ error: parsed.error });
                        }
                        return;
                    }
                    const { roomId, messageId } = parsed.data;

                    if (!(await isRoomParticipant(roomId, userId))) {
                        if (typeof ack === "function") {
                            ack({ error: "Você não participa desta conversa." });
                        }
                        return;
                    }

                    const room = await Room.findById(roomId).select("pinnedMessages").lean();
                    if (!room) {
                        if (typeof ack === "function") {
                            ack({ error: "Conversa não encontrada." });
                        }
                        return;
                    }

                    const existing = (room.pinnedMessages ?? []).some(
                        (p) => p.message.toString() === messageId,
                    );
                    if (existing) {
                        if (typeof ack === "function") {
                            ack({ error: "Mensagem já fixada." });
                        }
                        return;
                    }

                    if ((room.pinnedMessages ?? []).length >= 10) {
                        if (typeof ack === "function") {
                            ack({ error: "Limite de mensagens fixadas atingido." });
                        }
                        return;
                    }

                    const message = await Message.findOne({
                        _id: messageId,
                        room: roomId,
                    })
                        .populate("sender", "name avatar status")
                        .populate({
                            path: "parentMessage",
                            select: "sender content attachments deleted",
                            populate: { path: "sender", select: "name avatar status" },
                        })
                        .lean();
                    if (!message) {
                        if (typeof ack === "function") {
                            ack({ error: "Mensagem não encontrada." });
                        }
                        return;
                    }

                    await Room.updateOne(
                        { _id: roomId },
                        {
                            $push: {
                                pinnedMessages: {
                                    message: messageId,
                                    pinnedBy: userId,
                                    pinnedAt: new Date(),
                                },
                            },
                        },
                    );

                    io.to(roomId).emit("message_pinned", {
                        roomId,
                        message,
                        pinnedBy: userId,
                    });
                    if (typeof ack === "function") {
                        ack({});
                    }
                } catch (error) {
                    logger.error({ userId, error }, "erro ao fixar mensagem");
                    if (typeof ack === "function") {
                        ack({ error: "Erro ao fixar mensagem." });
                    }
                }
            },
        );

        // Desafixar mensagem
        socket.on(
            "unpin_message",
            async (
                data: { roomId: string; messageId: string },
                ack?: (res: { error?: string }) => void,
            ) => {
                try {
                    const parsed = safeParse(socketPinMessageSchema, data);
                    if (!parsed.success) {
                        if (typeof ack === "function") {
                            ack({ error: parsed.error });
                        }
                        return;
                    }
                    const { roomId, messageId } = parsed.data;

                    if (!(await isRoomParticipant(roomId, userId))) {
                        if (typeof ack === "function") {
                            ack({ error: "Você não participa desta conversa." });
                        }
                        return;
                    }

                    const updated = await Room.updateOne(
                        { _id: roomId },
                        {
                            $pull: {
                                pinnedMessages: { message: messageId },
                            },
                        },
                    );
                    if (updated.modifiedCount === 0) {
                        if (typeof ack === "function") {
                            ack({ error: "Mensagem não está fixada." });
                        }
                        return;
                    }

                    io.to(roomId).emit("message_unpinned", {
                        roomId,
                        messageId,
                    });
                    if (typeof ack === "function") {
                        ack({});
                    }
                } catch (error) {
                    logger.error({ userId, error }, "erro ao desafixar mensagem");
                    if (typeof ack === "function") {
                        ack({ error: "Erro ao desafixar mensagem." });
                    }
                }
            },
        );

        // Marcar mensagens como lidas
        socket.on(
            "read_messages",
            async (data: { roomId: string; messageIds: string[] }) => {
                try {
                    const parsed = safeParse(socketReadManySchema, data);
                    if (!parsed.success) return;
                    const { roomId, messageIds } = parsed.data;

                    if (!(await isRoomParticipant(roomId, userId))) return;

                    await Message.updateMany(
                        { _id: { $in: messageIds }, room: roomId },
                        { $addToSet: { readBy: userId } },
                    );

                    await Room.updateOne(
                        { _id: roomId },
                        { $set: { [`lastReadAt.${userId}`]: new Date() } },
                    );

                    io.to(roomId).emit("messages_read", {
                        messageIds,
                        userId,
                    });
                } catch (error) {
                    logger.error({ userId, error }, "erro ao marcar mensagens como lidas");
                }
            },
        );

        // Desconexão
        socket.on("disconnect", () => {
            removeUserSocket(userId, socket.id);
            cleanupSocketRateLimits(socket.id);
            clearTypingForUser(userId);
            User.updateOne({ _id: userId }, { lastSeen: new Date() }).catch(
                () => {
                    // falha silenciosa na atualização de lastSeen
                },
            );
            broadcastOnlineUsers(io);
            logger.info({ userId, socketId: socket.id }, "usuário desconectado");
        });
    });
};

export default socketHandler;
