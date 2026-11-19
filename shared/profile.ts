export const MAX_LANGUAGES = 10;
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

export const LANGUAGE_REGIONS = [
    "América",
    "Europa",
    "Ásia",
    "África",
    "Oceania",
    "Outros",
] as const;

export type LanguageRegion = (typeof LANGUAGE_REGIONS)[number];

export const LANGUAGE_OPTIONS = [
    { id: "pt", label: "Português", emoji: "🇧🇷", region: "América" },
    { id: "en", label: "Inglês", emoji: "🇺🇸", region: "América" },
    { id: "es", label: "Espanhol", emoji: "🇪🇸", region: "Europa" },
    { id: "fr", label: "Francês", emoji: "🇫🇷", region: "Europa" },
    { id: "de", label: "Alemão", emoji: "🇩🇪", region: "Europa" },
    { id: "it", label: "Italiano", emoji: "🇮🇹", region: "Europa" },
    { id: "ja", label: "Japonês", emoji: "🇯🇵", region: "Ásia" },
    { id: "ko", label: "Coreano", emoji: "🇰🇷", region: "Ásia" },
    { id: "zh", label: "Chinês", emoji: "🇨🇳", region: "Ásia" },
    { id: "ru", label: "Russo", emoji: "🇷🇺", region: "Europa" },
    { id: "ar", label: "Árabe", emoji: "🇸🇦", region: "Ásia" },
    { id: "hi", label: "Hindi", emoji: "🇮🇳", region: "Ásia" },
    { id: "libras", label: "Libras", emoji: "🤟", region: "América" },

    { id: "nl", label: "Holandês", emoji: "🇳🇱", region: "Europa" },
    { id: "pl", label: "Polonês", emoji: "🇵🇱", region: "Europa" },
    { id: "sv", label: "Sueco", emoji: "🇸🇪", region: "Europa" },
    { id: "no", label: "Norueguês", emoji: "🇳🇴", region: "Europa" },
    { id: "da", label: "Dinamarquês", emoji: "🇩🇰", region: "Europa" },
    { id: "fi", label: "Finlandês", emoji: "🇫🇮", region: "Europa" },
    { id: "el", label: "Grego", emoji: "🇬🇷", region: "Europa" },
    { id: "tr", label: "Turco", emoji: "🇹🇷", region: "Europa" },
    { id: "cs", label: "Tcheco", emoji: "🇨🇿", region: "Europa" },
    { id: "ro", label: "Romeno", emoji: "🇷🇴", region: "Europa" },
    { id: "hu", label: "Húngaro", emoji: "🇭🇺", region: "Europa" },
    { id: "uk", label: "Ucraniano", emoji: "🇺🇦", region: "Europa" },
    { id: "bg", label: "Búlgaro", emoji: "🇧🇬", region: "Europa" },
    { id: "hr", label: "Croata", emoji: "🇭🇷", region: "Europa" },
    { id: "sr", label: "Sérvio", emoji: "🇷🇸", region: "Europa" },
    { id: "sk", label: "Eslovaco", emoji: "🇸🇰", region: "Europa" },
    { id: "sl", label: "Esloveno", emoji: "🇸🇮", region: "Europa" },
    { id: "lt", label: "Lituano", emoji: "🇱🇹", region: "Europa" },
    { id: "lv", label: "Letão", emoji: "🇱🇻", region: "Europa" },
    { id: "et", label: "Estoniano", emoji: "🇪🇪", region: "Europa" },
    { id: "ga", label: "Irlandês", emoji: "🇮🇪", region: "Europa" },
    { id: "ca", label: "Catalão", emoji: "🇦🇩", region: "Europa" },
    { id: "is", label: "Islandês", emoji: "🇮🇸", region: "Europa" },
    { id: "sq", label: "Albanês", emoji: "🇦🇱", region: "Europa" },
    { id: "mk", label: "Macedônio", emoji: "🇲🇰", region: "Europa" },
    { id: "bs", label: "Bósnio", emoji: "🇧🇦", region: "Europa" },
    { id: "mt", label: "Maltês", emoji: "🇲🇹", region: "Europa" },
    { id: "lb", label: "Luxemburguês", emoji: "🇱🇺", region: "Europa" },

    { id: "th", label: "Tailandês", emoji: "🇹🇭", region: "Ásia" },
    { id: "vi", label: "Vietnamita", emoji: "🇻🇳", region: "Ásia" },
    { id: "id", label: "Indonésio", emoji: "🇮🇩", region: "Ásia" },
    { id: "ms", label: "Malaio", emoji: "🇲🇾", region: "Ásia" },
    { id: "tl", label: "Filipino", emoji: "🇵🇭", region: "Ásia" },
    { id: "he", label: "Hebraico", emoji: "🇮🇱", region: "Ásia" },
    { id: "fa", label: "Persa", emoji: "🇮🇷", region: "Ásia" },
    { id: "bn", label: "Bengali", emoji: "🇧🇩", region: "Ásia" },
    { id: "ta", label: "Tâmil", emoji: "🇱🇰", region: "Ásia" },
    { id: "ur", label: "Urdu", emoji: "🇵🇰", region: "Ásia" },
    { id: "pa", label: "Punjabi", emoji: "🇮🇳", region: "Ásia" },
    { id: "ml", label: "Malaiala", emoji: "🇮🇳", region: "Ásia" },
    { id: "te", label: "Télugo", emoji: "🇮🇳", region: "Ásia" },
    { id: "mr", label: "Marathi", emoji: "🇮🇳", region: "Ásia" },
    { id: "my", label: "Birmanês", emoji: "🇲🇲", region: "Ásia" },
    { id: "km", label: "Khmer", emoji: "🇰🇭", region: "Ásia" },
    { id: "lo", label: "Laosiano", emoji: "🇱🇦", region: "Ásia" },
    { id: "mn", label: "Mongol", emoji: "🇲🇳", region: "Ásia" },
    { id: "kk", label: "Cazaque", emoji: "🇰🇿", region: "Ásia" },
    { id: "uz", label: "Uzbeque", emoji: "🇺🇿", region: "Ásia" },
    { id: "az", label: "Azerbaijano", emoji: "🇦🇿", region: "Ásia" },
    { id: "ka", label: "Georgiano", emoji: "🇬🇪", region: "Ásia" },
    { id: "hy", label: "Armênio", emoji: "🇦🇲", region: "Ásia" },

    { id: "sw", label: "Suaíli", emoji: "🇰🇪", region: "África" },
    { id: "am", label: "Amárico", emoji: "🇪🇹", region: "África" },
    { id: "af", label: "Africâner", emoji: "🇿🇦", region: "África" },
    { id: "yo", label: "Iorubá", emoji: "🇳🇬", region: "África" },
    { id: "zu", label: "Zulu", emoji: "🇿🇦", region: "África" },
    { id: "ha", label: "Hauçá", emoji: "🇳🇬", region: "África" },
    { id: "ig", label: "Igbo", emoji: "🇳🇬", region: "África" },
    { id: "so", label: "Somali", emoji: "🇸🇴", region: "África" },
    { id: "xh", label: "Xhosa", emoji: "🇿🇦", region: "África" },

    { id: "mi", label: "Maori", emoji: "🇳🇿", region: "Oceania" },
    { id: "sm", label: "Samoano", emoji: "🇼🇸", region: "Oceania" },
    { id: "fj", label: "Fijiano", emoji: "🇫🇯", region: "Oceania" },

    { id: "eo", label: "Esperanto", emoji: "🌐", region: "Outros" },
    { id: "la", label: "Latim", emoji: "🏛️", region: "Outros" },
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

export function isLanguageLevelId(value: string): value is LanguageLevelId {
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
            level && isLanguageLevelId(level) ? level : DEFAULT_LANGUAGE_LEVEL;
    }
    return normalized;
}

export function calculateAge(birthdate: Date | string): number | null {
    const date = birthdate instanceof Date ? birthdate : new Date(birthdate);
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
