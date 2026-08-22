import { Server as SocketIOServer } from "socket.io";
import type { OnlineUserPayload } from "@shared/types";

const onlineUsers: Map<string, Set<string>> = new Map();
const onlineUserInfo: Map<
    string,
    { name: string; avatar: string; status: string }
> = new Map();

export function setOnlineUserInfo(
    userId: string,
    info: { name: string; avatar: string; status: string },
): void {
    onlineUserInfo.set(userId, info);
}

export function addUserSocket(userId: string, socketId: string): void {
    const socketIds = onlineUsers.get(userId) || new Set<string>();
    socketIds.add(socketId);
    onlineUsers.set(userId, socketIds);
}

export function removeUserSocket(userId: string, socketId: string): void {
    const socketIds = onlineUsers.get(userId);
    if (!socketIds) return;
    socketIds.delete(socketId);
    if (socketIds.size === 0) {
        onlineUsers.delete(userId);
        onlineUserInfo.delete(userId);
    }
}

export function getUserSocketIds(userId: string): Set<string> | undefined {
    return onlineUsers.get(userId);
}

export function broadcastOnlineUsers(io: SocketIOServer): void {
    const users: OnlineUserPayload[] = Array.from(onlineUsers.keys()).map(
        (userId) => {
            const info = onlineUserInfo.get(userId);
            return {
                userId,
                name: info?.name || "Usuário",
                avatar: info?.avatar || "",
                status: info?.status || "",
                online: true,
            };
        },
    );
    io.emit("user_online", users);
}
