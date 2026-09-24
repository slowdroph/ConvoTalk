import Message from "../models/Message";
import { getSocketIO } from "../config/io";
import { logger } from "../config/logger";
import { PUBLIC_USER_SELECT } from "../constants";

export async function emitSystemMessage(
    roomId: string,
    content: string,
): Promise<void> {
    try {
        const message = await Message.create({
            sender: null,
            room: roomId,
            content,
            type: "system",
        });

        const populated = await message.populate(
            "sender",
            PUBLIC_USER_SELECT,
        );

        getSocketIO()?.to(roomId).emit("message", populated.toObject());
    } catch (error) {
        logger.error({ error }, "erro ao criar mensagem de sistema");
    }
}
