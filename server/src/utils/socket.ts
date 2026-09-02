import { Server as SocketIOServer } from "socket.io";
import { logger } from "../config/logger";

export async function emitForceLogout(
    io: SocketIOServer,
    targetUserId: string,
    reason: "remote_logout" | "all_devices" | "password_changed" | "session_expired",
    targetSessionId?: string,
): Promise<void> {
    const { getUserSocketIds } = await import("../socket/onlineUsers");
    const socketIds = getUserSocketIds(targetUserId);
    if (!socketIds?.size) return;

    for (const socketId of socketIds) {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket) continue;
        if (targetSessionId && (socket as { sessionId?: string }).sessionId !== targetSessionId) continue;
        socket.emit("session:force_logout", { reason });
        socket.disconnect(true);
    }
    logger.info({ targetUserId, reason, targetSessionId }, "force logout emitted and socket disconnected");
}
