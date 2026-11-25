import {
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    type LanguageCode,
} from "@shared/i18n";

/** The default locale is served unprefixed; every other locale gets a segment. */
const LOCALE_SEGMENTS: Record<LanguageCode, string> = {
    en: "",
    es: "es",
    "pt-BR": "pt-br",
    fr: "fr",
};

/** `/en` is accepted but redirected to the unprefixed URL. */
const ALIAS_SEGMENTS = new Set(["en"]);

const SEGMENT_LANGUAGE = new Map<string, LanguageCode>(
    SUPPORTED_LANGUAGES.filter((code) => LOCALE_SEGMENTS[code] !== "").map(
        (code) => [LOCALE_SEGMENTS[code], code],
    ),
);

/** Public pages that exist in every locale (locale-independent paths). */
export const PUBLIC_PATHS: readonly string[] = [
    "/",
    "/login",
    "/terms",
    "/privacy",
    "/forgot-password",
];

export function localeSegment(language: LanguageCode): string {
    return LOCALE_SEGMENTS[language];
}

function firstSegment(pathname: string): string | undefined {
    return pathname.split("/").filter(Boolean)[0]?.toLowerCase();
}

function isLocaleSegment(segment: string | undefined): boolean {
    return (
        segment !== undefined &&
        (SEGMENT_LANGUAGE.has(segment) || ALIAS_SEGMENTS.has(segment))
    );
}

/** Locale carried by the URL, or null when the path is not locale-prefixed. */
export function languageFromPath(pathname: string): LanguageCode | null {
    const segment = firstSegment(pathname);
    if (!isLocaleSegment(segment)) return null;
    return SEGMENT_LANGUAGE.get(segment as string) ?? DEFAULT_LANGUAGE;
}

/** Removes a locale prefix, returning the locale-independent path. */
export function stripLocale(pathname: string): string {
    if (!isLocaleSegment(firstSegment(pathname))) return pathname;
    const rest = pathname.split("/").filter(Boolean).slice(1).join("/");
    return rest ? `/${rest}` : "/";
}

/** Prefixes a locale-independent path (e.g. "/terms") for a language. */
export function localizePath(language: LanguageCode, path: string): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const segment = LOCALE_SEGMENTS[language];
    if (!segment) return normalized;
    return normalized === "/" ? `/${segment}` : `/${segment}${normalized}`;
}

/** True for the pages that are translated and prerendered per locale. */
export function isLocalizablePath(pathname: string): boolean {
    return PUBLIC_PATHS.includes(stripLocale(pathname));
}
