import api from "../../../services/api";
import type {
    Post,
    PostCursor,
    PostPollPayload,
    PostStats,
    TrendingTopic,
} from "../../../types";

export type FeedFilter = "all" | "popular" | "media" | "mine" | "saved";
export type FeedFilterMode = "all" | "media" | "mine";
export type FeedSort = "recent" | "popular";

export interface FeedPageResult {
    posts: Post[];
    nextCursor: PostCursor | null;
}

export interface FeedQuery {
    limit?: number;
    filter?: FeedFilterMode;
    sort?: FeedSort;
    before?: string;
    beforeLikes?: number;
    beforeId?: string;
    q?: string;
}

export function resolveFeedQuery(filter: FeedFilter): {
    filter: FeedFilterMode;
    sort: FeedSort;
} {
    switch (filter) {
        case "popular":
            return { filter: "all", sort: "popular" };
        case "media":
            return { filter: "media", sort: "recent" };
        case "mine":
            return { filter: "mine", sort: "recent" };
        case "saved":
            return { filter: "all", sort: "recent" };
        default:
            return { filter: "all", sort: "recent" };
    }
}

export async function getFeed(
    params: FeedQuery = {},
): Promise<FeedPageResult> {
    const { data } = await api.get<FeedPageResult>("/posts", { params });
    return data;
}

export async function searchPosts(
    params: FeedQuery & { q: string },
): Promise<FeedPageResult> {
    const { data } = await api.get<FeedPageResult>("/posts/search", {
        params,
    });
    return data;
}

export async function getSavedPosts(
    params: Pick<FeedQuery, "limit" | "before" | "beforeId"> = {},
): Promise<FeedPageResult> {
    const { data } = await api.get<FeedPageResult>("/posts/saved", {
        params,
    });
    return data;
}

export async function getPost(postId: string): Promise<Post> {
    const { data } = await api.get<Post>(`/posts/${postId}`);
    return data;
}

export async function getPostStats(): Promise<PostStats> {
    const { data } = await api.get<PostStats>("/posts/stats/me");
    return data;
}

export async function getTrendingTopics(limit = 5): Promise<TrendingTopic[]> {
    const { data } = await api.get<TrendingTopic[]>("/posts/trending", {
        params: { limit },
    });
    return data;
}

export interface CreatePostInput {
    content: string;
    image?: File | null;
    clientPostId?: string;
    profileId?: string;
    poll?: { options: string[] };
}

export async function createPost(input: CreatePostInput): Promise<Post> {
    const form = new FormData();
    form.append("content", input.content);
    if (input.clientPostId) {
        form.append("clientPostId", input.clientPostId);
    }
    if (input.profileId) {
        form.append("profileId", input.profileId);
    }
    if (input.poll) {
        form.append("poll", JSON.stringify(input.poll));
    }
    if (input.image) {
        form.append("image", input.image);
    }

    const { data } = await api.post<Post>("/posts", form);
    return data;
}

export async function deletePost(postId: string): Promise<void> {
    await api.delete(`/posts/${postId}`);
}

export interface LikeResult {
    likeCount: number;
    liked: boolean;
}

export async function likePost(postId: string): Promise<LikeResult> {
    const { data } = await api.post<LikeResult>(`/posts/${postId}/like`);
    return data;
}

export async function unlikePost(postId: string): Promise<LikeResult> {
    const { data } = await api.delete<LikeResult>(`/posts/${postId}/like`);
    return data;
}

export interface SavedResult {
    saved: boolean;
    postId: string;
}

export async function savePost(postId: string): Promise<SavedResult> {
    const { data } = await api.post<SavedResult>(`/posts/${postId}/save`);
    return data;
}

export async function unsavePost(postId: string): Promise<SavedResult> {
    const { data } = await api.delete<SavedResult>(`/posts/${postId}/save`);
    return data;
}

export interface PollVoteResult {
    postId: string;
    poll: PostPollPayload;
}

export async function votePoll(
    postId: string,
    optionId: string,
): Promise<PollVoteResult> {
    const { data } = await api.post<PollVoteResult>(`/posts/${postId}/vote`, {
        optionId,
    });
    return data;
}

export async function unvotePoll(postId: string): Promise<PollVoteResult> {
    const { data } = await api.delete<PollVoteResult>(
        `/posts/${postId}/vote`,
    );
    return data;
}
