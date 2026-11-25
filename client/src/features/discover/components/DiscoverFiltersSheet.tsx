import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import DiscoverFilters from "./DiscoverFilters";
import { FOCUS_RING, type DiscoverFilterState } from "../utils";

interface DiscoverFiltersSheetProps {
    open: boolean;
    onClose: () => void;
    value: DiscoverFilterState;
    hasFilters: boolean;
    onChange: (patch: Partial<DiscoverFilterState>) => void;
    onClear: () => void;
}

export default function DiscoverFiltersSheet({
    open,
    onClose,
    value,
    hasFilters,
    onChange,
    onClear,
}: DiscoverFiltersSheetProps) {
    const { t } = useTranslation("discover");
    const panelRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();

        const focusables = () => {
            const panel = panelRef.current;
            if (!panel) return [];
            return Array.from(
                panel.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                ),
            ).filter((element) => !element.hasAttribute("disabled"));
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== "Tab") return;

            const items = focusables();
            if (items.length === 0) return;

            const first = items[0];
            const last = items[items.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            <div
                aria-hidden="true"
                onClick={onClose}
                className="absolute inset-0 bg-black/60"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={t("filters.title")}
                className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl dark:border-noir-border dark:bg-noir-base"
            >
                <div className="flex items-center justify-between gap-2 px-4 pt-3">
                    <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-noir-text-bright">
                        {t("filters.title")}
                    </h2>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label={t("filters.close")}
                        className={`rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-noir-text-muted dark:hover:bg-noir-surface-alt ${FOCUS_RING}`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="custom-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                    <DiscoverFilters
                        value={value}
                        hasFilters={hasFilters}
                        onChange={onChange}
                        onClear={onClear}
                        idPrefix="discover-mobile"
                        variant="plain"
                        showHeader={false}
                    />
                </div>

                <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-noir-border">
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={!hasFilters}
                        className={`inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-noir-border dark:text-noir-text-bright dark:hover:bg-noir-surface-alt ${FOCUS_RING}`}
                    >
                        {t("filters.clear")}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-emerald-700/30 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 ${FOCUS_RING}`}
                    >
                        {t("filters.showResults")}
                    </button>
                </div>
            </div>
        </div>
    );
}
