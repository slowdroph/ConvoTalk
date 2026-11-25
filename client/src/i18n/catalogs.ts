import i18n from "./index";
import { getLocale } from "./formatters";
import { COUNTRIES } from "../utils/countries";
import {
    INTEREST_CATEGORIES,
    INTEREST_OPTIONS,
} from "@shared/interests";
import {
    GENDER_OPTIONS,
    LANGUAGE_LEVEL_OPTIONS,
    LANGUAGE_OPTIONS,
    LANGUAGE_REGIONS,
} from "@shared/profile";

const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getDisplayNames(locale: string, type: "region" | "language") {
    const key = `${locale}:${type}`;
    const cached = displayNamesCache.get(key);
    if (cached) return cached;
    try {
        const instance = new Intl.DisplayNames([locale], { type });
        displayNamesCache.set(key, instance);
        return instance;
    } catch {
        return null;
    }
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function countryName(
    code: string | null | undefined,
    fallback = "",
): string {
    if (!code) return fallback;
    const names = getDisplayNames(getLocale(), "region");
    return names?.of(code) ?? fallback;
}

export function countryOptions() {
    return COUNTRIES.map((country) => ({
        ...country,
        name: countryName(country.code, country.name),
    }));
}

export function genderLabel(id: string): string {
    const fallback =
        GENDER_OPTIONS.find((option) => option.id === id)?.label ?? id;
    return i18n.t(`profile:gender.${id}`, { defaultValue: fallback });
}

export function spokenLanguageLabel(id: string): string {
    const option = LANGUAGE_OPTIONS.find((language) => language.id === id);
    const fallback = option?.label ?? id;
    if (id === "libras") {
        return i18n.t("profile:languageNames.libras", {
            defaultValue: fallback,
        });
    }
    const names = getDisplayNames(getLocale(), "language");
    const localized = names?.of(id);
    if (!localized || localized.toLowerCase() === id.toLowerCase()) {
        return fallback;
    }
    return capitalize(localized);
}

export function languageLevelLabel(id: string): string {
    const fallback =
        LANGUAGE_LEVEL_OPTIONS.find((level) => level.id === id)?.label ?? id;
    return i18n.t(`profile:levels.${id}`, { defaultValue: fallback });
}

const REGION_KEYS: Record<string, string> = {
    América: "america",
    Europa: "europe",
    Ásia: "asia",
    África: "africa",
    Oceania: "oceania",
    Outros: "other",
};

export function languageRegionLabel(region: string): string {
    const key = REGION_KEYS[region] ?? "other";
    return i18n.t(`profile:languageRegions.${key}`, {
        defaultValue: region,
    });
}

export function languageRegionOrder(): string[] {
    return [...LANGUAGE_REGIONS];
}

export function interestLabel(id: string): string {
    const fallback =
        INTEREST_OPTIONS.find((option) => option.id === id)?.label ?? id;
    return i18n.t(`profile:interests.${id}`, { defaultValue: fallback });
}

export function interestCategoryLabel(category: string): string {
    const index = INTEREST_CATEGORIES.indexOf(
        category as (typeof INTEREST_CATEGORIES)[number],
    );
    return i18n.t(`profile:interestCategories.${index}`, {
        defaultValue: category,
    });
}
