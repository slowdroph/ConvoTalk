import { Server as SocketIOServer, Socket } from "socket.io";
import User from "../models/User";
import Session from "../models/Session";
import Room from "../models/Room";
import { getClientIp } from "./rateLimit";
import {
    broadcastOnlineUsers,
    setOnlineUserInfo,
    addUserSocket,
    removeUserSocket,
} from "./onlineUsers";
import { cleanupSocketRateLimits, clearTypingForUser } from "./rateLimit";
import { objectId } from "../validations/socket";
import { isIpEventRateLimited } from "./rateLimit";
import { logger } from "../config/logger";
import type { SenderInfo, ConnectionContext } from "./shared";
import { registerMessageHandlers } from "./messageHandler";
import { registerMessageActionsHandlers } from "./messageActionsHandler";
import { registerPinHandlers } from "./pinHandler";
import { registerReadHandlers } from "./readHandler";
import { registerTypingHandler } from "./typingHandler";

export const registerConnectionAndLifecycle = (io: SocketIOServer): void => {
    io.on("connection", async (socket: Socket) => {
        const userId = socket.userId!;
        logger.info({ userId, socketId: socket.id }, "usuário conectado");

        const user = await User.findById(userId).select("name publicId avatar status");
        let senderInfo: SenderInfo | null = user
            ? {
                  name: user.name,
                  publicId: user.publicId,
                  avatar: user.avatar || "",
                  status: user.status || "",
              }
            : null;
        const getSenderInfo = async (): Promise<SenderInfo | null> => {
            if (!senderInfo) {
                const fetched = await User.findById(userId)
                    .select("name publicId avatar status")
                    .lean<{
                        name?: string;
                        publicId?: string;
                        avatar?: string;
                        status?: string;
                    }>();
                if (fetched) {
                    senderInfo = {
                        name: fetched.name ?? "Usuário",
                        publicId: fetched.publicId ?? "",
                        avatar: fetched.avatar ?? "",
                        status: fetched.status ?? "",
                    };
                }
            }
            return senderInfo;
        };
        if (user) {
            setOnlineUserInfo(userId, {
                name: user.name,
                avatar: user.avatar || "",
                status: user.status || "",
            });
            addUserSocket(userId, socket.id);
            await User.updateOne(
                { _id: userId },
                {
                    lastSeen: new Date(),
                    lastIp: getClientIp(socket),
                    lastIpAt: new Date(),
                },
            );
            if (socket.sessionId) {
                await Session.updateOne(
                    { _id: socket.sessionId, userId },
                    { lastActiveAt: new Date() },
                ).catch(() => {});
            }
            broadcastOnlineUsers(io);
        }

        const ctx: ConnectionContext = {
            io,
            socket,
            userId,
            getSenderInfo,
            senderInfo,
            userDoc: user ? { name: user.name, avatar: user.avatar } : null,
        };

        socket.on("join", async (roomId: string) => {
            if (isIpEventRateLimited(getClientIp(socket), "join")) return;
            const parsed = objectId.safeParse(roomId);
            if (!parsed.success) return;

            const room = await Room.findById(parsed.data)
                .select("participants")
                .lean();
            if (!room) return;

            const isParticipant = room.participants.some(
                (p) => p.toString() === userId,
            );
            if (!isParticipant) return;

            socket.join(parsed.data);
            logger.info(
                { userId, roomId: parsed.data },
                "usuário entrou na sala",
            );
        });

        socket.on("leave", (roomId: string) => {
            const parsed = objectId.safeParse(roomId);
            if (!parsed.success) return;
            socket.leave(parsed.data);
            logger.info({ userId, roomId: parsed.data }, "usuário saiu da sala");
        });

        registerMessageHandlers(ctx);
        registerMessageActionsHandlers(ctx);
        registerPinHandlers(ctx);
        registerReadHandlers(ctx);
        registerTypingHandler(ctx);

        socket.on("disconnect", () => {
            removeUserSocket(userId, socket.id);
            cleanupSocketRateLimits(socket.id, userId);
            clearTypingForUser(userId);
            User.updateOne({ _id: userId }, { lastSeen: new Date() }).catch(
                () => {},
            );
            if (socket.sessionId) {
                Session.updateOne(
                    { _id: socket.sessionId, userId },
                    { lastActiveAt: new Date() },
                ).catch(() => {});
            }
            broadcastOnlineUsers(io);
            logger.info(
                { userId, socketId: socket.id },
                "usuário desconectado",
            );
        });
    });
};
