import Message from "../models/Message";
import Room from "../models/Room";
import {
    socketMessageSchema,
    socketReplySchema,
    safeParse,
} from "../validations/socket";
import {
    getClientIp,
    isRateLimited,
    isIpEventRateLimited,
    isRoomRateLimited,
} from "./rateLimit";
import type { ConnectionContext, ParentMessageLean } from "./shared";
import {
    senderPayloadFrom,
    parentPayload,
    isDuplicateClientMessageId,
    isRoomParticipant,
    isRoomBlocked,
    triggerPushForRoom,
    triggerMentionNotifications,
    extractMentionsFromContent,
} from "./shared";
import { logger } from "../config/logger";

export function registerMessageHandlers(ctx: ConnectionContext): void {
    const { io, socket, userId, getSenderInfo } = ctx;

    socket.on(
        "message",
        async (
            data: {
                roomId: string;
                content: string;
                clientMessageId?: string;
                attachments?: {
                    url: string;
                    filename: string;
                    mimetype: string;
                    size: number;
                    publicId: string;
                }[];
            },
            ack?: (res: { error?: string }) => void,
        ) => {
            try {
                if (isRateLimited(socket.id)) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Você está enviando mensagens rápido demais. Aguarde um pouco.",
                        });
                    }
                    return;
                }

                if (isIpEventRateLimited(getClientIp(socket), "message")) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Muitas mensagens. Aguarde um pouco antes de continuar.",
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
                const { roomId, content, attachments, clientMessageId } =
                    parsed.data;

                if (isRoomRateLimited(roomId, socket.id)) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Esta conversa está recebendo muitas mensagens. Aguarde um pouco.",
                        });
                    }
                    return;
                }

                if (!(await isRoomParticipant(roomId, userId))) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Você não participa desta conversa.",
                        });
                    }
                    return;
                }

                if (await isRoomBlocked(roomId, userId)) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Não é possível enviar mensagem para este usuário.",
                        });
                    }
                    return;
                }

                const info = await getSenderInfo();

                const mentions = await extractMentionsFromContent(content, roomId);

                const message = await Message.create({
                    sender: userId,
                    room: roomId,
                    content,
                    attachments: attachments || [],
                    clientMessageId: clientMessageId || null,
                    mentions,
                });

                Room.updateOne(
                    { _id: roomId },
                    { $set: { [`lastReadAt.${userId}`]: new Date(), lastMessageAt: new Date() } },
                ).catch((err) => {
                    logger.error({ userId, roomId, error: err }, "erro ao atualizar lastReadAt/lastMessageAt");
                });

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
                    mentions: message.mentions?.map(String) ?? [],
                    parentMessage: null,
                    createdAt: message.createdAt.toISOString(),
                    ...(clientMessageId ? { clientMessageId } : {}),
                };

                io.to(roomId).emit("message", payload);
                triggerPushForRoom(
                    roomId,
                    userId,
                    info?.name || "Usuário",
                    message.content || "",
                    String(message._id),
                ).catch(() => {});
                triggerMentionNotifications(io, roomId, userId, {
                    name: info?.name || "Usuário",
                    avatar: info?.avatar || "",
                }, {
                    _id: message._id,
                    content: message.content,
                    createdAt: message.createdAt,
                }).catch(() => {});
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

    socket.on(
        "reply",
        async (
            data: {
                roomId: string;
                parentId: string;
                content: string;
                attachments?: {
                    url: string;
                    filename: string;
                    mimetype: string;
                    size: number;
                    publicId: string;
                }[];
            },
            ack?: (res: { error?: string }) => void,
        ) => {
            try {
                if (isRateLimited(socket.id)) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Você está enviando mensagens rápido demais. Aguarde um pouco.",
                        });
                    }
                    return;
                }

                if (isIpEventRateLimited(getClientIp(socket), "reply")) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Muitas mensagens. Aguarde um pouco antes de continuar.",
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
                const {
                    roomId,
                    parentId,
                    content,
                    attachments,
                    clientMessageId,
                } = parsed.data;

                if (isRoomRateLimited(roomId, socket.id)) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Esta conversa está recebendo muitas mensagens. Aguarde um pouco.",
                        });
                    }
                    return;
                }

                if (!(await isRoomParticipant(roomId, userId))) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Você não participa desta conversa.",
                        });
                    }
                    return;
                }

                if (await isRoomBlocked(roomId, userId)) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Não é possível enviar mensagem para este usuário.",
                        });
                    }
                    return;
                }

                const parent = await Message.findOne({
                    _id: parentId,
                    room: roomId,
                })
                    .select("sender content attachments deleted")
                    .populate("sender", "name publicId avatar status")
                    .lean<ParentMessageLean>();
                if (!parent) {
                    if (typeof ack === "function") {
                        ack({ error: "Mensagem original não encontrada." });
                    }
                    return;
                }

                const info = await getSenderInfo();

                const mentions = await extractMentionsFromContent(content, roomId);

                const message = await Message.create({
                    sender: userId,
                    room: roomId,
                    content,
                    attachments: attachments || [],
                    parentMessage: parentId,
                    clientMessageId: clientMessageId || null,
                    mentions,
                });

                Room.updateOne(
                    { _id: roomId },
                    { $set: { [`lastReadAt.${userId}`]: new Date(), lastMessageAt: new Date() } },
                ).catch((err) => {
                    logger.error({ userId, roomId, error: err }, "erro ao atualizar lastReadAt/lastMessageAt");
                });

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
                    mentions: message.mentions?.map(String) ?? [],
                    parentMessage: parentPayload(parent),
                    createdAt: message.createdAt.toISOString(),
                    ...(clientMessageId ? { clientMessageId } : {}),
                };

                io.to(roomId).emit("message", payload);
                io.to(roomId).emit("thread_reply", {
                    parentId,
                    message: payload,
                });
                triggerPushForRoom(
                    roomId,
                    userId,
                    info?.name || "Usuário",
                    message.content || "",
                    String(message._id),
                ).catch(() => {});
                triggerMentionNotifications(io, roomId, userId, {
                    name: info?.name || "Usuário",
                    avatar: info?.avatar || "",
                }, {
                    _id: message._id,
                    content: message.content,
                    createdAt: message.createdAt,
                }).catch(() => {});
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
}
