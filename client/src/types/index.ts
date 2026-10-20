import type {
    UserPayload,
    PublicUserPayload,
    PublicProfilePayload as PublicProfilePayloadShared,
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
    AiSummaryPayload as AiSummaryPayloadShared,
    AiSuggestRepliesPayload as AiSuggestRepliesPayloadShared,
    AiReplySuggestion as AiReplySuggestionShared,
    AiTone as AiToneShared,
} from "@shared/types";

export type User = UserPayload;
export type PublicUser = PublicUserPayload;
export type PublicProfile = PublicProfilePayloadShared;
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
export type AiSummary = AiSummaryPayloadShared;
export type AiSuggestReplies = AiSuggestRepliesPayloadShared;
export type AiReplySuggestion = AiReplySuggestionShared;
export type AiTone = AiToneShared;

export interface PreviewMessage {
    id: string;
    senderId: string;
    name: string;
    content: string;
    createdAt: string;
}
