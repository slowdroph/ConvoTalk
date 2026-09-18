import Message from "../models/Message";
import Room from "../models/Room";
import ReadLog from "../models/ReadLog";
import { socketReadManySchema, safeParse } from "../validations/socket";
import type { ConnectionContext } from "./shared";
import { isRoomParticipant } from "./shared";
import { logger } from "../config/logger";

export function registerReadHandlers(ctx: ConnectionContext): void {
    const { io, socket, userId } = ctx;

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

                if (socket.sessionId) {
                    const readLogEntries = messageIds.map((messageId) => ({
                        userId,
                        sessionId: socket.sessionId,
                        messageId,
                        roomId,
                        readAt: new Date(),
                    }));
                    await ReadLog.insertMany(readLogEntries, { ordered: false }).catch((err) => {
                        if (err?.code !== 11000) {
                            logger.error({ userId, error: err }, "erro ao salvar read logs");
                        }
                    });
                }

                io.to(roomId).emit("messages_read", {
                    messageIds,
                    userId,
                });
            } catch (error) {
                logger.error(
                    { userId, error },
                    "erro ao marcar mensagens como lidas",
                );
            }
        },
    );
}
