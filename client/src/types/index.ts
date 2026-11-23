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
    PostPayload as PostPayloadShared,
    PostLikedEvent as PostLikedEventShared,
    PostDeletedEvent as PostDeletedEventShared,
    PostSavedEvent as PostSavedEventShared,
    PostPollPayload as PostPollPayloadShared,
    PostPollOptionPayload as PostPollOptionPayloadShared,
    PostPollEvent as PostPollEventShared,
    PostCursorPayload as PostCursorPayloadShared,
    PostStatsPayload as PostStatsPayloadShared,
    ProfileStatsPayload as ProfileStatsPayloadShared,
    TrendingTopicPayload as TrendingTopicPayloadShared,
    CommentPayload as CommentPayloadShared,
    CommentCreatedEvent as CommentCreatedEventShared,
    CommentDeletedEvent as CommentDeletedEventShared,
    DiscoverUserPayload as DiscoverUserPayloadShared,
    DiscoverPagePayload as DiscoverPagePayloadShared,
    DiscoverSort as DiscoverSortShared,
    DiscoverActivityWindow as DiscoverActivityWindowShared,
    DiscoverMode as DiscoverModeShared,
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
export type Post = PostPayloadShared;
export type PostLikedEvent = PostLikedEventShared;
export type PostDeletedEvent = PostDeletedEventShared;
export type PostSavedEvent = PostSavedEventShared;
export type PostPollPayload = PostPollPayloadShared;
export type PostPollOption = PostPollOptionPayloadShared;
export type PostPollEvent = PostPollEventShared;
export type PostCursor = PostCursorPayloadShared;
export type PostStats = PostStatsPayloadShared;
export type ProfileStats = ProfileStatsPayloadShared;
export type TrendingTopic = TrendingTopicPayloadShared;
export type Comment = CommentPayloadShared;
export type CommentCreatedEvent = CommentCreatedEventShared;
export type CommentDeletedEvent = CommentDeletedEventShared;
export type DiscoverUser = DiscoverUserPayloadShared;
export type DiscoverPage = DiscoverPagePayloadShared;
export type DiscoverSort = DiscoverSortShared;
export type DiscoverActivityWindow = DiscoverActivityWindowShared;
export type DiscoverMode = DiscoverModeShared;

export interface PreviewMessage {
    id: string;
    senderId: string;
    name: string;
    content: string;
    createdAt: string;
}
