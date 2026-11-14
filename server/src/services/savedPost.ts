import mongoose, { type QueryFilter } from "mongoose";
import SavedPost from "../models/SavedPost";
import Post from "../models/Post";
import type { ISavedPost } from "../types";
import type { PostCursorPayload, PostPayload } from "../../../shared/types";
import { POST_AUTHOR_SELECT } from "../constants";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { areUsersBlocked } from "../utils/blocked";
import {
    emitSavedPostEvent,
    toPostPayload,
    type PostLean,
} from "./post";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 30;

interface SavedPostPaginationOptions {
    limit: number;
    before?: string;
    beforeId?: string;
}

interface SavedPostEntryLean {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    post: PostLean | null;
}

function isDuplicateKey(error: unknown): boolean {
    return (
        !!error &&
        typeof error === "object" &&
        (error as { code?: number }).code === 11000
    );
}

function applyCursor(
    query: QueryFilter<ISavedPost>,
    opts: SavedPostPaginationOptions,
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

export async function savePost(
    userId: string,
    postId: string,
): Promise<{ saved: boolean; postId: string }> {
    const post = await Post.findOne({
        _id: postId,
        deleted: { $ne: true },
    })
        .select("author")
        .lean();

    if (!post) {
        throw new NotFoundError("Post não encontrado.");
    }

    const authorId = post.author.toString();
    if (authorId !== userId && (await areUsersBlocked(userId, authorId))) {
        throw new ForbiddenError("Acesso negado.");
    }

    try {
        await SavedPost.updateOne(
            { user: userId, post: postId },
            { $setOnInsert: { user: userId, post: postId } },
            { upsert: true },
        );
    } catch (error) {
        if (!isDuplicateKey(error)) throw error;
    }

    await emitSavedPostEvent("post:saved", { postId, userId, saved: true });
    return { saved: true, postId };
}

export async function unsavePost(
    userId: string,
    postId: string,
): Promise<{ saved: boolean; postId: string }> {
    await SavedPost.deleteOne({ user: userId, post: postId });
    await emitSavedPostEvent("post:unsaved", { postId, userId, saved: false });
    return { saved: false, postId };
}

export async function listSavedPosts(
    viewerId: string,
    opts: SavedPostPaginationOptions,
): Promise<{
    posts: PostPayload[];
    nextCursor: PostCursorPayload | null;
}> {
    const query: QueryFilter<ISavedPost> = {
        user: new mongoose.Types.ObjectId(viewerId),
    };
    applyCursor(query, opts);

    const safeLimit = Math.min(
        Math.max(Number(opts.limit) || DEFAULT_PAGE_SIZE, 1),
        MAX_PAGE_SIZE,
    );
    const found = (await SavedPost.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(safeLimit + 1)
        .populate({
            path: "post",
            match: { deleted: { $ne: true } },
            populate: { path: "author", select: POST_AUTHOR_SELECT },
        })
        .lean()) as unknown as SavedPostEntryLean[];

    const hasMore = found.length > safeLimit;
    const page = hasMore ? found.slice(0, safeLimit) : found;
    const visible = page.filter(
        (entry): entry is SavedPostEntryLean & { post: PostLean } =>
            Boolean(entry.post),
    );
    const savedPostIds = new Set(
        visible.map((entry) => String(entry.post._id)),
    );
    const last = page[page.length - 1];

    return {
        posts: visible.map((entry) =>
            toPostPayload(entry.post, viewerId, savedPostIds),
        ),
        nextCursor:
            hasMore && last
                ? {
                      before: last.createdAt.toISOString(),
                      beforeId: String(last._id),
                  }
                : null,
    };
}
