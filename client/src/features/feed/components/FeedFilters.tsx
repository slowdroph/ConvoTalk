import type { FeedFilter } from "../services/feedApi";

interface FilterOption {
    value: FeedFilter;
    label: string;
    icon: string;
}

const FILTERS: FilterOption[] = [
    {
        value: "all",
        label: "Todos os Posts",
        icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    },
    {
        value: "popular",
        label: "Populares",
        icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
    },
    {
        value: "media",
        label: "Mídia & Fotos",
        icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
        value: "mine",
        label: "Meus Posts",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
        value: "saved",
        label: "Salvos",
        icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
    },
];

interface FeedFiltersProps {
    value: FeedFilter;
    onChange: (filter: FeedFilter) => void;
    variant?: "sidebar" | "chips";
}

export default function FeedFilters({
    value,
    onChange,
    variant = "sidebar",
}: FeedFiltersProps) {
    if (variant === "chips") {
        return (
            <nav
                aria-label="Filtros de Posts"
                className="flex gap-2 overflow-x-auto pb-1"
            >
                {FILTERS.map((option) => {
                    const active = option.value === value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            aria-pressed={active}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                                active
                                    ? "border-emerald-500/40 bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-muted dark:hover:bg-noir-surface-alt"
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </nav>
        );
    }

    return (
        <nav
            aria-label="Filtros de Posts"
            className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-noir-border dark:bg-noir-surface"
        >
            {FILTERS.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        aria-pressed={active}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                            active
                                ? "border-emerald-500/20 bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
                                : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-noir-text-muted dark:hover:bg-noir-surface-alt dark:hover:text-noir-text-bright"
                        }`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={option.icon}
                            />
                        </svg>
                        <span>{option.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
