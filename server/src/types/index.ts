import { Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: string;
    verified: boolean;
    verificationToken: string | null;
    verificationTokenExpiry: Date | null;
    resetToken: string | null;
    resetTokenExpiry: Date | null;
    lastSeen: Date | null;
    lastIp: string | null;
    lastIpAt: Date | null;
    status: string;
    blockedUsers: IUser["_id"][];
    createdAt: Date;
}

export interface IRoom extends Document {
    name: string;
    description: string;
    type: "group" | "direct";
    createdBy: IUser["_id"] | null;
    participants: IUser["_id"][];
    admins: IUser["_id"][];
    avatar: string;
    lastReadAt: Map<string, Date>;
    pinnedMessages: IPinnedMessage[];
    createdAt: Date;
}

export interface IPinnedMessage {
    message: IMessage["_id"];
    pinnedBy: IUser["_id"];
    pinnedAt: Date;
}

export interface IMessage extends Document {
    sender: IUser["_id"] | null;
    room: IRoom["_id"];
    content: string;
    type: "text" | "system";
    deleted: boolean;
    deletedFor: IUser["_id"][];
    edited: boolean;
    reactions: Map<string, IUser["_id"][]>;
    attachments: IAttachment[];
    readBy: IUser["_id"][];
    mentions: IUser["_id"][];
    parentMessage: IMessage["_id"] | null;
    clientMessageId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAttachment {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    publicId?: string;
}

export interface OnlineUser {
    userId: string;
    name: string;
    avatar: string;
}

export interface ISession extends Document {
    userId: IUser["_id"];
    token: string;
    deviceType: "web" | "mobile" | "desktop" | "unknown";
    userAgent: string;
    ip: string | null;
    deviceLabel: string;
    lastActiveAt: Date;
    createdAt: Date;
}

export interface IReadLog extends Document {
    userId: IUser["_id"];
    sessionId: ISession["_id"];
    messageId: IMessage["_id"];
    roomId: IRoom["_id"];
    readAt: Date;
}

export interface AuthUser {
    _id: string;
    sessionId?: string;
}

export interface IPushSubscription extends Document {
    user: IUser["_id"];
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    userAgent?: string;
    createdAt: Date;
}

