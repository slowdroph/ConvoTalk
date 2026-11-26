import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../contexts/ToastContext";
import { useSocket } from "../../../hooks/useSocket";
import { formatTimeAgo } from "../../../utils/format";
import { countryName } from "../../../i18n/catalogs";
import type { Post } from "../../../types";
import Avatar from "../../../components/ui/Avatar";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import CountryFlag from "../../../components/ui/CountryFlag";
import ImageLightbox from "../../../components/ui/ImageLightbox";
import PostComments from "./PostComments";
import PostPoll from "./PostPoll";
import { sharePost } from "../sharePost";

interface PostCardProps {
    post: Post;
    currentUserId?: string;
    wallOwnerId?: string | null;
    onLike: (post: Post) => Promise<void>;
    onSave: (post: Post) => Promise<void>;
    onVote: (post: Post, optionId: string | null) => Promise<void>;
    onDelete?: (postId: string) => Promise<void>;
    onCommentCountChange?: (postId: string, commentCount: number) => void;
    onOpenAuthor: (author: NonNullable<Post["author"]>) => void;
}

export default function PostCard({
    post,
    currentUserId,
    wallOwnerId,
    onLike,
    onSave,
    onVote,
    onDelete,
    onCommentCountChange,
    onOpenAuthor,
}: PostCardProps) {
    const { t } = useTranslation("feed");
    const { showToast } = useToast();
    const { onlineUsers } = useSocket();
    const [liking, setLiking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [votingPoll, setVotingPoll] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);

    const authorId = post.author?._id;
    const isOwner = Boolean(currentUserId && authorId === currentUserId);
    const isWallOwner = Boolean(
        currentUserId && wallOwnerId === currentUserId,
    );
    const canDelete = Boolean(onDelete && (isOwner || isWallOwner));
    const isWallAuthor = Boolean(wallOwnerId && authorId === wallOwnerId);
    const isWallPost = Boolean(
        post.profileId && post.profileId !== authorId,
    );
    const isOnline = Boolean(
        authorId && onlineUsers.some((user) => user.userId === authorId),
    );

    const handleLike = async () => {
        if (liking) return;
        setLiking(true);
        try {
            await onLike(post);
        } catch {
            showToast({
                type: "error",
                message: t("post.likeFailed"),
            });
        } finally {
            setLiking(false);
        }
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await onSave(post);
        } catch {
            showToast({
                type: "error",
                message: t("post.saveFailed"),
            });
        } finally {
            setSaving(false);
        }
    };

    const handleVote = async (optionId: string | null) => {
        if (votingPoll) return;
        setVotingPoll(true);
        try {
            await onVote(post, optionId);
        } catch {
            showToast({
                type: "error",
                message: t("post.voteFailed"),
            });
        } finally {
            setVotingPoll(false);
        }
    };

    const handleShare = async () => {
        if (sharing) return;
        setSharing(true);
        try {
            const result = await sharePost(post);
            if (result === "copied") {
                showToast({
                    type: "success",
                    message: t("post.shareCopied"),
                });
            }
        } catch {
            showToast({
                type: "error",
                message: t("post.shareFailed"),
            });
        } finally {
            setSharing(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        setDeleting(true);
        try {
            await onDelete(post._id);
            showToast({ type: "success", message: t("post.deleted") });
            setConfirmOpen(false);
        } catch {
            showToast({ type: "error", message: t("post.deleteError") });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 dark:border-noir-border dark:bg-noir-surface dark:hover:border-noir-border-light">
            <header className="flex items-center justify-between gap-3 p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            post.author && onOpenAuthor(post.author)
                        }
                        disabled={!post.author}
                        aria-label={
                            post.author
                                ? t("post.openProfileOf", {
                                      name: post.author.name,
                                  })
                                : t("post.authorUnavailable")
                        }
                        className="relative shrink-0 rounded-full transition-opacity hover:opacity-90 disabled:cursor-default"
                    >
                        <Avatar
                            src={post.author?.avatar}
                            name={post.author?.name ?? "?"}
                            size="md"
                            className="ring-1 ring-slate-200 dark:ring-noir-border"
                        />
                        <span
                            aria-hidden="true"
                            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-noir-surface ${
                                isOnline ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                        />
                    </button>

                    <div className="flex min-w-0 flex-col">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() =>
                                    post.author && onOpenAuthor(post.author)
                                }
                                disabled={!post.author}
                                className="max-w-full truncate text-left text-sm font-bold text-slate-900 hover:underline disabled:cursor-default disabled:hover:no-underline dark:text-noir-text-bright"
                            >
                                {post.author?.name ?? t("post.user")}
                            </button>
                            {post.author?.country && (
                                <CountryFlag
                                    country={post.author.country}
                                    name={countryName(post.author.country)}
                                    className="h-3 w-4"
                                />
                            )}
                            {isWallAuthor && (
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                    {t("post.author")}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-noir-text-muted">
                            {post.author?.publicId && (
                                <span className="truncate">
                                    #{post.author.publicId}
                                </span>
                            )}
                            {post.author?.publicId && (
                                <span aria-hidden="true">•</span>
                            )}
                            <time
                                dateTime={post.createdAt}
                                className="font-sans"
                            >
                                {formatTimeAgo(post.createdAt)}
                            </time>
                            {post.author?.city && (
                                <>
                                    <span aria-hidden="true">•</span>
                                    <span className="truncate font-sans">
                                        {post.author.city}
                                    </span>
                                </>
                            )}
                            {post.edited && (
                                <>
                                    <span aria-hidden="true">•</span>
                                    <span className="font-sans">
                                        {t("post.edited")}
                                    </span>
                                </>
                            )}
                            {isWallPost && (
                                <>
                                    <span aria-hidden="true">•</span>
                                    <span className="font-sans text-emerald-600 dark:text-emerald-400">
                                        {t("post.wroteOnWall")}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {canDelete && (
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(true)}
                        aria-label={t("post.delete")}
                        title={t("post.delete")}
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-noir-text-muted dark:hover:bg-red-950/20 dark:hover:text-red-400"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                )}
            </header>

            <div className="px-4 pb-3 sm:px-5">
                {post.content && (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-noir-text-bright/90">
                        {post.content}
                    </p>
                )}

                {post.image && (
                    <ImageLightbox
                        src={post.image.url}
                        alt={post.image.filename}
                        className="mt-3 block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition-opacity hover:opacity-95 dark:border-noir-border dark:bg-noir-surface-alt"
                        imageClassName="max-h-[520px] w-full object-cover"
                    />
                )}

                {post.poll && (
                    <PostPoll
                        poll={post.poll}
                        voting={votingPoll}
                        onVote={(optionId) => void handleVote(optionId)}
                    />
                )}
            </div>

            <footer className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-noir-border/70 dark:text-noir-text-muted sm:px-5">
                <button
                    type="button"
                    onClick={handleLike}
                    disabled={liking}
                    aria-pressed={post.likedByMe}
                    aria-label={
                        post.likedByMe
                            ? t("post.unlikeAria")
                            : t("post.likeAria")
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium transition-colors disabled:opacity-60 ${
                        post.likedByMe
                            ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                            : "hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-noir-surface-alt dark:hover:text-rose-400"
                    }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill={post.likedByMe ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                    <span>
                        {post.likeCount > 0
                            ? t("post.likeCount", {
                                  count: post.likeCount,
                              })
                            : t("post.like")}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setCommentsOpen((open) => !open)}
                    aria-expanded={commentsOpen}
                    aria-label={
                        commentsOpen
                            ? t("post.hideCommentsAria")
                            : t("post.commentAria")
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium transition-colors ${
                        commentsOpen
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "hover:bg-slate-100 hover:text-emerald-700 dark:hover:bg-noir-surface-alt dark:hover:text-emerald-400"
                    }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M8 10.5h8m-8 4h5m-9 5.25V6.75A2.25 2.25 0 016.25 4.5h11.5A2.25 2.25 0 0120 6.75v8.5a2.25 2.25 0 01-2.25 2.25H9.75L4 21.75z"
                        />
                    </svg>
                    <span>
                        {post.commentCount > 0
                            ? t("post.commentCount", {
                                  count: post.commentCount,
                              })
                            : t("post.comment")}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    aria-pressed={Boolean(post.savedByMe)}
                    aria-label={
                        post.savedByMe
                            ? t("post.removeSaved")
                            : t("post.savePost")
                    }
                    title={
                        post.savedByMe
                            ? t("post.removeSaved")
                            : t("post.savePost")
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium transition-colors disabled:opacity-60 ${
                        post.savedByMe
                            ? "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
                            : "hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-noir-surface-alt dark:hover:text-amber-400"
                    }`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill={post.savedByMe ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                    </svg>
                    <span>
                        {post.savedByMe ? t("post.saved") : t("post.save")}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={handleShare}
                    disabled={sharing}
                    aria-label={t("post.share")}
                    title={t("post.share")}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60 dark:hover:bg-noir-surface-alt dark:hover:text-noir-text-bright"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                    </svg>
                    <span>{t("post.share")}</span>
                </button>
            </footer>

            {commentsOpen && (
                <PostComments
                    postId={post._id}
                    postAuthorId={authorId}
                    currentUserId={currentUserId}
                    onCommentCountChange={(commentCount) =>
                        onCommentCountChange?.(post._id, commentCount)
                    }
                    onOpenAuthor={onOpenAuthor}
                />
            )}

            {onDelete && (
                <ConfirmDialog
                    isOpen={confirmOpen}
                    title={t("post.deleteTitle")}
                    message={
                        isWallPost && !isOwner
                            ? t("post.deleteWallMessage")
                            : t("post.deleteMessage")
                    }
                    confirmLabel={
                        deleting ? t("post.deleting") : t("post.deleteConfirm")
                    }
                    danger
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmOpen(false)}
                />
            )}
        </article>
    );
}
