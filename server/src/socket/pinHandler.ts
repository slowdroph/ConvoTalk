import Message from "../models/Message";
import Room from "../models/Room";
import { socketPinMessageSchema, safeParse } from "../validations/socket";
import { getClientIp, isIpEventRateLimited } from "./rateLimit";
import type { ConnectionContext } from "./shared";
import { isRoomParticipant } from "./shared";
import { logger } from "../config/logger";

export function registerPinHandlers(ctx: ConnectionContext): void {
    const { io, socket, userId } = ctx;

    socket.on(
        "pin_message",
        async (
            data: { roomId: string; messageId: string },
            ack?: (res: { error?: string }) => void,
        ) => {
            try {
                if (
                    isIpEventRateLimited(getClientIp(socket), "pin_message")
                ) {
                    if (typeof ack === "function") {
                        ack({
                            error: "Muitas ações de fixar. Aguarde um pouco.",
                        });
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
                        ack({
                            error: "Você não participa desta conversa.",
                        });
                    }
                    return;
                }

                const room = await Room.findById(roomId)
                    .select("pinnedMessages")
                    .lean();
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
                        ack({
                            error: "Limite de mensagens fixadas atingido.",
                        });
                    }
                    return;
                }

                const message = await Message.findOne({
                    _id: messageId,
                    room: roomId,
                })
                    .populate("sender", "name publicId avatar status")
                    .populate({
                        path: "parentMessage",
                        select: "sender content attachments deleted",
                        populate: {
                            path: "sender",
                            select: "name avatar status",
                        },
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
                        ack({
                            error: "Você não participa desta conversa.",
                        });
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
                logger.error(
                    { userId, error },
                    "erro ao desafixar mensagem",
                );
                if (typeof ack === "function") {
                    ack({ error: "Erro ao desafixar mensagem." });
                }
            }
        },
    );
}
