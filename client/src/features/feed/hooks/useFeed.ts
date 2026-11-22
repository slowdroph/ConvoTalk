import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/useAuth";
import { useSocket } from "../../../hooks/useSocket";
import { getErrorMessage } from "../../../utils/errors";
import type {
    CommentCreatedEvent,
    CommentDeletedEvent,
    Post,
    PostCursor,
    PostDeletedEvent,
    PostLikedEvent,
    PostPollEvent,
    PostPollPayload,
    PostSavedEvent,
} from "../../../types";
import {
    deletePost as deletePostRequest,
    getFeed,
    getSavedPosts,
    likePost,
    resolveFeedQuery,
    savePost as savePostRequest,
    searchPosts as searchPostsRequest,
    unlikePost,
    unsavePost as unsavePostRequest,
    unvotePoll as unvotePollRequest,
    votePoll as votePollRequest,
    type FeedFilter,
    type FeedQuery,
} from "../services/feedApi";
import {
    appendFeedPosts,
    applyFeedEvent,
    applyOwnPollVote,
    type FeedEvent,
    mergeFeedPosts,
    removeFeedPost,
    setFeedPostSaved,
    sortFeedPosts,
} from "../utils";

const PAGE_SIZE = 20;

interface LikeEventRecord {
    seq: number;
    userId: string;
    liked: boolean;
}

export function useFeed(
    filter: FeedFilter = "all",
    options: { query?: string } = {},
) {
    const { t } = useTranslation("feed");
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const { filter: apiFilter, sort } = resolveFeedQuery(filter);
    const searchQuery = options.query?.trim() ?? "";
    const isSearch = searchQuery.length >= 2 && filter !== "saved";
    const isSavedFeed = filter === "saved" && !isSearch;
    const [posts, setPosts] = useState<Post[]>([]);
    const [nextCursor, setNextCursor] = useState<PostCursor | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const loadingMoreRef = useRef(false);
    const hasLoadedRef = useRef(false);
    const syncingRef = useRef(false);
    const requestIdRef = useRef(0);
    const pendingEventsRef = useRef<FeedEvent[]>([]);
    const prevConnectedRef = useRef(connected);
    const hasConnectedRef = useRef(connected);

    const likeEventSeqRef = useRef(0);
    const likeEventsRef = useRef<Map<string, LikeEventRecord>>(new Map());

    const viewerId = user?._id ?? "";

    const applyEvent = useCallback(
        (event: FeedEvent) => {
            setPosts((prev) =>
                applyFeedEvent(prev, event, {
                    viewerId,
                    filter,
                    sort,
                    query: isSearch ? searchQuery : undefined,
                }),
            );
        },
        [viewerId, filter, sort, isSearch, searchQuery],
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
        const requestId = ++requestIdRef.current;
        syncingRef.current = true;
        loadingMoreRef.current = false;
        pendingEventsRef.current = [];
        setLoadingMore(false);
        setLoading(true);
        setError(null);

        try {
            const data = isSearch
                ? await searchPostsRequest({
                      q: searchQuery,
                      limit: PAGE_SIZE,
                      filter: apiFilter,
                      sort,
                  })
                : isSavedFeed
                  ? await getSavedPosts({ limit: PAGE_SIZE })
                  : await getFeed({
                        limit: PAGE_SIZE,
                        filter: apiFilter,
                        sort,
                    });

            if (requestId !== requestIdRef.current) return;

            let nextPosts = data.posts;
            for (const event of pendingEventsRef.current) {
                nextPosts = applyFeedEvent(nextPosts, event, {
                    viewerId,
                    filter,
                    sort,
                    query: isSearch ? searchQuery : undefined,
                });
            }

            setPosts(nextPosts);
            setNextCursor(data.nextCursor);
            setHasMore(Boolean(data.nextCursor));
            hasLoadedRef.current = true;
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setError(getErrorMessage(err, t("hooks.feedLoadError")));
        } finally {
            if (requestId === requestIdRef.current) {
                pendingEventsRef.current = [];
                syncingRef.current = false;
                setLoading(false);
            }
        }
    }, [
        apiFilter,
        filter,
        isSavedFeed,
        isSearch,
        searchQuery,
        sort,
        t,
        viewerId,
    ]);

    const loadMore = useCallback(async () => {
        if (loadingMoreRef.current || !nextCursor) return;

        const requestId = requestIdRef.current;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        setError(null);

        const query: FeedQuery = {
            limit: PAGE_SIZE,
            filter: apiFilter,
            sort,
            beforeId: nextCursor.beforeId,
        };
        if ("beforeLikes" in nextCursor) {
            query.beforeLikes = nextCursor.beforeLikes;
        } else {
            query.before = nextCursor.before;
        }

        try {
            const data = isSearch
                ? await searchPostsRequest({ ...query, q: searchQuery })
                : isSavedFeed
                  ? await getSavedPosts({
                        limit: PAGE_SIZE,
                        beforeId: nextCursor.beforeId,
                        ...("before" in nextCursor
                            ? { before: nextCursor.before }
                            : {}),
                    })
                  : await getFeed(query);

            if (requestId !== requestIdRef.current) return;

            setPosts((prev) =>
                isSavedFeed
                    ? appendFeedPosts(prev, data.posts)
                    : mergeFeedPosts(prev, data.posts, sort),
            );
            setNextCursor(data.nextCursor);
            setHasMore(Boolean(data.nextCursor));
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setError(getErrorMessage(err, t("hooks.feedLoadMoreError")));
        } finally {
            if (requestId === requestIdRef.current) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [
        apiFilter,
        isSavedFeed,
        isSearch,
        nextCursor,
        searchQuery,
        sort,
        t,
    ]);

    const retryLoadMore = useCallback(() => {
        void loadMore();
    }, [loadMore]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

        const handleSaved = (event: PostSavedEvent) => {
            enqueueEvent({ type: "saved", event });
        };

        const handlePoll = (event: PostPollEvent) => {
            enqueueEvent({ type: "poll", event });
        };

        const handleCommentCount = (
            event: CommentCreatedEvent | CommentDeletedEvent,
        ) => {
            enqueueEvent({
                type: "commentCount",
                postId: event.postId,
                commentCount: event.commentCount,
            });
        };

        socket.on("post:new", handleNew);
        socket.on("post:liked", handleLiked);
        socket.on("post:deleted", handleDeleted);
        socket.on("post:saved", handleSaved);
        socket.on("post:unsaved", handleSaved);
        socket.on("post:poll", handlePoll);
        socket.on("comment:created", handleCommentCount);
        socket.on("comment:deleted", handleCommentCount);

        return () => {
            socket.off("post:new", handleNew);
            socket.off("post:liked", handleLiked);
            socket.off("post:deleted", handleDeleted);
            socket.off("post:saved", handleSaved);
            socket.off("post:unsaved", handleSaved);
            socket.off("post:poll", handlePoll);
            socket.off("comment:created", handleCommentCount);
            socket.off("comment:deleted", handleCommentCount);
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
                sortFeedPosts(
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
                    sort,
                ),
            );

            try {
                const result = liked
                    ? await likePost(post._id)
                    : await unlikePost(post._id);

                const latest = likeEventsRef.current.get(post._id);
                if (latest && latest.seq > seqAtStart) return;

                setPosts((prev) =>
                    sortFeedPosts(
                        prev.map((item) =>
                            item._id === post._id
                                ? {
                                      ...item,
                                      likeCount: result.likeCount,
                                      likedByMe: result.liked,
                                  }
                                : item,
                        ),
                        sort,
                    ),
                );
            } catch (err) {
                const latest = likeEventsRef.current.get(post._id);
                const hasNewerEvent = Boolean(latest && latest.seq > seqAtStart);
                const ownEventWon =
                    hasNewerEvent && latest?.userId === viewerId;

                setPosts((prev) =>
                    sortFeedPosts(
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
                        sort,
                    ),
                );
                throw err;
            }
        },
        [sort, viewerId],
    );

    const setCommentCount = useCallback(
        (postId: string, commentCount: number) => {
            enqueueEvent({ type: "commentCount", postId, commentCount });
        },
        [enqueueEvent],
    );

    const toggleSave = useCallback(
        async (post: Post) => {
            const saved = !post.savedByMe;
            const apply = (value: boolean) =>
                setPosts((prev) =>
                    setFeedPostSaved(prev, post._id, value, filter),
                );

            apply(saved);

            try {
                const result = saved
                    ? await savePostRequest(post._id)
                    : await unsavePostRequest(post._id);
                apply(result.saved);
            } catch (err) {
                apply(!saved);
                throw err;
            }
        },
        [filter],
    );

    const votePoll = useCallback(
        async (post: Post, optionId: string | null) => {
            const previousPoll = post.poll;
            if (!previousPoll) return;

            const apply = (poll: PostPollPayload | null) =>
                setPosts((prev) =>
                    prev.map((item) =>
                        item._id === post._id ? { ...item, poll } : item,
                    ),
                );

            apply(applyOwnPollVote(previousPoll, optionId));

            try {
                const result = optionId
                    ? await votePollRequest(post._id, optionId)
                    : await unvotePollRequest(post._id);
                apply(result.poll);
            } catch (err) {
                apply(previousPoll);
                throw err;
            }
        },
        [],
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
        toggleSave,
        votePoll,
        setCommentCount,
    };
}
