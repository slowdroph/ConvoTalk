import api from "../../../services/api";
import type { Post } from "../../../types";

export interface PostCursor {
    before: string;
    beforeId: string;
}

export interface FeedPageResult {
    posts: Post[];
    nextCursor: PostCursor | null;
}

export interface FeedQuery {
    limit?: number;
    before?: string;
    beforeId?: string;
}

export async function getFeed(params: FeedQuery = {}): Promise<FeedPageResult> {
    const { data } = await api.get<FeedPageResult>("/posts", { params });
    return data;
}

export interface CreatePostInput {
    content: string;
    image?: File | null;
    clientPostId?: string;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
    const form = new FormData();
    form.append("content", input.content);
    if (input.clientPostId) {
        form.append("clientPostId", input.clientPostId);
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
