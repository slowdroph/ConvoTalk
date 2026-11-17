export interface PublicUserPayload {
    _id: string;
    name: string;
    publicId: string;
    avatar?: string;
    status?: string;
    country?: string;
}

export interface UserPayload extends PublicUserPayload {
    email: string;
    emailPending?: boolean;
    pendingEmail?: string;
    city?: string;
    bio?: string;
    interests?: string[];
    gender?: string;
    birthdate?: string | null;
    languages?: string[];
    languageLevels?: Record<string, string>;
}

export interface SenderPayload {
    _id: string;
    name: string;
    publicId?: string;
    avatar?: string;
    status?: string;
    country?: string;
    city?: string;
}

export interface PublicProfilePayload extends PublicUserPayload {
    city?: string;
    bio?: string;
    interests?: string[];
    gender?: string;
    age?: number | null;
    languages?: string[];
    languageLevels?: Record<string, string>;
    blockedByMe?: boolean;
    birthdate?: string | null;
    lastSeen?: string | null;
    createdAt?: string;
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
    visibility?: "private" | "public";
    createdBy?: string | null;
    participants: PublicUserPayload[];
    admins?: PublicUserPayload[];
    avatar?: string;
    unreadCount?: number;
    mentionUnreadCount?: number;
    pinnedMessages?: PinnedMessagePayload[];
    lastMessageAt?: string;
    lastMessagePreview?: string | null;
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

export interface PostPollOptionPayload {
    _id: string;
    text: string;
    voteCount: number;
}

export interface PostPollPayload {
    options: PostPollOptionPayload[];
    totalVotes: number;
    myVoteOptionId: string | null;
}

export interface PostPayload {
    _id: string;
    author: SenderPayload | null;
    profileId?: string | null;
    content: string;
    image?: AttachmentPayload | null;
    likeCount: number;
    likedByMe: boolean;
    savedByMe?: boolean;
    commentCount: number;
    poll?: PostPollPayload | null;
    edited: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface CommentPayload {
    _id: string;
    post: string;
    author: SenderPayload | null;
    content: string;
    clientCommentId?: string | null;
    createdAt: string;
    updatedAt?: string;
}

export type CommentCursorPayload = { before: string; beforeId: string };

export interface CommentPagePayload {
    comments: CommentPayload[];
    nextCursor: CommentCursorPayload | null;
}

export interface CommentCreatedEvent {
    postId: string;
    comment: CommentPayload;
    commentCount: number;
}

export interface CommentDeletedEvent {
    postId: string;
    commentId: string;
    commentCount: number;
}

export interface PostLikedEvent {
    postId: string;
    likeCount: number;
    userId: string;
    liked: boolean;
}

export interface PostDeletedEvent {
    postId: string;
}

export interface PostSavedEvent {
    postId: string;
    userId: string;
    saved: boolean;
}

export interface PostPollEvent {
    postId: string;
    userId: string;
    optionId: string | null;
    options: PostPollOptionPayload[];
    totalVotes: number;
}

export type PostCursorPayload =
    | { before: string; beforeId: string }
    | { beforeLikes: number; beforeId: string };

export interface PostStatsPayload {
    postCount: number;
    totalLikes: number;
}

export interface ProfileStatsPayload {
    postCount: number;
    totalLikes: number;
    photoCount: number;
    authoredCount: number;
}

export interface TrendingTopicPayload {
    tag: string;
    count: number;
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
    roomId: string;
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

export interface TurnCredentialsResponse {
    urls: string[];
    username: string;
    credential: string;
    ttl: number;
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
        mention?: boolean;
    };
}

export interface MentionNotificationPayload {
    messageId: string;
    roomId: string;
    sender: SenderPayload;
    content: string;
    createdAt: string;
}

export interface SessionPayload {
    _id: string;
    deviceType: "web" | "mobile" | "desktop" | "unknown";
    deviceLabel: string;
    ip: string | null;
    lastActiveAt: string;
    createdAt: string;
    current: boolean;
}

export interface ReadDetailPayload {
    userId: string;
    name: string;
    avatar: string;
    readAt: string;
    sessionId: string;
}

export type AiTone = "short" | "friendly" | "formal";

export interface AiSummarizeRequest {
    limit?: number;
    sinceMessageId?: string;
    regenerate?: boolean;
}

export interface AiSummaryPayload {
    summary: string;
    keyPoints: string[];
    messageCount: number;
    model: string;
    generatedAt: string;
}

export interface AiSuggestRepliesRequest {
    messageId?: string;
    regenerate?: boolean;
}

export interface AiReplySuggestion {
    tone: AiTone;
    text: string;
}

export interface AiSuggestRepliesPayload {
    suggestions: AiReplySuggestion[];
    model: string;
    generatedAt: string;
}

