import type { Post, PostLikedEvent, PostSavedEvent } from "../../types";
import type { FeedFilter, FeedSort } from "./services/feedApi";

function timeOf(post: Post): number {
    return new Date(post.createdAt).getTime();
}

function compareIdsDesc(a: Post, b: Post): number {
    return b._id.localeCompare(a._id);
}

function comparePostsByDate(a: Post, b: Post): number {
    const byDate = timeOf(b) - timeOf(a);
    return byDate !== 0 ? byDate : compareIdsDesc(a, b);
}

function comparePostsByLikes(a: Post, b: Post): number {
    const byLikes = b.likeCount - a.likeCount;
    return byLikes !== 0 ? byLikes : compareIdsDesc(a, b);
}

export function sortFeedPosts(posts: Post[], sort: FeedSort): Post[] {
    return posts
        .slice()
        .sort(sort === "popular" ? comparePostsByLikes : comparePostsByDate);
}

export function matchesFeedFilter(
    post: Post,
    filter: FeedFilter,
    viewerId: string,
): boolean {
    if (filter === "media") return Boolean(post.image);
    if (filter === "mine") {
        return Boolean(viewerId) && post.author?._id === viewerId;
    }
    if (filter === "saved") return Boolean(post.savedByMe);
    return true;
}

export function appendFeedPosts(current: Post[], incoming: Post[]): Post[] {
    if (incoming.length === 0) return current;

    const seen = new Set(current.map((post) => post._id));
    return [...current, ...incoming.filter((post) => !seen.has(post._id))];
}

export function mergeFeedPosts(
    current: Post[],
    incoming: Post[],
    sort: FeedSort = "recent",
): Post[] {
    if (incoming.length === 0) return current;

    const seen = new Set(current.map((post) => post._id));
    const unique = incoming.filter((post) => !seen.has(post._id));
    if (unique.length === 0) return current;

    return sortFeedPosts([...current, ...unique], sort);
}

export type FeedEvent =
    | { type: "new"; post: Post }
    | { type: "liked"; event: PostLikedEvent }
    | { type: "saved"; event: PostSavedEvent }
    | { type: "deleted"; postId: string }
    | { type: "commentCount"; postId: string; commentCount: number };

export interface FeedEventContext {
    viewerId: string;
    filter?: FeedFilter;
    sort?: FeedSort;
}

export function applyFeedEvent(
    current: Post[],
    event: FeedEvent,
    context: FeedEventContext | string,
): Post[] {
    const { viewerId, filter = "all", sort = "recent" } =
        typeof context === "string" ? { viewerId: context } : context;

    switch (event.type) {
        case "new":
            if (!matchesFeedFilter(event.post, filter, viewerId)) {
                return current;
            }
            return mergeFeedPosts(current, [event.post], sort);
        case "liked": {
            const next = applyLikeEvent(current, event.event, viewerId);
            return sort === "popular" ? sortFeedPosts(next, sort) : next;
        }
        case "saved":
            return applySavedEvent(current, event.event, viewerId, filter);
        case "deleted":
            return removeFeedPost(current, event.postId);
        case "commentCount":
            return current.map((post) =>
                post._id === event.postId
                    ? { ...post, commentCount: event.commentCount }
                    : post,
            );
    }
}

export function upsertFeedPost(current: Post[], post: Post): Post[] {
    const index = current.findIndex((item) => item._id === post._id);
    if (index === -1) {
        return [post, ...current];
    }

    const next = current.slice();
    next[index] = { ...next[index], ...post };
    return next;
}

export function removeFeedPost(current: Post[], postId: string): Post[] {
    return current.filter((post) => post._id !== postId);
}

export function applyLikeEvent(
    current: Post[],
    event: PostLikedEvent,
    viewerId: string,
): Post[] {
    return current.map((post) => {
        if (post._id !== event.postId) return post;

        return {
            ...post,
            likeCount: event.likeCount,
            likedByMe:
                event.userId === viewerId ? event.liked : post.likedByMe,
        };
    });
}

export function setFeedPostSaved(
    current: Post[],
    postId: string,
    saved: boolean,
    filter: FeedFilter = "all",
): Post[] {
    if (!saved && filter === "saved") return removeFeedPost(current, postId);

    return current.map((post) =>
        post._id === postId ? { ...post, savedByMe: saved } : post,
    );
}

export function applySavedEvent(
    current: Post[],
    event: PostSavedEvent,
    viewerId: string,
    filter: FeedFilter = "all",
): Post[] {
    if (event.userId !== viewerId) return current;
    return setFeedPostSaved(current, event.postId, event.saved, filter);
}
