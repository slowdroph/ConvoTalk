import { useTranslation } from "react-i18next";
import {
    INTEREST_OPTIONS,
} from "@shared/interests";
import { LANGUAGE_OPTIONS } from "@shared/profile";
import type { DiscoverActivityWindow, DiscoverSort } from "../../../types";
import {
    countryName,
    countryOptions,
    interestCategoryLabel,
    interestLabel,
    languageRegionLabel,
    spokenLanguageLabel,
} from "../../../i18n/catalogs";
import CityCombobox from "../../../components/ui/CityCombobox";
import DiscoverOptionPicker from "./DiscoverOptionPicker";
import {
    MAX_DISCOVER_FILTERS,
    type DiscoverFilterState,
} from "../utils";

const ACTIVITY_OPTIONS: Array<{
    value: DiscoverActivityWindow;
    labelKey: string;
}> = [
    { value: "24h", labelKey: "filters.activity24h" },
    { value: "7d", labelKey: "filters.activity7d" },
    { value: "30d", labelKey: "filters.activity30d" },
];

const SORT_OPTIONS: Array<{ value: DiscoverSort; labelKey: string }> = [
    { value: "active", labelKey: "filters.sortActive" },
    { value: "recent", labelKey: "filters.sortRecent" },
    { value: "name", labelKey: "filters.sortName" },
];

const SELECT_CLASS =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-bright";

const CITY_CLASS =
    "w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-bright dark:placeholder:text-noir-text-muted";

interface DiscoverFiltersProps {
    value: DiscoverFilterState;
    hasFilters: boolean;
    onChange: (patch: Partial<DiscoverFilterState>) => void;
    onClear: () => void;
}

export default function DiscoverFilters({
    value,
    hasFilters,
    onChange,
    onClear,
}: DiscoverFiltersProps) {
    const { t } = useTranslation("discover");

    const languageOptions = LANGUAGE_OPTIONS.map((language) => ({
        id: language.id,
        label: spokenLanguageLabel(language.id),
        emoji: language.emoji,
        group: languageRegionLabel(language.region),
    }));

    const interestOptions = INTEREST_OPTIONS.map((interest) => ({
        id: interest.id,
        label: interestLabel(interest.id),
        emoji: interest.emoji,
        group: interestCategoryLabel(interest.category),
    }));

    return (
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-noir-border dark:bg-noir-surface">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-noir-text-bright">
                    {t("filters.title")}
                </h2>
                <button
                    type="button"
                    onClick={onClear}
                    disabled={!hasFilters}
                    className="text-[11px] font-medium text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400"
                >
                    {t("filters.clear")}
                </button>
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="discover-country"
                    className="text-xs font-semibold text-slate-700 dark:text-noir-text-bright"
                >
                    {t("filters.country")}
                </label>
                <select
                    id="discover-country"
                    value={value.country}
                    onChange={(event) =>
                        onChange({ country: event.target.value, city: "" })
                    }
                    className={SELECT_CLASS}
                >
                    <option value="">{t("filters.allCountries")}</option>
                    {countryOptions().map((country) => (
                        <option key={country.code} value={country.code}>
                            {country.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="discover-city"
                    className="text-xs font-semibold text-slate-700 dark:text-noir-text-bright"
                >
                    {t("filters.city")}
                </label>
                <CityCombobox
                    id="discover-city"
                    value={value.city}
                    onChange={(city) => onChange({ city })}
                    country={value.country || null}
                    placeholder={t("filters.cityPlaceholder")}
                    disabled={!value.country}
                    className={CITY_CLASS}
                />
                {!value.country && (
                    <p className="text-[10px] text-slate-500 dark:text-noir-text-muted">
                        {t("filters.cityNeedsCountry")}
                    </p>
                )}
                {value.country && (
                    <p className="text-[10px] text-slate-500 dark:text-noir-text-muted">
                        {countryName(value.country)}
                    </p>
                )}
            </div>

            <DiscoverOptionPicker
                label={t("filters.languages")}
                options={languageOptions}
                selected={value.languages}
                max={MAX_DISCOVER_FILTERS}
                onChange={(languages) => onChange({ languages })}
            />

            <DiscoverOptionPicker
                label={t("filters.interests")}
                options={interestOptions}
                selected={value.interests}
                max={MAX_DISCOVER_FILTERS}
                onChange={(interests) => onChange({ interests })}
            />

            <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold text-slate-700 dark:text-noir-text-bright">
                    {t("filters.activity")}
                </legend>
                <div className="flex flex-wrap gap-1.5">
                    {ACTIVITY_OPTIONS.map((option) => {
                        const active = value.activeWithin === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() =>
                                    onChange({
                                        activeWithin: active
                                            ? null
                                            : option.value,
                                    })
                                }
                                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                                    active
                                        ? "border-emerald-600/40 bg-emerald-50 font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-noir-border dark:text-noir-text-muted dark:hover:bg-noir-surface-alt"
                                }`}
                            >
                                {t(option.labelKey)}
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="discover-sort"
                    className="text-xs font-semibold text-slate-700 dark:text-noir-text-bright"
                >
                    {t("filters.sort")}
                </label>
                <select
                    id="discover-sort"
                    value={value.sort}
                    onChange={(event) =>
                        onChange({ sort: event.target.value as DiscoverSort })
                    }
                    className={SELECT_CLASS}
                >
                    {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {t(option.labelKey)}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
