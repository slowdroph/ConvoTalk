import {
    DEFAULT_LANGUAGE,
    isLanguageCode,
    normalizeLanguage,
    type LanguageCode,
} from "@shared/i18n";
import { LANGUAGE_STORAGE_KEY } from "./constants";
import { isLocalizablePath, languageFromPath } from "./routing";

// Matches the cached user entry written by AuthProvider.
const USER_STORAGE_KEY = "user";

const SUPPORTED_BASE_LANGUAGES = new Set(["en", "es", "pt", "fr"]);

function toSupportedLanguage(value?: string | null): LanguageCode | null {
    if (!value) return null;

    const cleaned = value.trim().replace(/_/g, "-");
    if (!cleaned) return null;
    if (isLanguageCode(cleaned)) return cleaned;

    const base = cleaned.split("-")[0]?.toLowerCase();
    if (!base || !SUPPORTED_BASE_LANGUAGES.has(base)) return null;

    return normalizeLanguage(cleaned);
}

export function currentPathname(): string {
    if (typeof window === "undefined") return "/";
    return window.location.pathname;
}

/** URL language for public localized pages, or null for private routes. */
export function resolvePublicLanguage(
    pathname: string,
): LanguageCode | null {
    if (!isLocalizablePath(pathname)) return null;
    return languageFromPath(pathname) ?? DEFAULT_LANGUAGE;
}

export function readPersistedLanguage(): LanguageCode | null {
    if (typeof window === "undefined") return null;

    try {
        return toSupportedLanguage(
            window.localStorage.getItem(LANGUAGE_STORAGE_KEY),
        );
    } catch {
        return null;
    }
}

export function persistLanguage(language: LanguageCode): void {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
        // Storage may be unavailable (private mode / quota).
    }
}

export function readBrowserLanguage(): LanguageCode | null {
    if (typeof navigator === "undefined") return null;

    const candidates = [navigator.language, ...(navigator.languages ?? [])];
    for (const candidate of candidates) {
        const supported = toSupportedLanguage(candidate);
        if (supported) return supported;
    }

    return null;
}

function readCachedAccountLanguage(): LanguageCode | null {
    if (typeof window === "undefined") return null;

    try {
        const stored = window.localStorage.getItem(USER_STORAGE_KEY);
        if (!stored) return null;

        const user = JSON.parse(stored) as {
            preferences?: { language?: unknown };
        } | null;
        const language = user?.preferences?.language;
        return typeof language === "string"
            ? toSupportedLanguage(language)
            : null;
    } catch {
        return null;
    }
}

/** Private routes: account preference, stored choice, browser, then default. */
export function resolvePrivateLanguage(
    accountLanguage?: string | null,
): LanguageCode {
    if (isLanguageCode(accountLanguage)) return accountLanguage;

    const stored = readPersistedLanguage();
    if (stored) return stored;

    return readBrowserLanguage() ?? DEFAULT_LANGUAGE;
}

/** Resolves the language before React renders, matching the URL where it owns it. */
export function resolveInitialLanguage(pathname: string): LanguageCode {
    return (
        resolvePublicLanguage(pathname) ??
        resolvePrivateLanguage(readCachedAccountLanguage())
    );
}
