import { useEffect, useRef } from "react";
import type { Post } from "../../../types";
import PostCard from "./PostCard";
import PostSkeleton from "./PostSkeleton";

interface FeedListProps {
    posts: Post[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    currentUserId?: string;
    onLoadMore: () => void;
    onRetry: () => void;
    onRetryMore: () => void;
    onLike: (post: Post) => Promise<void>;
    onDelete: (postId: string) => Promise<void>;
    onOpenAuthor: (author: NonNullable<Post["author"]>) => void;
}

export default function FeedList({
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    currentUserId,
    onLoadMore,
    onRetry,
    onRetryMore,
    onLike,
    onDelete,
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
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-noir-border dark:bg-noir-card">
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
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-noir-border dark:bg-noir-card">
                <p className="text-sm font-medium text-slate-700 dark:text-noir-text-bright">
                    Nenhum post ainda
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-noir-text-muted">
                    Seja a primeira pessoa a compartilhar algo no feed.
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
                    onLike={onLike}
                    onDelete={onDelete}
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
                    Você chegou ao fim do feed.
                </p>
            )}
        </div>
    );
}
