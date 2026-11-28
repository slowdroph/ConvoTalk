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
import type { MessageAck, MessageQuotaPayload } from "../../../shared/types";
import {
    consumeMessageQuota,
    refundMessageQuota,
} from "../services/messageQuota";
import { emitToUser } from "../utils/socket";

async function reserveMessageQuota(
    ctx: ConnectionContext,
    ack?: (res: MessageAck) => void,
): Promise<MessageQuotaPayload | null | undefined> {
    if (ctx.verified) return null;

    const result = await consumeMessageQuota(ctx.userId);

    if (result.verified) {
        ctx.verified = true;
        return null;
    }

    if (!result.allowed) {
        if (typeof ack === "function") {
            ack({
                error:
                    "Você atingiu o limite diário de mensagens. Confirme seu email para enviar sem limites.",
                code: "MESSAGE_QUOTA_EXCEEDED",
                quota: result.quota ?? undefined,
            });
        }
        return undefined;
    }

    return result.quota;
}

async function refundReservedQuota(
    ctx: ConnectionContext,
    quota: MessageQuotaPayload | null,
): Promise<void> {
    if (!quota) return;

    try {
        const updated = await refundMessageQuota(ctx.userId);
        if (updated) {
            await emitToUser(ctx.io, ctx.userId, "quota:update", updated);
        }
    } catch (error) {
        logger.error(
            { error, userId: ctx.userId },
            "erro ao devolver cota de mensagem",
        );
    }
}

function publishQuotaUpdate(
    ctx: ConnectionContext,
    quota: MessageQuotaPayload | null,
): void {
    if (!quota) return;
    void emitToUser(ctx.io, ctx.userId, "quota:update", quota).catch((error) => {
        logger.error(
            { error, userId: ctx.userId },
            "erro ao emitir quota:update",
        );
    });
}

async function isDuplicateSubmission(
    userId: string,
    clientMessageId?: string,
): Promise<boolean> {
    if (!clientMessageId) return false;
    return Boolean(await Message.exists({ sender: userId, clientMessageId }));
}

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
            ack?: (res: MessageAck) => void,
        ) => {
            let reservedQuota: MessageQuotaPayload | null = null;
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

                if (await isDuplicateSubmission(userId, clientMessageId)) {
                    if (typeof ack === "function") {
                        ack({});
                    }
                    return;
                }

                const info = await getSenderInfo();

                const mentions = await extractMentionsFromContent(content, roomId);

                const quota = await reserveMessageQuota(ctx, ack);
                if (quota === undefined) return;
                reservedQuota = quota;

                const message = await Message.create({
                    sender: userId,
                    room: roomId,
                    content,
                    attachments: attachments || [],
                    clientMessageId: clientMessageId || null,
                    mentions,
                });

                reservedQuota = null;
                publishQuotaUpdate(ctx, quota);

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
                await refundReservedQuota(ctx, reservedQuota);
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
            ack?: (res: MessageAck) => void,
        ) => {
            let reservedQuota: MessageQuotaPayload | null = null;
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

                if (await isDuplicateSubmission(userId, clientMessageId)) {
                    if (typeof ack === "function") {
                        ack({});
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

                const quota = await reserveMessageQuota(ctx, ack);
                if (quota === undefined) return;
                reservedQuota = quota;

                const message = await Message.create({
                    sender: userId,
                    room: roomId,
                    content,
                    attachments: attachments || [],
                    parentMessage: parentId,
                    clientMessageId: clientMessageId || null,
                    mentions,
                });

                reservedQuota = null;
                publishQuotaUpdate(ctx, quota);

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
                await refundReservedQuota(ctx, reservedQuota);
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
