export const SUPPORTED_LANGUAGES = ["en", "es", "pt-BR", "fr"] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageOption {
    code: LanguageCode;
    nativeName: string;
    englishName: string;
    flag: string;
    locale: string;
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
    {
        code: "en",
        nativeName: "English",
        englishName: "English",
        flag: "US",
        locale: "en",
    },
    {
        code: "es",
        nativeName: "Español",
        englishName: "Spanish",
        flag: "ES",
        locale: "es",
    },
    {
        code: "pt-BR",
        nativeName: "Português (Brasil)",
        englishName: "Portuguese (Brazil)",
        flag: "BR",
        locale: "pt-BR",
    },
    {
        code: "fr",
        nativeName: "Français",
        englishName: "French",
        flag: "FR",
        locale: "fr",
    },
] as const;

export const DEFAULT_LANGUAGE: LanguageCode = "en";
export const FALLBACK_LANGUAGE: LanguageCode = "en";

const LANGUAGE_CODES = new Set<string>(SUPPORTED_LANGUAGES);

const BASE_LANGUAGE_MAP: Record<string, LanguageCode> = {
    en: "en",
    es: "es",
    pt: "pt-BR",
    fr: "fr",
};

export function isLanguageCode(value: unknown): value is LanguageCode {
    return typeof value === "string" && LANGUAGE_CODES.has(value);
}

export function normalizeLanguage(value?: string | null): LanguageCode {
    if (!value) return DEFAULT_LANGUAGE;

    const normalized = value.trim().replace(/_/g, "-");
    if (LANGUAGE_CODES.has(normalized)) return normalized as LanguageCode;

    const base = normalized.split("-")[0]?.toLowerCase();
    if (base && base in BASE_LANGUAGE_MAP) return BASE_LANGUAGE_MAP[base];

    return DEFAULT_LANGUAGE;
}

export function getLanguageOption(
    code: LanguageCode,
): LanguageOption | undefined {
    return LANGUAGE_OPTIONS.find((option) => option.code === code);
}
