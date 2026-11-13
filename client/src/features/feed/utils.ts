import type { Post, PostLikedEvent } from "../../types";

function timeOf(post: Post): number {
    return new Date(post.createdAt).getTime();
}

function comparePosts(a: Post, b: Post): number {
    const byDate = timeOf(b) - timeOf(a);
    if (byDate !== 0) return byDate;
    return b._id.localeCompare(a._id);
}

export function mergeFeedPosts(current: Post[], incoming: Post[]): Post[] {
    if (incoming.length === 0) return current;

    const seen = new Set(current.map((post) => post._id));
    const unique = incoming.filter((post) => !seen.has(post._id));
    if (unique.length === 0) return current;

    return [...current, ...unique].sort(comparePosts);
}

export type FeedEvent =
    | { type: "new"; post: Post }
    | { type: "liked"; event: PostLikedEvent }
    | { type: "deleted"; postId: string };

export function applyFeedEvent(
    current: Post[],
    event: FeedEvent,
    viewerId: string,
): Post[] {
    switch (event.type) {
        case "new":
            return mergeFeedPosts(current, [event.post]);
        case "liked":
            return applyLikeEvent(current, event.event, viewerId);
        case "deleted":
            return removeFeedPost(current, event.postId);
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
