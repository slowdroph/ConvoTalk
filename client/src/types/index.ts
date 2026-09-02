import type {
    UserPayload,
    SenderPayload,
    AttachmentPayload,
    RoomPayload,
    MessagePayload,
    OnlineUserPayload,
    ParentMessagePayload,
    PinnedMessagePayload,
    LinkPreview as LinkPreviewPayload,
    MentionNotificationPayload as MentionNotificationPayloadShared,
    SessionPayload as SessionPayloadShared,
    ReadDetailPayload as ReadDetailPayloadShared,
} from "@shared/types";

export type User = UserPayload;
export type Sender = SenderPayload;
export type Attachment = AttachmentPayload;
export type Room = RoomPayload;
export type Message = MessagePayload;
export type OnlineUser = OnlineUserPayload;
export type ParentMessage = ParentMessagePayload;
export type PinnedMessage = PinnedMessagePayload;
export type LinkPreview = LinkPreviewPayload;
export type MentionNotificationPayload = MentionNotificationPayloadShared;
export type Session = SessionPayloadShared;
export type ReadDetail = ReadDetailPayloadShared;

export interface Participant {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    status?: string;
}

export interface PreviewMessage {
    id: string;
    senderId: string;
    name: string;
    content: string;
    createdAt: string;
}
