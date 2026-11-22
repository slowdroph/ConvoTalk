import { useTranslation } from "react-i18next";
import type { TrendingTopic } from "../../../types";

interface TrendingTopicsProps {
    topics: TrendingTopic[];
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onSelectTopic?: (tag: string) => void;
}

export default function TrendingTopics({
    topics,
    loading = false,
    error = null,
    onRetry,
    onSelectTopic,
}: TrendingTopicsProps) {
    const { t } = useTranslation("feed");
    return (
        <section
            aria-label={t("trending.aria")}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-noir-border dark:bg-noir-surface sm:p-5"
        >
            <div className="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                </svg>
                <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-noir-text-bright">
                    {t("trending.title")}
                </h2>
            </div>

            <div className="mt-3 space-y-2">
                {loading && topics.length === 0 && (
                    <>
                        {[0, 1, 2].map((index) => (
                            <div
                                key={index}
                                className="animate-pulse rounded-xl border border-slate-100 p-2 dark:border-noir-border/50"
                            >
                                <div className="h-3 w-24 rounded bg-slate-200 dark:bg-noir-surface-alt" />
                                <div className="mt-2 h-2.5 w-32 rounded bg-slate-100 dark:bg-noir-surface-alt/70" />
                            </div>
                        ))}
                    </>
                )}

                {!loading && error && (
                    <div className="rounded-xl border border-slate-200 p-3 text-center dark:border-noir-border">
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {error}
                        </p>
                        {onRetry && (
                            <button
                                type="button"
                                onClick={onRetry}
                                className="mt-2 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                            >
                                {t("trending.retry")}
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && topics.length === 0 && (
                    <p className="px-1 py-2 text-xs text-slate-500 dark:text-noir-text-muted">
                        {t("trending.empty")}
                    </p>
                )}

                {topics.map((topic) => (
                    <button
                        key={topic.tag}
                        type="button"
                        onClick={() => onSelectTopic?.(topic.tag)}
                        aria-label={t("trending.searchTag", {
                            tag: topic.tag,
                        })}
                        className="w-full rounded-xl border border-slate-100 bg-slate-50 p-2 text-left transition-colors hover:border-emerald-500/30 hover:bg-emerald-50 dark:border-noir-border/50 dark:bg-noir-surface-alt/40 dark:hover:border-emerald-800/40 dark:hover:bg-emerald-950/20"
                    >
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-noir-text-bright">
                            {topic.tag}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-noir-text-muted">
                            {t("trending.postCount", { count: topic.count })}
                        </p>
                    </button>
                ))}
            </div>
        </section>
    );
}
