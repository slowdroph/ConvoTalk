import Message from "../models/Message";
import Room from "../models/Room";
import { deleteCloudinaryAttachments } from "../services/cloudinary";
import type { IAttachment } from "../types";
import { isRoomCreatorOrAdmin } from "../utils/roomAuth";
import {
    socketDeleteMessageSchema,
    socketEditMessageSchema,
    socketReactionSchema,
    socketClearConversationSchema,
    safeParse,
} from "../validations/socket";
import { isRateLimited } from "./rateLimit";
import { getUserSocketIds } from "./onlineUsers";
import type { ConnectionContext } from "./shared";
import {
    isRoomParticipant,
    extractMentionsFromContent,
    triggerMentionNotifications,
    isDuplicateClientMessageId,
} from "./shared";
import { logger } from "../config/logger";

export function registerMessageActionsHandlers(ctx: ConnectionContext): void {
    const { io, socket, userId, getSenderInfo } = ctx;

    socket.on(
        "delete_message",
        async (data: {
            messageId: string;
            roomId: string;
            forMe?: boolean;
        }) => {
            try {
                const parsed = safeParse(socketDeleteMessageSchema, data);
                if (!parsed.success) return;
                const { messageId, roomId, forMe } = parsed.data;

                if (forMe) {
                    const message = await Message.findById(messageId)
                        .select("room")
                        .lean();
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

                const message = await Message.findById(messageId)
                    .select("sender room attachments")
                    .lean();
                if (!message || !message.sender) return;
                if (message.sender.toString() !== userId) return;
                if (message.room.toString() !== roomId) return;
                if (!(await isRoomParticipant(roomId, userId))) return;

                await deleteCloudinaryAttachments(
                    message.attachments as IAttachment[] | undefined,
                );
                await Message.findByIdAndDelete(messageId);

                const lastMsg = await Message.findOne({
                    room: roomId,
                    deleted: { $ne: true },
                    type: { $ne: "system" },
                })
                    .sort({ createdAt: -1 })
                    .select("createdAt")
                    .lean();

                await Room.findByIdAndUpdate(roomId, {
                    lastMessageAt: lastMsg?.createdAt ?? null,
                });

                io.to(roomId).emit("message_deleted", messageId);
            } catch (error) {
                logger.error({ userId, error }, "erro ao excluir mensagem");
            }
        },
    );

    socket.on(
        "edit_message",
        async (
            data: { messageId: string; roomId: string; content: string },
            ack?: (res: { error?: string }) => void,
        ) => {
            try {
                if (isRateLimited(socket.id)) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Ação rápida demais. Aguarde um pouco.",
                        });
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

                const message = await Message.findById(messageId)
                    .select("sender room mentions")
                    .lean();
                if (!message || !message.sender) {
                    ack?.({ error: "Mensagem não encontrada." });
                    return;
                }
                if (message.sender.toString() !== userId) {
                    ack?.({ error: "Você não é o autor desta mensagem." });
                    return;
                }
                if (message.room.toString() !== roomId) {
                    ack?.({ error: "Mensagem não pertence a esta sala." });
                    return;
                }
                if (!(await isRoomParticipant(roomId, userId))) {
                    ack?.({ error: "Você não participa desta conversa." });
                    return;
                }

                const oldMentions = message.mentions?.map(String) ?? [];
                const newMentions = await extractMentionsFromContent(content, roomId);

                const updated = await Message.findByIdAndUpdate(
                    messageId,
                    { content, edited: true, mentions: newMentions },
                    { new: true },
                )
                    .select("content edited updatedAt mentions")
                    .lean();
                if (!updated) {
                    ack?.({ error: "Erro ao editar mensagem." });
                    return;
                }

                const addedMentions = newMentions.filter(
                    (id) => !oldMentions.includes(id),
                );
                if (addedMentions.length > 0) {
                    const info = await getSenderInfo();
                    triggerMentionNotifications(io, roomId, userId, {
                        name: info?.name || "Usuário",
                        avatar: info?.avatar || "",
                    }, {
                        _id: updated._id,
                        content: updated.content,
                        createdAt: updated.createdAt,
                    }, addedMentions).catch(() => {});
                }

                io.to(roomId).emit("message_edited", {
                    messageId,
                    content: updated.content,
                    updatedAt: updated.updatedAt,
                    mentions: updated.mentions?.map(String) ?? [],
                });
                if (typeof ack === "function") {
                    ack({});
                }
            } catch (error) {
                logger.error({ userId, error }, "erro ao editar mensagem");
            }
        },
    );

    socket.on(
        "toggle_reaction",
        async (data: {
            messageId: string;
            roomId: string;
            emoji: string;
        }) => {
            try {
                const parsed = safeParse(socketReactionSchema, data);
                if (!parsed.success) return;
                const { messageId, roomId, emoji } = parsed.data;

                if (!(await isRoomParticipant(roomId, userId))) return;

                const messageExists = await Message.findOne({
                    _id: messageId,
                    room: roomId,
                })
                    .select("_id")
                    .lean();
                if (!messageExists) return;

                await Message.updateOne(
                    { _id: messageId },
                    [
                        {
                            $set: {
                                [`reactions.${emoji}`]: {
                                    $cond: {
                                        if: { $in: [userId, `$reactions.${emoji}`] },
                                        then: {
                                            $filter: {
                                                input: { $ifNull: [`$reactions.${emoji}`, []] },
                                                as: "u",
                                                cond: { $ne: ["$$u", userId] },
                                            },
                                        },
                                        else: {
                                            $setUnion: [
                                                { $ifNull: [`$reactions.${emoji}`, []] },
                                                [userId],
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    ],
                );

                const updated = await Message.findById(messageId)
                    .select("reactions")
                    .lean();
                const formatted: Record<string, string[]> = {};
                if (updated?.reactions) {
                    for (const [emoji, userIds] of Object.entries(
                        updated.reactions as unknown as Record<
                            string,
                            string[]
                        >,
                    )) {
                        formatted[emoji] = userIds.map((u) => u.toString());
                    }
                }

                io.to(roomId).emit("reaction_updated", {
                    messageId,
                    reactions: formatted,
                });
            } catch (error) {
                logger.error(
                    { userId, error },
                    "erro ao reagir à mensagem",
                );
            }
        },
    );

    socket.on(
        "clear_conversation",
        async (
            data: { roomId: string },
            ack?: (res: { error?: string }) => void,
        ) => {
            try {
                const parsed = safeParse(socketClearConversationSchema, data);
                if (!parsed.success) {
                    ack?.({ error: parsed.error });
                    return;
                }
                const { roomId } = parsed.data;

                if (!(await isRoomParticipant(roomId, userId))) {
                    ack?.({ error: "Você não participa desta conversa." });
                    return;
                }

                const room = await Room.findById(roomId)
                    .select("type createdBy admins")
                    .lean();
                if (room?.type === "group" && !isRoomCreatorOrAdmin(room, userId)) {
                    ack?.({ error: "Apenas o criador ou administradores podem limpar a conversa." });
                    return;
                }

                const messages = await Message.find({ room: roomId })
                    .select("attachments")
                    .lean();
                await deleteCloudinaryAttachments(
                    messages.flatMap((m) => m.attachments ?? []),
                );

                await Message.deleteMany({ room: roomId });

                await Room.findByIdAndUpdate(roomId, {
                    lastMessageAt: null,
                });

                io.to(roomId).emit("conversation_cleared", { roomId });
                ack?.({});
            } catch (error) {
                logger.error(
                    { userId, error },
                    "erro ao limpar conversa",
                );
                ack?.({ error: "Erro ao limpar conversa." });
            }
        },
    );
}
