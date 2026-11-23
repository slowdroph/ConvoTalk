import { useTranslation } from "react-i18next";
import { countryName, interestLabel, spokenLanguageLabel } from "../../../i18n/catalogs";
import type { DiscoverFilterState } from "../utils";

interface DiscoverActiveFiltersProps {
    filters: DiscoverFilterState;
    onChange: (patch: Partial<DiscoverFilterState>) => void;
}

export default function DiscoverActiveFilters({
    filters,
    onChange,
}: DiscoverActiveFiltersProps) {
    const { t } = useTranslation("discover");

    const activityLabels: Record<string, string> = {
        "24h": t("filters.activity24h"),
        "7d": t("filters.activity7d"),
        "30d": t("filters.activity30d"),
    };

    const chips: Array<{ key: string; label: string; remove: () => void }> = [];

    if (filters.country) {
        chips.push({
            key: `country-${filters.country}`,
            label: t("activeFilters.country", {
                value: countryName(filters.country),
            }),
            remove: () => onChange({ country: "", city: "" }),
        });
    }

    if (filters.city) {
        chips.push({
            key: `city-${filters.city}`,
            label: t("activeFilters.city", { value: filters.city }),
            remove: () => onChange({ city: "" }),
        });
    }

    for (const code of filters.languages) {
        chips.push({
            key: `language-${code}`,
            label: t("activeFilters.language", {
                value: spokenLanguageLabel(code),
            }),
            remove: () =>
                onChange({
                    languages: filters.languages.filter(
                        (value) => value !== code,
                    ),
                }),
        });
    }

    for (const id of filters.interests) {
        chips.push({
            key: `interest-${id}`,
            label: t("activeFilters.interest", { value: interestLabel(id) }),
            remove: () =>
                onChange({
                    interests: filters.interests.filter(
                        (value) => value !== id,
                    ),
                }),
        });
    }

    if (filters.activeWithin) {
        chips.push({
            key: `activity-${filters.activeWithin}`,
            label: t("activeFilters.activity", {
                value: activityLabels[filters.activeWithin],
            }),
            remove: () => onChange({ activeWithin: null }),
        });
    }

    if (chips.length === 0) return null;

    return (
        <section
            aria-label={t("activeFilters.aria")}
            className="flex flex-wrap items-center gap-1.5"
        >
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type="button"
                    onClick={chip.remove}
                    aria-label={t("activeFilters.remove", {
                        label: chip.label,
                    })}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 transition-colors hover:border-emerald-500/40 hover:text-emerald-700 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-muted dark:hover:text-emerald-400"
                >
                    {chip.label}
                    <span aria-hidden="true">×</span>
                </button>
            ))}
        </section>
    );
}
