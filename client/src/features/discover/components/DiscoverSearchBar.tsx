import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const DEBOUNCE_MS = 350;

interface DiscoverSearchBarProps {
    value: string;
    onSearch: (value: string) => void;
}

export default function DiscoverSearchBar({
    value,
    onSearch,
}: DiscoverSearchBarProps) {
    const { t } = useTranslation("discover");
    const [term, setTerm] = useState(value);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTerm(value);
    }, [value]);

    useEffect(() => {
        if (term === value) return;

        const timer = window.setTimeout(() => onSearch(term), DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [term, value, onSearch]);

    const handleClear = () => {
        setTerm("");
        onSearch("");
    };

    const showHint =
        term.trim().length > 0 && term.trim().length < 3 && !term.startsWith("#");

    return (
        <form
            role="search"
            onSubmit={(event) => {
                event.preventDefault();
                onSearch(term);
            }}
        >
            <div className="relative">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-noir-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                    />
                </svg>
                <input
                    type="search"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder={t("search.placeholder")}
                    aria-label={t("search.aria")}
                    maxLength={50}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-bright dark:placeholder:text-noir-text-muted"
                />
                {term.length > 0 && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label={t("search.clear")}
                        title={t("search.clear")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-noir-surface-alt dark:hover:text-noir-text-bright"
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
            </div>
            {showHint && (
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-noir-text-muted">
                    {t("search.minLength")}
                </p>
            )}
        </form>
    );
}
