import { socketTypingSchema, safeParse } from "../validations/socket";
import {
    isTypingThrottled,
    scheduleTypingTimeout,
    clearTypingTimer,
} from "./rateLimit";
import type { ConnectionContext } from "./shared";
import { isRoomParticipant } from "./shared";

export function registerTypingHandler(ctx: ConnectionContext): void {
    const { socket, userId } = ctx;
    const user = ctx.userDoc;

    socket.on(
        "typing",
        async (data: { roomId: string; isTyping: boolean }) => {
            const parsed = safeParse(socketTypingSchema, data);
            if (!parsed.success) return;
            if (!(await isRoomParticipant(parsed.data.roomId, userId)))
                return;
            const typingKey = `${userId}:${parsed.data.roomId}`;
            if (parsed.data.isTyping) {
                if (isTypingThrottled(typingKey)) return;
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
                roomId: parsed.data.roomId,
                userId,
                name: user?.name,
                avatar: user?.avatar,
                isTyping: parsed.data.isTyping,
            });
        },
    );
}
