import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import OptionSearch from "../../../components/ui/OptionSearch";
import { filterOptions } from "../../../utils/options";

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
    const inputId = useId();

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
        <fieldset className="flex flex-col gap-2">
            <legend className="flex w-full items-baseline justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-noir-text-bright">
                <span>{label}</span>
                <span className="font-mono text-[10px] font-normal text-slate-500 dark:text-noir-text-muted">
                    {t("filters.selectedCount", { count: selected.length })}
                </span>
            </legend>

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
                                className="inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400"
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
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    {t("filters.max", { count: max })}
                </p>
            )}

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {filtered.length === 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-noir-text-muted">
                        {t("filters.noOptions")}
                    </p>
                )}
                {groups.map((entry) => (
                    <div key={entry.group || "all"} className="space-y-1">
                        {entry.group && (
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-noir-text-muted">
                                {entry.group}
                            </p>
                        )}
                        <ul className="flex flex-wrap gap-1.5">
                            {entry.items.map((option) => {
                                const active = selected.includes(option.id);
                                const disabled = !active && selected.length >= max;
                                return (
                                    <li key={option.id}>
                                        <button
                                            type="button"
                                            onClick={() => toggle(option.id)}
                                            aria-pressed={active}
                                            disabled={disabled}
                                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
        </fieldset>
    );
}
