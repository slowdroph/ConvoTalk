import mongoose, { type QueryFilter } from "mongoose";
import Post from "../models/Post";
import SavedPost from "../models/SavedPost";
import User from "../models/User";
import type { IAttachment, IPost } from "../types";
import type {
    PostCursorPayload,
    PostPayload,
    PostSavedEvent,
    PostStatsPayload,
    TrendingTopicPayload,
} from "../../../shared/types";
import {
    POST_AUTHOR_SELECT,
    POST_IMAGE_FOLDER,
} from "../constants";
import { getSocketIO } from "../config/io";
import { getOnlineUserIds, getUserSocketIds } from "../socket/onlineUsers";
import cloudinary from "../config/cloudinary";
import { deleteCloudinaryAttachments } from "./cloudinary";
import { assertSupportedImage } from "../middleware/postUpload";
import { logger } from "../config/logger";
import {
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from "../utils/errors";
import { areUsersBlocked } from "../utils/blocked";

interface PopulatedAuthor {
    _id?: mongoose.Types.ObjectId | string;
    name?: string;
    publicId?: string;
    avatar?: string;
    status?: string;
    country?: string;
}

export interface PostLean {
    _id: mongoose.Types.ObjectId;
    author?: PopulatedAuthor | null;
    content?: string | null;
    image?: IAttachment | null;
    likes?: (mongoose.Types.ObjectId | string)[];
    likeCount?: number;
    commentCount?: number;
    edited?: boolean;
    deleted?: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export type PostFeedFilter = "all" | "media" | "mine";
export type PostFeedSort = "recent" | "popular";

interface PaginationOptions {
    limit: number;
    before?: string;
    beforeId?: string;
}

interface FeedOptions extends PaginationOptions {
    filter?: PostFeedFilter;
    sort?: PostFeedSort;
    beforeLikes?: number;
}

export function toPostPayload(
    post: PostLean,
    viewerId: string,
    savedPostIds?: Set<string>,
): PostPayload {
    const author = post.author;
    const likes = post.likes ?? [];
    const likeCount =
        typeof post.likeCount === "number" ? post.likeCount : likes.length;

    return {
        _id: String(post._id),
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
        content: post.content ?? "",
        image: post.image ?? null,
        likeCount,
        likedByMe: likes.some((id) => id.toString() === viewerId),
        savedByMe: Boolean(savedPostIds?.has(String(post._id))),
        commentCount:
            typeof post.commentCount === "number" ? post.commentCount : 0,
        edited: Boolean(post.edited),
        createdAt: post.createdAt.toISOString(),
        ...(post.updatedAt
            ? { updatedAt: post.updatedAt.toISOString() }
            : {}),
    };
}

function applyCursor(
    query: QueryFilter<IPost>,
    opts: PaginationOptions,
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

function applyPopularCursor(
    query: QueryFilter<IPost>,
    opts: FeedOptions,
): void {
    if (typeof opts.beforeLikes !== "number" || !opts.beforeId) return;

    const beforeId = new mongoose.Types.ObjectId(opts.beforeId);
    query.$or = [
        { likeCount: { $lt: opts.beforeLikes } },
        { likeCount: opts.beforeLikes, _id: { $lt: beforeId } },
    ];
}

function buildNextCursor(
    last: PostLean | undefined,
    sort: PostFeedSort,
): PostCursorPayload | null {
    if (!last) return null;

    if (sort === "popular") {
        return {
            beforeLikes:
                typeof last.likeCount === "number"
                    ? last.likeCount
                    : (last.likes ?? []).length,
            beforeId: String(last._id),
        };
    }

    return {
        before: last.createdAt.toISOString(),
        beforeId: String(last._id),
    };
}

export async function getExcludedAuthorIds(
    userIds: string[],
): Promise<string[]> {
    const uniqueUserIds = [...new Set(userIds)];

    const users = await User.find({
        $or: [
            { _id: { $in: uniqueUserIds } },
            { blockedUsers: { $in: uniqueUserIds } },
        ],
    })
        .select("_id blockedUsers")
        .lean();

    const excluded = new Set<string>();
    for (const user of users) {
        const userId = user._id.toString();
        if (!uniqueUserIds.includes(userId)) {
            excluded.add(userId);
            continue;
        }
        for (const blockedId of user.blockedUsers ?? []) {
            excluded.add(blockedId.toString());
        }
    }
    for (const userId of uniqueUserIds) {
        excluded.delete(userId);
    }

    return [...excluded];
}

export async function emitPostEvent(
    event:
        | "post:new"
        | "post:liked"
        | "post:deleted"
        | "comment:created"
        | "comment:deleted",
    payload: unknown,
    userIds: string[],
): Promise<void> {
    const io = getSocketIO();
    if (!io) return;

    try {
        const excluded = new Set(await getExcludedAuthorIds(userIds));

        for (const userId of getOnlineUserIds()) {
            if (excluded.has(userId)) continue;
            const socketIds = getUserSocketIds(userId);
            if (!socketIds) continue;
            for (const socketId of socketIds) {
                io.to(socketId).emit(event, payload);
            }
        }
    } catch (error) {
        logger.warn({ error, event }, "falha ao emitir evento de post");
    }
}

export async function emitSavedPostEvent(
    event: "post:saved" | "post:unsaved",
    payload: PostSavedEvent,
): Promise<void> {
    const io = getSocketIO();
    if (!io) return;

    try {
        const socketIds = getUserSocketIds(payload.userId);
        if (!socketIds) return;
        for (const socketId of socketIds) {
            io.to(socketId).emit(event, payload);
        }
    } catch (error) {
        logger.warn({ error, event }, "falha ao emitir evento de salvo");
    }
}

export async function getSavedPostIds(
    viewerId: string,
    postIds: string[],
): Promise<Set<string>> {
    if (postIds.length === 0) return new Set();

    const savedPosts = await SavedPost.find({
        user: new mongoose.Types.ObjectId(viewerId),
        post: { $in: postIds.map((id) => new mongoose.Types.ObjectId(id)) },
    })
        .select("post")
        .lean();

    return new Set(savedPosts.map((saved) => saved.post.toString()));
}

async function populatePost(
    postId: string,
    viewerId: string,
): Promise<PostPayload> {
    const post = (await Post.findById(postId)
        .populate("author", POST_AUTHOR_SELECT)
        .lean()) as unknown as PostLean | null;

    if (!post || post.deleted) {
        throw new NotFoundError("Post não encontrado.");
    }

    const savedPostIds = await getSavedPostIds(viewerId, [String(post._id)]);
    return toPostPayload(post, viewerId, savedPostIds);
}

export async function getFeed(
    viewerId: string,
    opts: FeedOptions,
): Promise<{ posts: PostPayload[]; nextCursor: PostCursorPayload | null }> {
    const filter = opts.filter ?? "all";
    const sort = opts.sort ?? "recent";
    const excluded =
        filter === "mine" ? [] : await getExcludedAuthorIds([viewerId]);

    const query: QueryFilter<IPost> = { deleted: { $ne: true } };
    if (filter === "mine") {
        query.author = new mongoose.Types.ObjectId(viewerId);
    } else if (excluded.length > 0) {
        query.author = {
            $nin: excluded.map((id) => new mongoose.Types.ObjectId(id)),
        };
    }
    if (filter === "media") {
        query.image = { $ne: null };
    }

    if (sort === "popular") {
        applyPopularCursor(query, opts);
    } else {
        applyCursor(query, opts);
    }

    const safeLimit = Math.min(Math.max(Number(opts.limit) || 20, 1), 30);
    const found = (await Post.find(query)
        .sort(
            sort === "popular"
                ? { likeCount: -1, _id: -1 }
                : { createdAt: -1, _id: -1 },
        )
        .limit(safeLimit + 1)
        .populate("author", POST_AUTHOR_SELECT)
        .lean()) as unknown as PostLean[];

    const hasMore = found.length > safeLimit;
    const page = hasMore ? found.slice(0, safeLimit) : found;
    const last = page[page.length - 1];
    const savedPostIds = await getSavedPostIds(
        viewerId,
        page.map((post) => String(post._id)),
    );

    return {
        posts: page.map((post) => toPostPayload(post, viewerId, savedPostIds)),
        nextCursor: hasMore ? buildNextCursor(last, sort) : null,
    };
}

export async function getUserPosts(
    viewerId: string,
    authorId: string,
    opts: PaginationOptions,
): Promise<{ posts: PostPayload[]; nextCursor: { before: string; beforeId: string } | null }> {
    const author = await User.findById(authorId).select("_id").lean();
    if (!author) {
        throw new NotFoundError("Usuário não encontrado.");
    }

    if (authorId !== viewerId && (await areUsersBlocked(viewerId, authorId))) {
        throw new ForbiddenError("Acesso negado.");
    }

    const query: QueryFilter<IPost> = {
        author: new mongoose.Types.ObjectId(authorId),
        deleted: { $ne: true },
    };
    applyCursor(query, opts);

    const safeLimit = Math.min(Math.max(Number(opts.limit) || 20, 1), 30);
    const found = (await Post.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(safeLimit + 1)
        .populate("author", POST_AUTHOR_SELECT)
        .lean()) as unknown as PostLean[];

    const hasMore = found.length > safeLimit;
    const page = hasMore ? found.slice(0, safeLimit) : found;
    const last = page[page.length - 1];
    const savedPostIds = await getSavedPostIds(
        viewerId,
        page.map((post) => String(post._id)),
    );

    return {
        posts: page.map((post) => toPostPayload(post, viewerId, savedPostIds)),
        nextCursor:
            hasMore && last
                ? {
                      before: last.createdAt.toISOString(),
                      beforeId: String(last._id),
                  }
                : null,
    };
}

export async function getPost(
    viewerId: string,
    postId: string,
): Promise<PostPayload> {
    const post = (await Post.findOne({
        _id: postId,
        deleted: { $ne: true },
    })
        .populate("author", POST_AUTHOR_SELECT)
        .lean()) as unknown as PostLean | null;

    if (!post) {
        throw new NotFoundError("Post não encontrado.");
    }

    const authorId = post.author?._id?.toString();
    if (
        authorId &&
        authorId !== viewerId &&
        (await areUsersBlocked(viewerId, authorId))
    ) {
        throw new ForbiddenError("Acesso negado.");
    }

    const savedPostIds = await getSavedPostIds(viewerId, [String(post._id)]);
    return toPostPayload(post, viewerId, savedPostIds);
}

async function uploadPostImage(file: Express.Multer.File): Promise<IAttachment> {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
        folder: POST_IMAGE_FOLDER,
        resource_type: "image",
        transformation: [
            { width: 1600, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
        ],
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
    };
}

async function removePostImage(image: IAttachment | null | undefined) {
    if (!image) return;
    await deleteCloudinaryAttachments([image]);
}

function isDuplicateClientPostId(error: unknown): boolean {
    return (
        !!error &&
        typeof error === "object" &&
        (error as { code?: number }).code === 11000 &&
        !!(error as { keyPattern?: Record<string, unknown> }).keyPattern
            ?.clientPostId
    );
}

export async function createPost(
    userId: string,
    input: { content: string; clientPostId?: string },
    file?: Express.Multer.File,
): Promise<PostPayload> {
    const content = input.content?.trim() ?? "";
    if (!content && !file) {
        throw new ValidationError(
            "Escreva algo ou adicione uma imagem para publicar.",
        );
    }

    let image: IAttachment | null = null;
    if (file) {
        assertSupportedImage(file);
        image = await uploadPostImage(file);
    }

    let created;
    try {
        created = await Post.create({
            author: userId,
            content,
            image,
            clientPostId: input.clientPostId || null,
        });
    } catch (error) {
        await removePostImage(image);
        if (input.clientPostId && isDuplicateClientPostId(error)) {
            const existing = (await Post.findOne({
                author: userId,
                clientPostId: input.clientPostId,
            })
                .populate("author", POST_AUTHOR_SELECT)
                .lean()) as unknown as PostLean | null;

            if (existing) {
                const savedPostIds = await getSavedPostIds(userId, [
                    String(existing._id),
                ]);
                return toPostPayload(existing, userId, savedPostIds);
            }
        }
        throw error;
    }

    const payload = await populatePost(created._id.toString(), userId);
    await emitPostEvent("post:new", payload, [userId]);
    return payload;
}

export async function deletePost(
    userId: string,
    postId: string,
): Promise<void> {
    const post = await Post.findOne({
        _id: postId,
        deleted: { $ne: true },
    })
        .select("author image")
        .lean();

    if (!post) {
        throw new NotFoundError("Post não encontrado.");
    }

    if (post.author.toString() !== userId) {
        throw new ForbiddenError("Você só pode excluir seus próprios posts.");
    }

    await Post.updateOne(
        { _id: postId, author: userId },
        { $set: { deleted: true, image: null } },
    );
    await SavedPost.deleteMany({ post: postId });
    await removePostImage(post.image ?? null);

    await emitPostEvent("post:deleted", { postId }, [userId]);
}

export async function setPostLike(
    userId: string,
    postId: string,
    liked: boolean,
): Promise<{ likeCount: number; liked: boolean }> {
    const post = await Post.findOne({
        _id: postId,
        deleted: { $ne: true },
    })
        .select("author")
        .lean();

    if (!post) {
        throw new NotFoundError("Post não encontrado.");
    }

    if (
        post.author.toString() !== userId &&
        (await areUsersBlocked(userId, post.author.toString()))
    ) {
        throw new ForbiddenError("Acesso negado.");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const likesExpression = liked
        ? {
              $setUnion: [
                  { $ifNull: ["$likes", []] },
                  [userObjectId],
              ],
          }
        : {
              $setDifference: [
                  { $ifNull: ["$likes", []] },
                  [userObjectId],
              ],
          };

    const updated = await Post.findOneAndUpdate(
        { _id: postId, deleted: { $ne: true } },
        [
            { $set: { likes: likesExpression } },
            {
                $set: {
                    likeCount: { $size: { $ifNull: ["$likes", []] } },
                },
            },
        ],
        { returnDocument: "after", updatePipeline: true },
    )
        .select("likes likeCount")
        .lean();

    if (!updated) {
        throw new NotFoundError("Post não encontrado.");
    }

    const likeCount =
        typeof updated.likeCount === "number"
            ? updated.likeCount
            : (updated.likes ?? []).length;
    const payload = { postId, likeCount, userId, liked };
    await emitPostEvent("post:liked", payload, [
        post.author.toString(),
        userId,
    ]);
    return { likeCount, liked };
}

export async function getPostStats(
    userId: string,
): Promise<PostStatsPayload> {
    const [result] = await Post.aggregate<PostStatsPayload>([
        {
            $match: {
                author: new mongoose.Types.ObjectId(userId),
                deleted: { $ne: true },
            },
        },
        {
            $group: {
                _id: null,
                postCount: { $sum: 1 },
                totalLikes: {
                    $sum: {
                        $ifNull: [
                            "$likeCount",
                            { $size: { $ifNull: ["$likes", []] } },
                        ],
                    },
                },
            },
        },
        { $project: { _id: 0, postCount: 1, totalLikes: 1 } },
    ]);

    return {
        postCount: result?.postCount ?? 0,
        totalLikes: result?.totalLikes ?? 0,
    };
}

export async function getTrendingTopics(
    viewerId: string,
    limit = 5,
): Promise<TrendingTopicPayload[]> {
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const excluded = await getExcludedAuthorIds([viewerId]);

    const match: Record<string, unknown> = {
        deleted: { $ne: true },
        createdAt: { $gte: since },
    };
    if (excluded.length > 0) {
        match.author = {
            $nin: excluded.map((id) => new mongoose.Types.ObjectId(id)),
        };
    }

    return Post.aggregate<TrendingTopicPayload>([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $limit: 500 },
        {
            $project: {
                tags: {
                    $regexFindAll: {
                        input: { $ifNull: ["$content", ""] },
                        regex: "#[0-9A-Za-z_\u00C0-\u017F]+",
                    },
                },
            },
        },
        { $unwind: "$tags" },
        {
            $group: {
                _id: { $toLower: "$tags.match" },
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: safeLimit },
        { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]);
}

export async function backfillPostLikeCounts(): Promise<void> {
    const result = await Post.collection.updateMany(
        { likeCount: { $exists: false } },
        [
            {
                $set: {
                    likeCount: {
                        $size: { $ifNull: ["$likes", []] },
                    },
                },
            },
        ],
    );

    if (result.modifiedCount > 0) {
        logger.info(
            { count: result.modifiedCount },
            "likeCount de posts existentes atualizado",
        );
    }
}
