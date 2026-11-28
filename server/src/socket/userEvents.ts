import { EventEmitter } from "events";
import { getSocketIO } from "../config/io";
import { emitToUser } from "../utils/socket";
import { logger } from "../config/logger";

const userEvents = new EventEmitter();
userEvents.setMaxListeners(0);

export function onUserVerified(
    userId: string,
    listener: () => void,
): () => void {
    const event = `verified:${userId}`;
    userEvents.on(event, listener);
    return () => userEvents.off(event, listener);
}

export async function notifyUserVerified(userId: string): Promise<void> {
    userEvents.emit(`verified:${userId}`, userId);

    const io = getSocketIO();
    if (!io) return;

    try {
        await emitToUser(io, userId, "user:verified", { verified: true });
    } catch (error) {
        logger.error({ error, userId }, "erro ao emitir user:verified");
    }
}
