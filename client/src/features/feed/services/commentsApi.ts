import api from "../../../services/api";
import type { Comment } from "../../../types";

export interface CommentCursor {
    before: string;
    beforeId: string;
}

export interface CommentPageResult {
    comments: Comment[];
    nextCursor: CommentCursor | null;
}

export interface CommentQuery {
    limit?: number;
    before?: string;
    beforeId?: string;
}

export interface CreateCommentResult {
    comment: Comment;
    commentCount: number;
}

export interface DeleteCommentResult {
    commentId: string;
    commentCount: number;
}

export async function getComments(
    postId: string,
    params: CommentQuery = {},
): Promise<CommentPageResult> {
    const { data } = await api.get<CommentPageResult>(
        `/posts/${postId}/comments`,
        { params },
    );
    return data;
}

export async function createComment(
    postId: string,
    input: { content: string; clientCommentId?: string },
): Promise<CreateCommentResult> {
    const { data } = await api.post<CreateCommentResult>(
        `/posts/${postId}/comments`,
        input,
    );
    return data;
}

export async function deleteComment(
    postId: string,
    commentId: string,
): Promise<DeleteCommentResult> {
    const { data } = await api.delete<DeleteCommentResult>(
        `/posts/${postId}/comments/${commentId}`,
    );
    return data;
}
