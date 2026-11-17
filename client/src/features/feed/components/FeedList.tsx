import { useEffect, useRef } from "react";
import type { Post } from "../../../types";
import type { FeedFilter } from "../services/feedApi";
import PostCard from "./PostCard";
import PostSkeleton from "./PostSkeleton";

const EMPTY_STATE: Record<
    FeedFilter,
    { title: string; description: string }
> = {
    all: {
        title: "Nenhum post ainda",
        description: "Seja a primeira pessoa a compartilhar algo no feed.",
    },
    popular: {
        title: "Nenhum post popular ainda",
        description: "Curta e interaja para destacar as publicações.",
    },
    media: {
        title: "Nenhuma mídia publicada ainda",
        description: "Posts com fotos e imagens aparecerão aqui.",
    },
    mine: {
        title: "Você ainda não publicou nada",
        description: "Compartilhe sua primeira ideia com a comunidade.",
    },
    saved: {
        title: "Nenhum post salvo",
        description: "Salve posts para encontrá-los rapidamente aqui.",
    },
};

interface FeedListProps {
    posts: Post[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    currentUserId?: string;
    wallOwnerId?: string | null;
    filter?: FeedFilter;
    query?: string;
    emptyState?: { title: string; description: string };
    endLabel?: string;
    onLoadMore: () => void;
    onRetry: () => void;
    onRetryMore: () => void;
    onLike: (post: Post) => Promise<void>;
    onSave: (post: Post) => Promise<void>;
    onVote: (post: Post, optionId: string | null) => Promise<void>;
    onDelete: (postId: string) => Promise<void>;
    onCommentCountChange?: (postId: string, commentCount: number) => void;
    onOpenAuthor: (author: NonNullable<Post["author"]>) => void;
}

export default function FeedList({
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    currentUserId,
    wallOwnerId,
    filter = "all",
    query = "",
    emptyState,
    endLabel = "Você chegou ao fim do feed.",
    onLoadMore,
    onRetry,
    onRetryMore,
    onLike,
    onSave,
    onVote,
    onDelete,
    onCommentCountChange,
    onOpenAuthor,
}: FeedListProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore || loading || loadingMore || error) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) onLoadMore();
            },
            { rootMargin: "300px" },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, error, onLoadMore]);

    if (loading && posts.length === 0) {
        return (
            <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
            </div>
        );
    }

    if (!loading && error && posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-noir-border dark:bg-noir-surface">
                <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-200 dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-bright dark:hover:bg-noir-border"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    if (!loading && posts.length === 0) {
        const trimmedQuery = query.trim();
        const empty = trimmedQuery
            ? {
                  title: "Nenhum post encontrado",
                  description: `Nada corresponde a "${trimmedQuery}".`,
              }
            : (emptyState ?? EMPTY_STATE[filter]);
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-noir-border dark:bg-noir-surface">
                <p className="text-sm font-medium text-slate-700 dark:text-noir-text-bright">
                    {empty.title}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-noir-text-muted">
                    {empty.description}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={currentUserId}
                    wallOwnerId={wallOwnerId}
                    onLike={onLike}
                    onSave={onSave}
                    onVote={onVote}
                    onDelete={onDelete}
                    onCommentCountChange={onCommentCountChange}
                    onOpenAuthor={onOpenAuthor}
                />
            ))}

            <div ref={sentinelRef} aria-hidden="true" />

            {loadingMore && (
                <div className="flex justify-center py-4">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </div>
            )}

            {error && posts.length > 0 && (
                <div className="flex flex-col items-center gap-2 py-2">
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={onRetryMore}
                        className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            {!hasMore && !loadingMore && posts.length > 0 && (
                <p className="py-4 text-center text-xs text-slate-400 dark:text-noir-text-muted">
                    {endLabel}
                </p>
            )}
        </div>
    );
}
