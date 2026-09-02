export interface UserPayload {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    status?: string;
}

export interface SenderPayload {
    _id: string;
    name: string;
    avatar?: string;
    status?: string;
}

export interface AttachmentPayload {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    publicId?: string;
}

export interface PinnedMessagePayload {
    message: string;
    pinnedBy: string;
    pinnedAt: string;
}

export interface RoomPayload {
    _id: string;
    name: string;
    description: string;
    type: "group" | "direct";
    createdBy?: string | null;
    participants: UserPayload[];
    admins?: UserPayload[];
    avatar?: string;
    unreadCount?: number;
    mentionUnreadCount?: number;
    pinnedMessages?: PinnedMessagePayload[];
}

export interface ParentMessagePayload {
    _id: string;
    sender: SenderPayload | null;
    content: string;
    attachments?: AttachmentPayload[];
    deleted?: boolean;
}

export interface MessagePayload {
    _id: string;
    sender: SenderPayload | null;
    content: string;
    type?: "text" | "system";
    room: string;
    deleted: boolean;
    deletedFor?: string[];
    edited: boolean;
    reactions: Record<string, string[]>;
    attachments?: AttachmentPayload[];
    readBy?: string[];
    mentions?: string[];
    parentMessage?: ParentMessagePayload | null;
    clientMessageId?: string | null;
    status?: "pending" | "sent" | "failed";
    createdAt: string;
    updatedAt?: string;
}

export interface ApiErrorShape {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export interface ApiSuccessShape<T = unknown> {
    success: true;
    data: T;
}

export type ApiResponse<T = unknown> = ApiSuccessShape<T> | ApiErrorShape;

export interface MessageSendPayload {
    roomId: string;
    content?: string;
    attachments?: AttachmentPayload[];
}

export interface TypingPayload {
    roomId: string;
    isTyping: boolean;
}

export interface TypingBroadcast {
    userId: string;
    name?: string;
    isTyping: boolean;
}

export interface ReadMessagesPayload {
    roomId: string;
    messageIds: string[];
}

export interface MessagesReadBroadcast {
    messageIds: string[];
    userId: string;
}

export interface ReactionBroadcast {
    messageId: string;
    reactions: Record<string, string[]>;
}

export interface MessageEditedBroadcast {
    messageId: string;
    content: string;
    updatedAt?: string;
}

export interface PinMessagePayload {
    roomId: string;
    messageId: string;
}

export interface MessagePinnedBroadcast {
    roomId: string;
    message: MessagePayload;
    pinnedBy: string;
}

export interface MessageUnpinnedBroadcast {
    roomId: string;
    messageId: string;
}

export interface OnlineUserPayload {
    userId: string;
    name: string;
    avatar: string;
    status?: string;
    online: boolean;
}

export interface CallInitiatePayload {
    roomId: string;
    calleeId: string;
    callType: "audio" | "video";
}

export interface CallSignalPayload {
    callId: string;
    targetId: string;
    payload: unknown;
}

export interface LinkPreview {
    url: string;
    title: string;
    description?: string;
    image?: string;
}

export interface PushSubscriptionKeys {
    p256dh: string;
    auth: string;
}

export interface PushSubscriptionPayload {
    endpoint: string;
    keys: PushSubscriptionKeys;
    userAgent?: string;
}

export interface PushUnsubscribePayload {
    endpoint: string;
}

export interface PushPublicKeyResponse {
    publicKey: string | null;
}

export interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: {
        url?: string;
        roomId?: string;
        messageId?: string;
        senderId?: string;
    };
}

export interface MentionNotificationPayload {
    messageId: string;
    roomId: string;
    sender: SenderPayload;
    content: string;
    createdAt: string;
}

