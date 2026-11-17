import mongoose, { type QueryFilter } from "mongoose";
import Comment from "../models/Comment";
import Post from "../models/Post";
import type { IComment } from "../types";
import type {
    CommentCursorPayload,
    CommentPagePayload,
    CommentPayload,
} from "../../../shared/types";
import { POST_AUTHOR_SELECT } from "../constants";
import {
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from "../utils/errors";
import {
    assertPostVisible,
    emitPostEvent,
    getExcludedAuthorIds,
} from "./post";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 30;
const MAX_CONTENT = 500;

interface PopulatedAuthor {
    _id?: mongoose.Types.ObjectId | string;
    name?: string;
    publicId?: string;
    avatar?: string;
    status?: string;
    country?: string;
}

interface CommentLean {
    _id: mongoose.Types.ObjectId;
    post: mongoose.Types.ObjectId | string;
    author?: PopulatedAuthor | null;
    content?: string | null;
    clientCommentId?: string | null;
    createdAt: Date;
    updatedAt?: Date;
}

export interface CommentPaginationOptions {
    limit: number;
    before?: string;
    beforeId?: string;
}

function toCommentPayload(comment: CommentLean): CommentPayload {
    const author = comment.author;

    return {
        _id: String(comment._id),
        post: String(comment.post),
        author:
            author && typeof author === "object" && "name" in author
                ? {
                      _id: String(author._id),
                      name: author.name ?? "Usuário",
                      publicId: author.publicId ?? "",
                      avatar: author.avatar ?? "",
                      status: author.status ?? "",
                      country: author.country ?? "",
                  }
                : null,
        content: comment.content ?? "",
        clientCommentId: comment.clientCommentId ?? null,
        createdAt: comment.createdAt.toISOString(),
        ...(comment.updatedAt
            ? { updatedAt: comment.updatedAt.toISOString() }
            : {}),
    };
}

async function findVisiblePost(
    viewerId: string,
    postId: string,
): Promise<{ authorId: string; profileId: string | null }> {
    const post = await Post.findOne({
        _id: postId,
        deleted: { $ne: true },
    })
        .select("author profile")
        .lean();

    if (!post) {
        throw new NotFoundError("Post não encontrado.");
    }

    const authorId = post.author.toString();
    const profileId = post.profile ? post.profile.toString() : null;
    await assertPostVisible(viewerId, authorId, profileId);

    return { authorId, profileId };
}

function applyCursor(
    query: QueryFilter<IComment>,
    opts: CommentPaginationOptions,
): void {
    if (!opts.before) return;

    const before = new Date(opts.before);
    if (opts.beforeId) {
        query.$or = [
            { createdAt: { $lt: before } },
            {
                createdAt: before,
                _id: { $lt: new mongoose.Types.ObjectId(opts.beforeId) },
            },
        ];
        return;
    }

    query.createdAt = { $lt: before };
}

function buildNextCursor(
    last: CommentLean | undefined,
): CommentCursorPayload | null {
    if (!last) return null;
    return {
        before: last.createdAt.toISOString(),
        beforeId: String(last._id),
    };
}

function isDuplicateClientCommentId(error: unknown): boolean {
    return (
        !!error &&
        typeof error === "object" &&
        (error as { code?: number }).code === 11000 &&
        !!(error as { keyPattern?: Record<string, unknown> }).keyPattern
            ?.clientCommentId
    );
}

async function populateComment(commentId: string): Promise<CommentPayload> {
    const comment = (await Comment.findById(commentId)
        .populate("author", POST_AUTHOR_SELECT)
        .lean()) as unknown as CommentLean | null;

    if (!comment) {
        throw new NotFoundError("Comentário não encontrado.");
    }

    return toCommentPayload(comment);
}

export async function listComments(
    viewerId: string,
    postId: string,
    opts: CommentPaginationOptions,
): Promise<CommentPagePayload> {
    await findVisiblePost(viewerId, postId);

    const excluded = await getExcludedAuthorIds([viewerId]);
    const query: QueryFilter<IComment> = {
        post: new mongoose.Types.ObjectId(postId),
    };

    if (excluded.length > 0) {
        query.author = {
            $nin: excluded.map((id) => new mongoose.Types.ObjectId(id)),
        };
    }

    applyCursor(query, opts);

    const safeLimit = Math.min(
        Math.max(Number(opts.limit) || DEFAULT_PAGE_SIZE, 1),
        MAX_PAGE_SIZE,
    );
    const found = (await Comment.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(safeLimit + 1)
        .populate("author", POST_AUTHOR_SELECT)
        .lean()) as unknown as CommentLean[];

    const hasMore = found.length > safeLimit;
    const page = hasMore ? found.slice(0, safeLimit) : found;

    return {
        comments: page.map(toCommentPayload),
        nextCursor: hasMore ? buildNextCursor(page[page.length - 1]) : null,
    };
}

export async function createComment(
    userId: string,
    postId: string,
    input: { content: string; clientCommentId?: string },
): Promise<{ comment: CommentPayload; commentCount: number }> {
    const content = input.content?.trim() ?? "";
    if (!content) {
        throw new ValidationError("Escreva um comentário.");
    }
    if (content.length > MAX_CONTENT) {
        throw new ValidationError(
            "Comentário deve ter no máximo 500 caracteres.",
        );
    }

    const { authorId, profileId } = await findVisiblePost(userId, postId);

    let created;
    try {
        created = await Comment.create({
            post: postId,
            author: userId,
            content,
            clientCommentId: input.clientCommentId || null,
        });
    } catch (error) {
        if (input.clientCommentId && isDuplicateClientCommentId(error)) {
            const existing = (await Comment.findOne({
                post: postId,
                author: userId,
                clientCommentId: input.clientCommentId,
            })
                .populate("author", POST_AUTHOR_SELECT)
                .lean()) as unknown as CommentLean | null;

            if (existing) {
                const post = await Post.findById(postId)
                    .select("commentCount")
                    .lean();
                return {
                    comment: toCommentPayload(existing),
                    commentCount:
                        typeof post?.commentCount === "number"
                            ? post.commentCount
                            : 0,
                };
            }
        }
        throw error;
    }

    const updatedPost = await Post.findOneAndUpdate(
        { _id: postId, deleted: { $ne: true } },
        { $inc: { commentCount: 1 } },
        { returnDocument: "after" },
    )
        .select("commentCount")
        .lean();

    if (!updatedPost) {
        await Comment.deleteOne({ _id: created._id });
        throw new NotFoundError("Post não encontrado.");
    }

    const comment = await populateComment(created._id.toString());
    const commentCount =
        typeof updatedPost.commentCount === "number"
            ? updatedPost.commentCount
            : 1;

    await emitPostEvent(
        "comment:created",
        { postId, comment, commentCount },
        [authorId, profileId ?? "", userId].filter(Boolean),
    );

    return { comment, commentCount };
}

export async function deleteComment(
    userId: string,
    postId: string,
    commentId: string,
): Promise<{ commentId: string; commentCount: number }> {
    const post = await Post.findOne({
        _id: postId,
        deleted: { $ne: true },
    })
        .select("author profile")
        .lean();

    if (!post) {
        throw new NotFoundError("Post não encontrado.");
    }

    const comment = await Comment.findOne({ _id: commentId, post: postId })
        .select("author")
        .lean();

    if (!comment) {
        throw new NotFoundError("Comentário não encontrado.");
    }

    const postAuthorId = post.author.toString();
    const profileId = post.profile ? post.profile.toString() : null;
    const commentAuthorId = comment.author.toString();

    if (
        userId !== commentAuthorId &&
        userId !== postAuthorId &&
        userId !== profileId
    ) {
        throw new ForbiddenError("Você não pode excluir este comentário.");
    }

    const removed = await Comment.findOneAndDelete({
        _id: commentId,
        post: postId,
    }).lean();

    if (!removed) {
        throw new NotFoundError("Comentário não encontrado.");
    }

    const updatedPost = await Post.findOneAndUpdate(
        { _id: postId },
        [
            {
                $set: {
                    commentCount: {
                        $max: [
                            0,
                            {
                                $subtract: [
                                    { $ifNull: ["$commentCount", 0] },
                                    1,
                                ],
                            },
                        ],
                    },
                },
            },
        ],
        { returnDocument: "after", updatePipeline: true },
    )
        .select("commentCount")
        .lean();

    const commentCount =
        typeof updatedPost?.commentCount === "number"
            ? updatedPost.commentCount
            : 0;

    await emitPostEvent(
        "comment:deleted",
        { postId, commentId, commentCount },
        [postAuthorId, commentAuthorId, profileId ?? ""].filter(Boolean),
    );

    return { commentId, commentCount };
}
