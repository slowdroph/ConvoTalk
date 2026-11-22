import i18n from "./index";
import {
    getLanguageOption,
    normalizeLanguage,
    type LanguageCode,
} from "@shared/i18n";

export function getCurrentLanguage(): LanguageCode {
    return normalizeLanguage(i18n.resolvedLanguage || i18n.language);
}

export function getLocale(language?: string): string {
    const current = language
        ? normalizeLanguage(language)
        : getCurrentLanguage();
    return getLanguageOption(current)?.locale ?? "pt-BR";
}

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
    return value instanceof Date ? value : new Date(value);
}

export function formatDate(
    value: DateInput,
    options: Intl.DateTimeFormatOptions = {},
): string {
    return new Intl.DateTimeFormat(getLocale(), options).format(toDate(value));
}

export function formatTime(
    value: DateInput,
    options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
    },
): string {
    return new Intl.DateTimeFormat(getLocale(), options).format(toDate(value));
}

export function formatDateTime(value: DateInput): string {
    return formatTime(value);
}

export function formatNumber(
    value: number | bigint,
    options: Intl.NumberFormatOptions = {},
): string {
    return new Intl.NumberFormat(getLocale(), options).format(value);
}

export function formatRelativeTime(value: DateInput, now = new Date()): string {
    const date = toDate(value);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return i18n.t("time.now");

    const relative = new Intl.RelativeTimeFormat(getLocale(), {
        numeric: "auto",
        style: "short",
    });

    if (diffMinutes < 60) return relative.format(-diffMinutes, "minute");

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return relative.format(-diffHours, "hour");

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return relative.format(-diffDays, "day");

    return formatDate(date);
}

export function formatWeekdayShort(value: DateInput): string {
    return formatDate(value, { weekday: "short" });
}

export function formatMonthYear(value: DateInput): string {
    return formatDate(value, { month: "long", year: "numeric" });
}

export function formatShortDate(value: DateInput): string {
    return formatDate(value, { day: "2-digit", month: "2-digit" });
}

export function formatFullDate(value: DateInput): string {
    return formatDate(value, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}
