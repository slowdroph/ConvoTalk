import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSocket } from "../../../hooks/useSocket";
import { getErrorMessage } from "../../../utils/errors";
import type {
    CommentCreatedEvent,
    CommentDeletedEvent,
    Post,
    PostPollEvent,
    PostSavedEvent,
} from "../../../types";
import PostCard from "./PostCard";
import {
    getPost,
    likePost,
    savePost,
    unlikePost,
    unsavePost,
    unvotePoll,
    votePoll,
} from "../services/feedApi";

interface SharedPostDialogProps {
    postId: string | null;
    currentUserId?: string;
    onClose: () => void;
    onOpenAuthor: (author: NonNullable<Post["author"]>) => void;
    onCommentCountChange?: (postId: string, commentCount: number) => void;
}

export default function SharedPostDialog({
    postId,
    currentUserId,
    onClose,
    onOpenAuthor,
    onCommentCountChange,
}: SharedPostDialogProps) {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestIdRef = useRef(0);
    const closeRef = useRef<HTMLButtonElement>(null);
    const [prevPostId, setPrevPostId] = useState<string | null>(null);
    const { socket, connected } = useSocket();

    if (prevPostId !== postId) {
        setPrevPostId(postId);
        setPost(null);
        setError(null);
        setLoading(Boolean(postId));
    }

    useEffect(() => {
        if (!postId) return;

        const requestId = ++requestIdRef.current;

        getPost(postId)
            .then((data) => {
                if (requestId !== requestIdRef.current) return;
                setPost(data);
            })
            .catch((err: unknown) => {
                if (requestId !== requestIdRef.current) return;
                setError(
                    getErrorMessage(err, "Erro ao carregar o post."),
                );
            })
            .finally(() => {
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                }
            });
    }, [postId]);

    useEffect(() => {
        if (!postId) return;

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeRef.current?.focus();
        document.addEventListener("keydown", handleKey);

        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [postId, onClose]);

    useEffect(() => {
        if (!socket || !connected || !postId) return;

        const handleCommentCount = (
            event: CommentCreatedEvent | CommentDeletedEvent,
        ) => {
            if (event.postId !== postId) return;
            onCommentCountChange?.(event.postId, event.commentCount);
        };

        const handleSaved = (event: PostSavedEvent) => {
            if (event.postId !== postId || event.userId !== currentUserId) {
                return;
            }
            setPost((prev) =>
                prev && prev._id === event.postId
                    ? { ...prev, savedByMe: event.saved }
                    : prev,
            );
        };

        const handlePoll = (event: PostPollEvent) => {
            if (event.postId !== postId) return;
            setPost((prev) => {
                if (!prev || prev._id !== event.postId || !prev.poll) {
                    return prev;
                }
                return {
                    ...prev,
                    poll: {
                        options: event.options,
                        totalVotes: event.totalVotes,
                        myVoteOptionId:
                            event.userId === currentUserId
                                ? event.optionId
                                : prev.poll.myVoteOptionId,
                    },
                };
            });
        };

        socket.on("comment:created", handleCommentCount);
        socket.on("comment:deleted", handleCommentCount);
        socket.on("post:saved", handleSaved);
        socket.on("post:unsaved", handleSaved);
        socket.on("post:poll", handlePoll);

        return () => {
            socket.off("comment:created", handleCommentCount);
            socket.off("comment:deleted", handleCommentCount);
            socket.off("post:saved", handleSaved);
            socket.off("post:unsaved", handleSaved);
            socket.off("post:poll", handlePoll);
        };
    }, [socket, connected, postId, currentUserId, onCommentCountChange]);

    if (!postId) return null;

    const handleLike = async (target: Post) => {
        const result = target.likedByMe
            ? await unlikePost(target._id)
            : await likePost(target._id);

        setPost((prev) =>
            prev && prev._id === target._id
                ? {
                      ...prev,
                      likeCount: result.likeCount,
                      likedByMe: result.liked,
                  }
                : prev,
        );
    };

    const handleSave = async (target: Post) => {
        const result = target.savedByMe
            ? await unsavePost(target._id)
            : await savePost(target._id);

        setPost((prev) =>
            prev && prev._id === target._id
                ? { ...prev, savedByMe: result.saved }
                : prev,
        );
    };

    const handleVote = async (target: Post, optionId: string | null) => {
        const result = optionId
            ? await votePoll(target._id, optionId)
            : await unvotePoll(target._id);

        setPost((prev) =>
            prev && prev._id === target._id
                ? { ...prev, poll: result.poll }
                : prev,
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-4 sm:items-center"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Post compartilhado"
        >
            <div
                className="w-full max-w-xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                    <h2 className="text-sm font-semibold text-white">
                        Post compartilhado
                    </h2>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar post compartilhado"
                        className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {loading && (
                    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 dark:border-noir-border dark:bg-noir-surface">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-noir-border dark:bg-noir-surface">
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {error}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:border-noir-border dark:text-noir-text-bright dark:hover:bg-noir-surface-alt"
                        >
                            Fechar
                        </button>
                    </div>
                )}

                {!loading && !error && post && (
                    <PostCard
                        post={post}
                        currentUserId={currentUserId}
                        onLike={handleLike}
                        onSave={handleSave}
                        onVote={handleVote}
                        onCommentCountChange={onCommentCountChange}
                        onOpenAuthor={onOpenAuthor}
                    />
                )}
            </div>
        </div>,
        document.body,
    );
}
