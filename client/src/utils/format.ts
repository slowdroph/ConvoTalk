import i18n from "../i18n";
import {
    formatMonthYear,
    formatRelativeTime,
    formatShortDate,
    formatTime,
    formatWeekdayShort,
} from "../i18n/formatters";

export function formatTimeAgo(dateString: string): string {
    return formatRelativeTime(dateString);
}

export function formatDateTime(dateString: string): string {
    return formatTime(dateString);
}

export function formatMemberSince(dateString: string): string {
    return formatMonthYear(dateString);
}

export function formatSidebarTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
    );
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (date >= startOfToday) {
        return formatTime(date);
    }
    if (date >= startOfYesterday) {
        return i18n.t("time.yesterday");
    }

    const diffMs = startOfToday.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 7) {
        return formatWeekdayShort(date);
    }

    return formatShortDate(date);
}
