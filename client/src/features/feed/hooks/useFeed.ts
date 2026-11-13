import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useSocket } from "../../../hooks/useSocket";
import { getErrorMessage } from "../../../utils/errors";
import type { Post, PostDeletedEvent, PostLikedEvent } from "../../../types";
import {
    deletePost as deletePostRequest,
    getFeed,
    likePost,
    unlikePost,
    type PostCursor,
} from "../services/feedApi";
import {
    applyFeedEvent,
    type FeedEvent,
    mergeFeedPosts,
    removeFeedPost,
} from "../utils";

const PAGE_SIZE = 20;

interface LikeEventRecord {
    seq: number;
    userId: string;
    liked: boolean;
}

export function useFeed() {
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [posts, setPosts] = useState<Post[]>([]);
    const [nextCursor, setNextCursor] = useState<PostCursor | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const loadingMoreRef = useRef(false);
    const didInitRef = useRef(false);
    const hasLoadedRef = useRef(false);
    const syncingRef = useRef(false);
    const pendingEventsRef = useRef<FeedEvent[]>([]);
    const prevConnectedRef = useRef(connected);
    const hasConnectedRef = useRef(connected);

    const likeEventSeqRef = useRef(0);
    const likeEventsRef = useRef<Map<string, LikeEventRecord>>(new Map());

    const viewerId = user?._id ?? "";

    const applyEvent = useCallback(
        (event: FeedEvent) => {
            setPosts((prev) => applyFeedEvent(prev, event, viewerId));
        },
        [viewerId],
    );

    const enqueueEvent = useCallback(
        (event: FeedEvent) => {
            if (syncingRef.current) {
                pendingEventsRef.current.push(event);
                return;
            }
            applyEvent(event);
        },
        [applyEvent],
    );

    const load = useCallback(async () => {
        if (syncingRef.current) return;

        syncingRef.current = true;
        pendingEventsRef.current = [];
        setLoading(true);
        setError(null);

        try {
            const data = await getFeed({ limit: PAGE_SIZE });

            let nextPosts = data.posts;
            for (const event of pendingEventsRef.current) {
                nextPosts = applyFeedEvent(nextPosts, event, viewerId);
            }

            setPosts(nextPosts);
            setNextCursor(data.nextCursor);
            setHasMore(Boolean(data.nextCursor));
            hasLoadedRef.current = true;
        } catch (err) {
            setError(getErrorMessage(err, "Erro ao carregar o feed."));
        } finally {
            pendingEventsRef.current = [];
            syncingRef.current = false;
            setLoading(false);
        }
    }, [viewerId]);

    const loadMore = useCallback(async () => {
        if (loadingMoreRef.current || !nextCursor) return;

        loadingMoreRef.current = true;
        setLoadingMore(true);
        setError(null);

        try {
            const data = await getFeed({
                limit: PAGE_SIZE,
                before: nextCursor.before,
                beforeId: nextCursor.beforeId,
            });
            setPosts((prev) => mergeFeedPosts(prev, data.posts));
            setNextCursor(data.nextCursor);
            setHasMore(Boolean(data.nextCursor));
        } catch (err) {
            setError(getErrorMessage(err, "Erro ao carregar mais posts."));
        } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    }, [nextCursor]);

    const retryLoadMore = useCallback(() => {
        void loadMore();
    }, [loadMore]);

    useEffect(() => {
        if (didInitRef.current) return;
        didInitRef.current = true;
        void load();
    }, [load]);

    useEffect(() => {
        const wasConnected = prevConnectedRef.current;
        prevConnectedRef.current = connected;

        if (!connected) return;

        if (!hasConnectedRef.current) {
            hasConnectedRef.current = true;
            return;
        }

        if (!wasConnected && hasLoadedRef.current) {
            void load();
        }
    }, [connected, load]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleNew = (post: Post) => {
            enqueueEvent({ type: "new", post });
        };

        const handleLiked = (event: PostLikedEvent) => {
            likeEventSeqRef.current += 1;
            likeEventsRef.current.set(event.postId, {
                seq: likeEventSeqRef.current,
                userId: event.userId,
                liked: event.liked,
            });
            enqueueEvent({ type: "liked", event });
        };

        const handleDeleted = (event: PostDeletedEvent) => {
            likeEventsRef.current.delete(event.postId);
            enqueueEvent({ type: "deleted", postId: event.postId });
        };

        socket.on("post:new", handleNew);
        socket.on("post:liked", handleLiked);
        socket.on("post:deleted", handleDeleted);

        return () => {
            socket.off("post:new", handleNew);
            socket.off("post:liked", handleLiked);
            socket.off("post:deleted", handleDeleted);
        };
    }, [socket, user, enqueueEvent]);

    const addPost = useCallback(
        (post: Post) => {
            enqueueEvent({ type: "new", post });
        },
        [enqueueEvent],
    );

    const deletePostById = useCallback(async (postId: string) => {
        await deletePostRequest(postId);
        setPosts((prev) => removeFeedPost(prev, postId));
    }, []);

    const toggleLike = useCallback(
        async (post: Post) => {
            const liked = !post.likedByMe;
            const seqAtStart = likeEventSeqRef.current;

            setPosts((prev) =>
                prev.map((item) =>
                    item._id === post._id
                        ? {
                              ...item,
                              likedByMe: liked,
                              likeCount: Math.max(
                                  0,
                                  item.likeCount + (liked ? 1 : -1),
                              ),
                          }
                        : item,
                ),
            );

            try {
                const result = liked
                    ? await likePost(post._id)
                    : await unlikePost(post._id);

                const latest = likeEventsRef.current.get(post._id);
                if (latest && latest.seq > seqAtStart) return;

                setPosts((prev) =>
                    prev.map((item) =>
                        item._id === post._id
                            ? {
                                  ...item,
                                  likeCount: result.likeCount,
                                  likedByMe: result.liked,
                              }
                            : item,
                    ),
                );
            } catch (err) {
                const latest = likeEventsRef.current.get(post._id);
                const hasNewerEvent = Boolean(latest && latest.seq > seqAtStart);
                const ownEventWon =
                    hasNewerEvent && latest?.userId === viewerId;

                setPosts((prev) =>
                    prev.map((item) =>
                        item._id === post._id
                            ? {
                                  ...item,
                                  likeCount: hasNewerEvent
                                      ? item.likeCount
                                      : post.likeCount,
                                  likedByMe: ownEventWon
                                      ? Boolean(latest?.liked)
                                      : post.likedByMe,
                              }
                            : item,
                    ),
                );
                throw err;
            }
        },
        [viewerId],
    );

    return {
        posts,
        loading,
        loadingMore,
        error,
        hasMore,
        load,
        loadMore,
        retryLoadMore,
        addPost,
        deletePostById,
        toggleLike,
    };
}
