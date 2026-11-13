import { useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { formatTimeAgo } from "../../../utils/format";
import type { Post } from "../../../types";
import Avatar from "../../../components/ui/Avatar";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import PostImage from "./PostImage";

interface PostCardProps {
    post: Post;
    currentUserId?: string;
    onLike: (post: Post) => Promise<void>;
    onDelete: (postId: string) => Promise<void>;
    onOpenAuthor: (author: NonNullable<Post["author"]>) => void;
}

export default function PostCard({
    post,
    currentUserId,
    onLike,
    onDelete,
    onOpenAuthor,
}: PostCardProps) {
    const { showToast } = useToast();
    const [liking, setLiking] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isOwner = Boolean(
        currentUserId && post.author?._id === currentUserId,
    );

    const handleLike = async () => {
        if (liking) return;
        setLiking(true);
        try {
            await onLike(post);
        } catch {
            showToast({
                type: "error",
                message: "Não foi possível atualizar a curtida.",
            });
        } finally {
            setLiking(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await onDelete(post._id);
            showToast({ type: "success", message: "Post excluído." });
            setConfirmOpen(false);
        } catch {
            showToast({ type: "error", message: "Erro ao excluir o post." });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 dark:border-noir-border dark:bg-noir-card dark:hover:border-noir-border-light">
            <header className="flex items-start gap-3">
                <button
                    type="button"
                    onClick={() =>
                        post.author && onOpenAuthor(post.author)
                    }
                    disabled={!post.author}
                    aria-label={
                        post.author
                            ? `Abrir perfil de ${post.author.name}`
                            : "Autor indisponível"
                    }
                    className="shrink-0 rounded-full transition-opacity hover:opacity-90 disabled:cursor-default"
                >
                    <Avatar
                        src={post.author?.avatar}
                        name={post.author?.name ?? "?"}
                        size="md"
                    />
                </button>

                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={() =>
                            post.author && onOpenAuthor(post.author)
                        }
                        disabled={!post.author}
                        className="block max-w-full truncate text-left text-sm font-semibold text-slate-900 hover:underline dark:text-noir-text-bright disabled:cursor-default disabled:hover:no-underline"
                    >
                        {post.author?.name ?? "Usuário"}
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-noir-text-muted">
                        {post.author?.publicId && (
                            <span className="truncate font-mono">
                                #{post.author.publicId}
                            </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <time dateTime={post.createdAt}>
                            {formatTimeAgo(post.createdAt)}
                        </time>
                        {post.edited && (
                            <>
                                <span aria-hidden="true">·</span>
                                <span>editado</span>
                            </>
                        )}
                    </div>
                </div>

                {isOwner && (
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(true)}
                        aria-label="Excluir post"
                        title="Excluir post"
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-noir-text-muted dark:hover:bg-red-950/20 dark:hover:text-red-400"
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

            {post.content && (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-noir-text-bright/90">
                    {post.content}
                </p>
            )}

            {post.image && <PostImage image={post.image} />}

            <footer className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-noir-border/70">
                <button
                    type="button"
                    onClick={handleLike}
                    disabled={liking}
                    aria-pressed={post.likedByMe}
                    aria-label={
                        post.likedByMe ? "Descurtir post" : "Curtir post"
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                        post.likedByMe
                            ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-noir-text-muted dark:hover:bg-noir-surface-alt dark:hover:text-noir-text-bright"
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
                            ? `${post.likeCount} ${
                                  post.likeCount === 1 ? "curtida" : "curtidas"
                              }`
                            : "Curtir"}
                    </span>
                </button>
            </footer>

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Excluir post"
                message="Esta ação não pode ser desfeita. Deseja excluir este post?"
                confirmLabel={deleting ? "Excluindo..." : "Excluir"}
                danger
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </article>
    );
}
