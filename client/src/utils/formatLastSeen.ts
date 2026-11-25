import i18n from "../i18n";
import { formatFullDate } from "../i18n/formatters";

interface FormatLastSeenOptions {
    short?: boolean;
    dateLabel?: (date: string) => string;
}

export function formatLastSeen(
    lastSeen: string | null,
    { short = false, dateLabel }: FormatLastSeenOptions = {},
): string {
    if (!lastSeen) return i18n.t("profile:lastSeen.unknown");

    const diffMs = Date.now() - new Date(lastSeen).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (short) {
        if (diffSec < 60) return i18n.t("profile:lastSeenShort.now");
        if (diffMin < 60)
            return i18n.t("profile:lastSeenShort.minutes", { count: diffMin });
        if (diffHour < 24)
            return i18n.t("profile:lastSeenShort.hours", { count: diffHour });
        if (diffDay === 1) return i18n.t("profile:lastSeenShort.yesterday");
        return formatFullDate(lastSeen);
    }

    if (diffSec < 60) return i18n.t("profile:lastSeen.now");
    if (diffMin < 60)
        return i18n.t("profile:lastSeen.minutes", { count: diffMin });
    if (diffHour < 24)
        return i18n.t("profile:lastSeen.hours", { count: diffHour });
    if (diffDay === 1) return i18n.t("profile:lastSeen.yesterday");

    return dateLabel ? dateLabel(lastSeen) : formatFullDate(lastSeen);
}
