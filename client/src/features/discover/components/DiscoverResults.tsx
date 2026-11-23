import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { DiscoverMode, DiscoverUser } from "../../../types";
import DiscoverUserCard from "./DiscoverUserCard";

interface DiscoverResultsProps {
    users: DiscoverUser[];
    mode: DiscoverMode;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    hasFilters: boolean;
    onlineIds: Set<string>;
    busyId: string | null;
    onStartConversation: (user: DiscoverUser) => void;
    onViewProfile: (user: DiscoverUser) => void;
    onLoadMore: () => void;
    onRetry: () => void;
    onRetryMore: () => void;
    onClearFilters: () => void;
}

const GRID_CLASS =
    "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";

function CardSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-noir-border dark:bg-noir-surface">
            <div className="flex items-start gap-3">
                <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-noir-surface-alt" />
                <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-28 rounded bg-slate-200 dark:bg-noir-surface-alt" />
                    <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-noir-surface-alt/70" />
                    <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-noir-surface-alt/70" />
                </div>
            </div>
            <div className="mt-4 h-2.5 w-full rounded bg-slate-100 dark:bg-noir-surface-alt/70" />
            <div className="mt-2 h-8 w-full rounded-xl bg-slate-100 dark:bg-noir-surface-alt/70" />
        </div>
    );
}

export default function DiscoverResults({
    users,
    mode,
    loading,
    loadingMore,
    error,
    hasMore,
    hasFilters,
    onlineIds,
    busyId,
    onStartConversation,
    onViewProfile,
    onLoadMore,
    onRetry,
    onRetryMore,
    onClearFilters,
}: DiscoverResultsProps) {
    const { t } = useTranslation("discover");
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
    }, [error, hasMore, loading, loadingMore, onLoadMore]);

    if (loading && users.length === 0) {
        return (
            <div
                role="status"
                aria-live="polite"
                aria-label={t("results.loading")}
            >
                <div className={GRID_CLASS}>
                    {Array.from({ length: 6 }).map((_, index) => (
                        <CardSkeleton key={index} />
                    ))}
                </div>
            </div>
        );
    }

    if (!loading && error && users.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-noir-border dark:bg-noir-surface">
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 rounded-xl border border-emerald-700/30 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400"
                >
                    {t("common:actions.retry")}
                </button>
            </div>
        );
    }

    if (!loading && users.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-noir-border dark:bg-noir-surface">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-noir-text-bright">
                    {t("results.emptyTitle")}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-noir-text-muted">
                    {t("results.emptyDescription")}
                </p>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="mt-3 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        {t("results.clearFilters")}
                    </button>
                )}
            </div>
        );
    }

    return (
        <section aria-label={t("results.titleResults")} className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-noir-text-bright">
                    {mode === "suggested"
                        ? t("results.titleSuggested")
                        : t("results.titleResults")}
                </h2>
                <span
                    aria-live="polite"
                    className="font-mono text-[11px] text-slate-500 dark:text-noir-text-muted"
                >
                    {t("results.count", { count: users.length })}
                </span>
            </div>

            <ul className={GRID_CLASS}>
                {users.map((user) => (
                    <li key={user._id}>
                        <DiscoverUserCard
                            user={user}
                            online={onlineIds.has(user._id)}
                            busy={busyId === user._id}
                            onStartConversation={onStartConversation}
                            onViewProfile={onViewProfile}
                        />
                    </li>
                ))}
            </ul>

            {error && (
                <div className="text-center">
                    <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={onRetryMore}
                        className="mt-2 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        {t("common:actions.retry")}
                    </button>
                </div>
            )}

            <div ref={sentinelRef} aria-hidden="true" className="h-1" />

            {hasMore && !error && (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        aria-busy={loadingMore}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-noir-border dark:text-noir-text-bright dark:hover:bg-noir-surface-alt"
                    >
                        {loadingMore
                            ? t("common:actions.loading")
                            : t("results.loadMore")}
                    </button>
                </div>
            )}

            {!hasMore && !loadingMore && (
                <p className="text-center text-[11px] text-slate-400 dark:text-noir-text-muted">
                    {t("results.end")}
                </p>
            )}
        </section>
    );
}
