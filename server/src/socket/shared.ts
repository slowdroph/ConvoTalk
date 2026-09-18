import { Server as SocketIOServer, Socket } from "socket.io";
import type { Types } from "mongoose";
import User from "../models/User";
import type { IAttachment } from "../types";
import { getRoomInfo } from "./roomCache";
import { getUserSocketIds } from "./onlineUsers";
import { sendPushToUsers } from "../services/pushNotification";
import { parseMentionTokens, getUniqueMentionUserIds } from "../../../shared/mentions";
import { logger } from "../config/logger";

export interface SenderInfo {
    name: string;
    publicId: string;
    avatar: string;
    status: string;
}

export interface PopulatedSender {
    _id?: Types.ObjectId | string;
    name?: string;
    publicId?: string;
    avatar?: string;
    status?: string;
}

export interface ParentMessageLean {
    _id: Types.ObjectId;
    sender?: Types.ObjectId | PopulatedSender | null;
    content?: string | null;
    attachments?: IAttachment[];
    deleted?: boolean;
}

export interface ConnectionContext {
    io: SocketIOServer;
    socket: Socket;
    userId: string;
    getSenderInfo: () => Promise<SenderInfo | null>;
    senderInfo: SenderInfo | null;
    userDoc: { name?: string; avatar?: string } | null;
}

export function senderPayloadFrom(info: SenderInfo | null, userId: string) {
    return {
        _id: userId,
        name: info?.name ?? "Usuário",
        publicId: info?.publicId ?? "",
        avatar: info?.avatar ?? "",
        status: info?.status ?? "",
    };
}

export function parentPayload(parent: ParentMessageLean) {
    const sender = parent.sender;
    return {
        _id: String(parent._id),
        sender:
            sender && typeof sender === "object" && "name" in sender
                ? {
                      _id: String(sender._id),
                      name: sender.name,
                      publicId: sender.publicId ?? "",
                      avatar: sender.avatar,
                      status: sender.status,
                  }
                : null,
        content: parent.content ?? "",
        attachments: parent.attachments ?? [],
        deleted: !!parent.deleted,
    };
}

export function isDuplicateClientMessageId(error: unknown): boolean {
    return (
        !!error &&
        typeof error === "object" &&
        (error as { code?: number }).code === 11000 &&
        !!(error as { keyPattern?: Record<string, unknown> }).keyPattern
            ?.clientMessageId
    );
}

export async function isRoomParticipant(
    roomId: string,
    userId: string,
): Promise<boolean> {
    const room = await getRoomInfo(roomId);
    if (!room) return false;
    return room.participants.includes(userId);
}

export async function isBlockedBetween(a: string, b: string): Promise<boolean> {
    const blocked = await User.exists({
        _id: { $in: [a, b] },
        blockedUsers: { $in: [a, b] },
    });
    return !!blocked;
}

export async function isRoomBlocked(roomId: string, userId: string): Promise<boolean> {
    const room = await getRoomInfo(roomId);
    if (!room) return false;
    if (room.type !== "direct") return false;
    const other = room.participants.find((p) => p !== userId);
    if (!other) return false;
    return isBlockedBetween(userId, other);
}

export async function triggerPushForRoom(
    roomId: string,
    senderId: string,
    senderName: string,
    content: string,
    messageId: string,
): Promise<void> {
    try {
        const room = await getRoomInfo(roomId);
        if (!room) return;

        const recipientIds = room.participants.filter(
            (p) => String(p) !== String(senderId),
        );
        if (recipientIds.length === 0) return;

        const blockedUsers = await User.find({
            _id: { $in: recipientIds },
            blockedUsers: senderId,
        }).distinct("_id");

        const blockedSet = new Set(blockedUsers.map((id) => String(id)));
        const finalRecipients = recipientIds.filter(
            (id) => !blockedSet.has(String(id)),
        );

        if (finalRecipients.length === 0) return;

        const roomTitle =
            room.type === "group" && room.name
                ? `${senderName} (${room.name})`
                : senderName;

        const truncatedBody =
            content && content.trim()
                ? content.length > 100
                    ? content.slice(0, 97) + "..."
                    : content
                : "Enviou um anexo";

        await sendPushToUsers(finalRecipients, {
            title: roomTitle,
            body: truncatedBody,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: roomId,
            data: {
                roomId,
                messageId,
                senderId,
                url: `/chat/${roomId}`,
            },
        });
    } catch (error) {
        logger.error(
            { error, roomId, senderId },
            "erro ao disparar notificação push",
        );
    }
}

export async function extractMentionsFromContent(
    content: string,
    roomId: string,
): Promise<string[]> {
    if (!content.includes("@")) {
        return [];
    }

    const room = await getRoomInfo(roomId);
    if (!room) return [];

    const participantIds = room.participants.map((p) => String(p));
    const participants = await User.find(
        { _id: { $in: participantIds } },
        { _id: 1, name: 1 },
    ).lean<{ _id: Types.ObjectId; name: string }[]>();

    const tokens = parseMentionTokens(
        content,
        participants.map((p) => ({ _id: String(p._id), name: p.name })),
    );

    return getUniqueMentionUserIds(tokens);
}

export async function triggerMentionNotifications(
    io: SocketIOServer,
    roomId: string,
    senderId: string,
    senderInfo: { name: string; avatar: string },
    message: { _id: Types.ObjectId; content: string; createdAt: Date },
    explicitRecipientIds?: string[],
): Promise<void> {
    try {
        const room = await getRoomInfo(roomId);
        if (!room || room.type === "direct") return;

        let mentionedIds: string[];
        if (explicitRecipientIds) {
            mentionedIds = explicitRecipientIds;
        } else {
            mentionedIds = await extractMentionsFromContent(
                message.content,
                roomId,
            );
        }
        if (mentionedIds.length === 0) return;

        const blockedUsers = await User.find({
            _id: { $in: mentionedIds },
            blockedUsers: senderId,
        }).distinct("_id");
        const blockedSet = new Set(blockedUsers.map((id) => String(id)));

        const recipients = mentionedIds.filter(
            (id) => id !== senderId && !blockedSet.has(id),
        );
        if (recipients.length === 0) return;

        const roomName = room.type === "group" && room.name ? room.name : senderInfo.name;

        for (const recipientId of recipients) {
            const socketIds = getUserSocketIds(recipientId);
            if (socketIds?.size) {
                for (const socketId of socketIds) {
                    io.to(socketId).emit("mention:new", {
                        messageId: String(message._id),
                        roomId,
                        sender: senderInfo,
                        content: message.content,
                        createdAt: message.createdAt.toISOString(),
                    });
                }
            }
        }

        await sendPushToUsers(recipients, {
            title: `@${senderInfo.name} mencionou você`,
            body: message.content.length > 100
                ? message.content.slice(0, 97) + "..."
                : message.content,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: `mention-${roomId}`,
            data: {
                roomId,
                messageId: String(message._id),
                senderId,
                url: `/chat/${roomId}`,
                mention: true,
            },
        });
    } catch (error) {
        logger.error({ error, roomId, senderId }, "erro ao disparar notificação de menção");
    }
}
