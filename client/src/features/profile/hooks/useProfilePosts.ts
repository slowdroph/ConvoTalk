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
    likePost,
    savePost as savePostRequest,
    unlikePost,
    unsavePost as unsavePostRequest,
    unvotePoll as unvotePollRequest,
    votePoll as votePollRequest,
} from "../../feed/services/feedApi";
import {
    applyFeedEvent,
    applyOwnPollVote,
    type FeedEvent,
    mergeFeedPosts,
    removeFeedPost,
    setFeedPostSaved,
} from "../../feed/utils";
import { getProfilePosts } from "../services/profileApi";

const PAGE_SIZE = 20;

interface LikeEventRecord {
    seq: number;
    userId: string;
    liked: boolean;
}

export function useProfilePosts(
    profileUserId: string | null,
    options: { authored?: boolean } = {},
) {
    const { t } = useTranslation("profile");
    const authored = options.authored ?? false;
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsOwner, setPostsOwner] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<PostCursor | null>(null);
    const [loading, setLoading] = useState(Boolean(profileUserId));
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    const viewerId = user?._id ?? "";
    const requestIdRef = useRef(0);
    const loadingMoreRef = useRef(false);
    const hasLoadedRef = useRef(false);
    const prevConnectedRef = useRef(connected);
    const hasConnectedRef = useRef(connected);
    const likeEventSeqRef = useRef(0);
    const likeEventsRef = useRef<Map<string, LikeEventRecord>>(new Map());

    const applyEvent = useCallback((event: FeedEvent) => {
        setPosts((prev) =>
            applyFeedEvent(prev, event, { viewerId, filter: "all" }),
        );
    }, [viewerId]);

    const load = useCallback(async () => {
        if (!profileUserId) {
            setPosts([]);
            setNextCursor(null);
            setHasMore(false);
            setLoading(false);
            return;
        }

        const requestId = ++requestIdRef.current;
        loadingMoreRef.current = false;
        setLoading(true);
        setLoadingMore(false);
        setError(null);

        try {
            const data = await getProfilePosts(profileUserId, {
                limit: PAGE_SIZE,
                ...(authored ? { authored: true } : {}),
            });
            if (requestId !== requestIdRef.current) return;

            setPosts(data.posts);
            setPostsOwner(profileUserId);
            setNextCursor(data.nextCursor);
            setHasMore(Boolean(data.nextCursor));
            hasLoadedRef.current = true;
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setPosts([]);
            setPostsOwner(profileUserId);
            setError(
                getErrorMessage(
                    err,
                    authored
                        ? t("publications.loadError")
                        : t("wall.loadError"),
                ),
            );
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [profileUserId, authored, t]);

    const loadMore = useCallback(async () => {
        if (loadingMoreRef.current || !nextCursor || !profileUserId) return;

        const requestId = requestIdRef.current;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        setError(null);

        try {
            const data = await getProfilePosts(profileUserId, {
                limit: PAGE_SIZE,
                beforeId: nextCursor.beforeId,
                ...(authored ? { authored: true } : {}),
                ...("before" in nextCursor
                    ? { before: nextCursor.before }
                    : {}),
            });
            if (requestId !== requestIdRef.current) return;

            setPosts((prev) => mergeFeedPosts(prev, data.posts, "recent"));
            setNextCursor(data.nextCursor);
            setHasMore(Boolean(data.nextCursor));
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setError(getErrorMessage(err, t("publications.loadMoreError")));
        } finally {
            if (requestId === requestIdRef.current) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [nextCursor, profileUserId, authored, t]);

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
        if (!socket || !user || !profileUserId) return;

        const handleWallPost = (post: Post) => {
            if (!authored && post.profileId === profileUserId) {
                applyEvent({ type: "new", post });
            }
        };

        const handleAuthoredPost = (post: Post) => {
            if (
                authored &&
                !post.profileId &&
                post.author?._id === profileUserId
            ) {
                applyEvent({ type: "new", post });
            }
        };

        const handleLiked = (event: PostLikedEvent) => {
            likeEventSeqRef.current += 1;
            likeEventsRef.current.set(event.postId, {
                seq: likeEventSeqRef.current,
                userId: event.userId,
                liked: event.liked,
            });
            applyEvent({ type: "liked", event });
        };

        const handleDeleted = (event: PostDeletedEvent) => {
            likeEventsRef.current.delete(event.postId);
            applyEvent({ type: "deleted", postId: event.postId });
        };

        const handleSaved = (event: PostSavedEvent) => {
            applyEvent({ type: "saved", event });
        };

        const handlePoll = (event: PostPollEvent) => {
            applyEvent({ type: "poll", event });
        };

        const handleCommentCount = (
            event: CommentCreatedEvent | CommentDeletedEvent,
        ) => {
            applyEvent({
                type: "commentCount",
                postId: event.postId,
                commentCount: event.commentCount,
            });
        };

        socket.on("wall:post:new", handleWallPost);
        socket.on("post:new", handleAuthoredPost);
        socket.on("post:liked", handleLiked);
        socket.on("post:deleted", handleDeleted);
        socket.on("post:saved", handleSaved);
        socket.on("post:unsaved", handleSaved);
        socket.on("post:poll", handlePoll);
        socket.on("comment:created", handleCommentCount);
        socket.on("comment:deleted", handleCommentCount);

        return () => {
            socket.off("wall:post:new", handleWallPost);
            socket.off("post:new", handleAuthoredPost);
            socket.off("post:liked", handleLiked);
            socket.off("post:deleted", handleDeleted);
            socket.off("post:saved", handleSaved);
            socket.off("post:unsaved", handleSaved);
            socket.off("post:poll", handlePoll);
            socket.off("comment:created", handleCommentCount);
            socket.off("comment:deleted", handleCommentCount);
        };
    }, [socket, user, profileUserId, applyEvent, authored]);

    const addPost = useCallback(
        (post: Post) => {
            applyEvent({ type: "new", post });
        },
        [applyEvent],
    );

    const deletePostById = useCallback(async (postId: string) => {
        await deletePostRequest(postId);
        setPosts((prev) => removeFeedPost(prev, postId));
    }, []);

    const toggleLike = useCallback(
        async (post: Post) => {
            const liked = !post.likedByMe;
            const seqAtStart = likeEventSeqRef.current;
            const applyLocal = (likeCount: number, likedByMe: boolean) => {
                setPosts((prev) =>
                    prev.map((item) =>
                        item._id === post._id
                            ? { ...item, likeCount, likedByMe }
                            : item,
                    ),
                );
            };

            applyLocal(
                Math.max(0, post.likeCount + (liked ? 1 : -1)),
                liked,
            );

            try {
                const result = liked
                    ? await likePost(post._id)
                    : await unlikePost(post._id);
                const latest = likeEventsRef.current.get(post._id);
                if (latest && latest.seq > seqAtStart) return;
                applyLocal(result.likeCount, result.liked);
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

    const toggleSave = useCallback(
        async (post: Post) => {
            const saved = !post.savedByMe;
            const apply = (value: boolean) =>
                setPosts((prev) =>
                    setFeedPostSaved(prev, post._id, value, "all"),
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
        [],
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

    const setCommentCount = useCallback(
        (postId: string, commentCount: number) => {
            applyEvent({ type: "commentCount", postId, commentCount });
        },
        [applyEvent],
    );

    const isOwnerLoaded = Boolean(profileUserId) && postsOwner === profileUserId;

    return {
        posts: profileUserId && isOwnerLoaded ? posts : [],
        loading: Boolean(profileUserId) && (loading || !isOwnerLoaded),
        loadingMore,
        error: profileUserId && isOwnerLoaded ? error : null,
        hasMore: isOwnerLoaded ? hasMore : false,
        load,
        loadMore,
        addPost,
        deletePostById,
        toggleLike,
        toggleSave,
        votePoll,
        setCommentCount,
    };
}
