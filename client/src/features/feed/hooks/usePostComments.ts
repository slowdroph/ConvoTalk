import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/useAuth";
import { useSocket } from "../../../hooks/useSocket";
import { getErrorMessage } from "../../../utils/errors";
import type {
    Comment,
    CommentCreatedEvent,
    CommentDeletedEvent,
} from "../../../types";
import {
    createComment as createCommentRequest,
    deleteComment as deleteCommentRequest,
    getComments,
    type CommentCursor,
} from "../services/commentsApi";

const PAGE_SIZE = 20;

function timeOf(comment: Comment): number {
    return new Date(comment.createdAt).getTime();
}

function sortComments(comments: Comment[]): Comment[] {
    return comments.slice().sort((a, b) => {
        const byDate = timeOf(b) - timeOf(a);
        return byDate !== 0 ? byDate : b._id.localeCompare(a._id);
    });
}

function mergeIncoming(current: Comment[], incoming: Comment): Comment[] {
    if (current.some((comment) => comment._id === incoming._id)) {
        return current;
    }

    const withoutOptimistic = incoming.clientCommentId
        ? current.filter(
              (comment) =>
                  !(
                      comment._id.startsWith("temp-") &&
                      comment.clientCommentId === incoming.clientCommentId
                  ),
          )
        : current;

    return sortComments([incoming, ...withoutOptimistic]);
}

export function usePostComments(postId: string, enabled: boolean) {
    const { t } = useTranslation("feed");
    const { user } = useAuth();
    const { socket, connected } = useSocket();
    const [comments, setComments] = useState<Comment[]>([]);
    const [nextCursor, setNextCursor] = useState<CommentCursor | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    const requestIdRef = useRef(0);
    const loadingMoreRef = useRef(false);
    const hasLoadedRef = useRef(false);
    const commentsRef = useRef<Comment[]>([]);
    const prevConnectedRef = useRef(connected);
    const [prevKey, setPrevKey] = useState<string | null>(null);

    const key = enabled ? postId : null;

    if (prevKey !== key) {
        setPrevKey(key);
        setComments([]);
        setNextCursor(null);
        setHasMore(false);
        setError(null);
        setLoading(Boolean(key));
    }

    useEffect(() => {
        commentsRef.current = comments;
    }, [comments]);

    const load = useCallback(async () => {
        if (!enabled || !postId) return;

        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);

        try {
            const data = await getComments(postId, { limit: PAGE_SIZE });
            if (requestId !== requestIdRef.current) return;
            setComments(data.comments);
            setNextCursor(data.nextCursor);
            setHasMore(Boolean(data.nextCursor));
            hasLoadedRef.current = true;
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setError(
                getErrorMessage(err, t("hooks.commentsLoadError")),
            );
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [enabled, postId, t]);

    const loadMore = useCallback(async () => {
        if (!enabled || !postId || loadingMoreRef.current || !nextCursor) {
            return;
        }

        const requestId = requestIdRef.current;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        setError(null);

        try {
            const data = await getComments(postId, {
                limit: PAGE_SIZE,
                before: nextCursor.before,
                beforeId: nextCursor.beforeId,
            });

            if (requestId !== requestIdRef.current) return;

            setComments((prev) => {
                const seen = new Set(prev.map((comment) => comment._id));
                return [
                    ...prev,
                    ...data.comments.filter(
                        (comment) => !seen.has(comment._id),
                    ),
                ];
            });
            setNextCursor(data.nextCursor);
            setHasMore(Boolean(data.nextCursor));
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setError(
                getErrorMessage(
                    err,
                    t("hooks.commentsLoadMoreError"),
                ),
            );
        } finally {
            if (requestId === requestIdRef.current) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [enabled, nextCursor, postId, t]);

    const retryLoadMore = useCallback(() => {
        void loadMore();
    }, [loadMore]);

    useEffect(() => {
        if (!enabled) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [enabled, load]);

    useEffect(() => {
        const wasConnected = prevConnectedRef.current;
        prevConnectedRef.current = connected;

        if (!enabled || !connected || wasConnected) return;
        if (hasLoadedRef.current) {
            void load();
        }
    }, [connected, enabled, load]);

    useEffect(() => {
        if (!socket || !enabled || !postId) return;

        const handleCreated = (event: CommentCreatedEvent) => {
            if (event.postId !== postId) return;
            setComments((prev) => mergeIncoming(prev, event.comment));
        };

        const handleDeleted = (event: CommentDeletedEvent) => {
            if (event.postId !== postId) return;
            setComments((prev) =>
                prev.filter((comment) => comment._id !== event.commentId),
            );
        };

        socket.on("comment:created", handleCreated);
        socket.on("comment:deleted", handleDeleted);

        return () => {
            socket.off("comment:created", handleCreated);
            socket.off("comment:deleted", handleDeleted);
        };
    }, [enabled, postId, socket]);

    const addComment = useCallback(
        async (content: string): Promise<number> => {
            const trimmed = content.trim();
            if (!postId || !trimmed) {
                throw new Error(t("hooks.commentEmpty"));
            }

            const clientCommentId = crypto.randomUUID();
            const tempId = `temp-${clientCommentId}`;
            const optimistic: Comment = {
                _id: tempId,
                post: postId,
                author: user
                    ? {
                          _id: user._id,
                          name: user.name,
                          publicId: user.publicId,
                          avatar: user.avatar ?? "",
                          status: user.status ?? "",
                          country: user.country ?? "",
                      }
                    : null,
                content: trimmed,
                clientCommentId,
                createdAt: new Date().toISOString(),
            };

            setComments((prev) => [optimistic, ...prev]);

            try {
                const result = await createCommentRequest(postId, {
                    content: trimmed,
                    clientCommentId,
                });

                setComments((prev) => {
                    const withoutTemp = prev.filter(
                        (comment) => comment._id !== tempId,
                    );
                    if (
                        withoutTemp.some(
                            (comment) => comment._id === result.comment._id,
                        )
                    ) {
                        return withoutTemp;
                    }
                    return sortComments([result.comment, ...withoutTemp]);
                });

                return result.commentCount;
            } catch (err) {
                setComments((prev) =>
                    prev.filter((comment) => comment._id !== tempId),
                );
                throw err;
            }
        },
        [postId, t, user],
    );

    const removeComment = useCallback(
        async (commentId: string): Promise<number> => {
            if (!postId) {
                throw new Error(t("hooks.postUnavailable"));
            }

            const removed = commentsRef.current.find(
                (comment) => comment._id === commentId,
            );
            setComments((prev) =>
                prev.filter((comment) => comment._id !== commentId),
            );

            try {
                const result = await deleteCommentRequest(postId, commentId);
                return result.commentCount;
            } catch (err) {
                if (removed) {
                    setComments((prev) =>
                        prev.some((comment) => comment._id === commentId)
                            ? prev
                            : sortComments([removed, ...prev]),
                    );
                }
                throw err;
            }
        },
        [postId, t],
    );

    return {
        comments,
        loading,
        loadingMore,
        error,
        hasMore,
        load,
        loadMore,
        retryLoadMore,
        addComment,
        removeComment,
    };
}
