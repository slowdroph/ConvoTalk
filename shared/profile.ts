export const MAX_LANGUAGES = 8;
export const MIN_AGE = 18;
export const MAX_AGE = 120;

export const GENDER_OPTIONS = [
    { id: "woman", label: "Mulher" },
    { id: "man", label: "Homem" },
    { id: "nonbinary", label: "Não binário" },
    { id: "other", label: "Outro" },
    { id: "prefer_not_to_say", label: "Prefiro não informar" },
] as const;

export type GenderId = (typeof GENDER_OPTIONS)[number]["id"];

export const LANGUAGE_OPTIONS = [
    { id: "pt", label: "Português", emoji: "🇧🇷" },
    { id: "en", label: "Inglês", emoji: "🇺🇸" },
    { id: "es", label: "Espanhol", emoji: "🇪🇸" },
    { id: "fr", label: "Francês", emoji: "🇫🇷" },
    { id: "de", label: "Alemão", emoji: "🇩🇪" },
    { id: "it", label: "Italiano", emoji: "🇮🇹" },
    { id: "ja", label: "Japonês", emoji: "🇯🇵" },
    { id: "ko", label: "Coreano", emoji: "🇰🇷" },
    { id: "zh", label: "Chinês", emoji: "🇨🇳" },
    { id: "ru", label: "Russo", emoji: "🇷🇺" },
    { id: "ar", label: "Árabe", emoji: "🇸🇦" },
    { id: "hi", label: "Hindi", emoji: "🇮🇳" },
    { id: "libras", label: "Libras", emoji: "🤟" },
] as const;

export type LanguageId = (typeof LANGUAGE_OPTIONS)[number]["id"];

export const LANGUAGE_LEVEL_OPTIONS = [
    { id: "basic", label: "Básico", value: 1 },
    { id: "intermediate", label: "Intermediário", value: 2 },
    { id: "advanced", label: "Avançado", value: 3 },
    { id: "fluent", label: "Fluente", value: 4 },
] as const;

export type LanguageLevelId = (typeof LANGUAGE_LEVEL_OPTIONS)[number]["id"];

export const DEFAULT_LANGUAGE_LEVEL: LanguageLevelId = "intermediate";

const GENDER_ID_SET = new Set<string>(
    GENDER_OPTIONS.map((gender) => gender.id),
);

const LANGUAGE_ID_SET = new Set<string>(
    LANGUAGE_OPTIONS.map((language) => language.id),
);

const LANGUAGE_LEVEL_ID_SET = new Set<string>(
    LANGUAGE_LEVEL_OPTIONS.map((level) => level.id),
);

export function isGenderId(value: string): value is GenderId {
    return GENDER_ID_SET.has(value);
}

export function isLanguageId(value: string): value is LanguageId {
    return LANGUAGE_ID_SET.has(value);
}

export function isLanguageLevelId(
    value: string,
): value is LanguageLevelId {
    return LANGUAGE_LEVEL_ID_SET.has(value);
}

export function getGenderOption(id: string) {
    return GENDER_OPTIONS.find((gender) => gender.id === id);
}

export function getLanguageOption(id: string) {
    return LANGUAGE_OPTIONS.find((language) => language.id === id);
}

export function getLanguageLevelOption(id: string) {
    return LANGUAGE_LEVEL_OPTIONS.find((level) => level.id === id);
}

export function normalizeLanguageLevels(
    languages: string[],
    levels: Record<string, string> | null | undefined,
): Record<string, LanguageLevelId> {
    const normalized: Record<string, LanguageLevelId> = {};
    for (const code of languages) {
        const level = levels?.[code];
        normalized[code] =
            level && isLanguageLevelId(level)
                ? level
                : DEFAULT_LANGUAGE_LEVEL;
    }
    return normalized;
}

export function calculateAge(birthdate: Date | string): number | null {
    const date =
        birthdate instanceof Date ? birthdate : new Date(birthdate);
    if (Number.isNaN(date.getTime())) return null;

    const today = new Date();
    let age = today.getUTCFullYear() - date.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - date.getUTCMonth();
    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getUTCDate() < date.getUTCDate())
    ) {
        age -= 1;
    }

    return age;
}
