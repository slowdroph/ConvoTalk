import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import OptionSearch from "../../../components/ui/OptionSearch";
import { filterOptions } from "../../../utils/options";
import { FOCUS_RING } from "../utils";

export interface DiscoverPickerOption {
    id: string;
    label: string;
    emoji?: string;
    group?: string;
}

interface DiscoverOptionPickerProps {
    label: string;
    options: DiscoverPickerOption[];
    selected: string[];
    max: number;
    onChange: (next: string[]) => void;
}

export default function DiscoverOptionPicker({
    label,
    options,
    selected,
    max,
    onChange,
}: DiscoverOptionPickerProps) {
    const { t } = useTranslation("discover");
    const [query, setQuery] = useState("");
    const [expanded, setExpanded] = useState(false);
    const inputId = useId();
    const listId = useId();

    const selectedOptions = options.filter((option) =>
        selected.includes(option.id),
    );
    const filtered = filterOptions(options, query);

    const groups: Array<{ group: string; items: DiscoverPickerOption[] }> = [];
    for (const option of filtered) {
        const group = option.group ?? "";
        const existing = groups.find((entry) => entry.group === group);
        if (existing) existing.items.push(option);
        else groups.push({ group, items: [option] });
    }

    const toggle = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter((value) => value !== id));
            return;
        }
        if (selected.length >= max) return;
        onChange([...selected, id]);
    };

    return (
        <div role="group" aria-label={label} className="flex flex-col gap-2">
            <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                aria-controls={listId}
                className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-lg text-left text-xs font-semibold text-slate-700 dark:text-noir-text-bright ${FOCUS_RING}`}
            >
                <span>{label}</span>
                <span className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-normal text-slate-500 dark:text-noir-text-muted">
                        {t("filters.selectedCount", { count: selected.length })}
                    </span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m6 9 6 6 6-6"
                        />
                    </svg>
                </span>
            </button>

            {selectedOptions.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                    {selectedOptions.map((option) => (
                        <li key={option.id}>
                            <button
                                type="button"
                                onClick={() => toggle(option.id)}
                                aria-label={t("activeFilters.remove", {
                                    label: option.label,
                                })}
                                className={`inline-flex min-h-7 items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-50 px-2.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400 ${FOCUS_RING}`}
                            >
                                {option.emoji && (
                                    <span aria-hidden="true">{option.emoji}</span>
                                )}
                                {option.label}
                                <span aria-hidden="true">×</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {expanded && (
                <div id={listId} className="flex flex-col gap-2">
                    <label htmlFor={inputId} className="sr-only">
                        {t("filters.searchOptions")}
                    </label>
                    <OptionSearch
                        id={inputId}
                        value={query}
                        onChange={setQuery}
                        placeholder={t("filters.searchOptions")}
                    />

                    {selected.length >= max && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                            {t("filters.max", { count: max })}
                        </p>
                    )}

                    <div className="space-y-2">
                        {filtered.length === 0 && (
                            <p className="text-[11px] text-slate-500 dark:text-noir-text-muted">
                                {t("filters.noOptions")}
                            </p>
                        )}
                        {groups.map((entry) => (
                            <div key={entry.group || "all"} className="space-y-1">
                                {entry.group && (
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-noir-text-muted">
                                        {entry.group}
                                    </p>
                                )}
                                <ul className="flex flex-wrap gap-1.5">
                                    {entry.items.map((option) => {
                                        const active = selected.includes(
                                            option.id,
                                        );
                                        const disabled =
                                            !active && selected.length >= max;
                                        return (
                                            <li key={option.id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggle(option.id)
                                                    }
                                                    aria-pressed={active}
                                                    disabled={disabled}
                                                    className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${
                                                        active
                                                            ? "border-emerald-600/40 bg-emerald-50 font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                            : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-noir-border dark:text-noir-text-muted dark:hover:bg-noir-surface-alt"
                                                    }`}
                                                >
                                                    {option.emoji && (
                                                        <span aria-hidden="true">
                                                            {option.emoji}
                                                        </span>
                                                    )}
                                                    {option.label}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
