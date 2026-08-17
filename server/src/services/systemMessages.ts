import Message from "../models/Message";
import { getSocketIO } from "../config/io";
import { logger } from "../config/logger";

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

    const populated = await message.populate("sender", "name avatar status");

    getSocketIO()?.to(roomId).emit("message", populated.toObject());
  } catch (error) {
    logger.error({ error }, "erro ao criar mensagem de sistema");
  }
}