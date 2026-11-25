import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getInterestOption } from "@shared/interests";
import {
    countryName,
    interestLabel,
    spokenLanguageLabel,
} from "../../../i18n/catalogs";
import { formatFullDate } from "../../../i18n/formatters";
import { formatLastSeen } from "../../../utils/formatLastSeen";
import Avatar from "../../../components/ui/Avatar";
import CountryFlag from "../../../components/ui/CountryFlag";
import { FOCUS_RING } from "../utils";
import type { DiscoverUser } from "../../../types";

interface DiscoverUserCardProps {
    user: DiscoverUser;
    online: boolean;
    busy: boolean;
    starting: boolean;
    onStartConversation: (user: DiscoverUser) => void;
}

export default function DiscoverUserCard({
    user,
    online,
    busy,
    starting,
    onStartConversation,
}: DiscoverUserCardProps) {
    const { t } = useTranslation("discover");
    const interests = user.interests.slice(0, 3);
    const extraInterests = user.interests.length - interests.length;
    const languages = user.languages.slice(0, 3);
    const extraLanguages = user.languages.length - languages.length;
    const location = [user.city, user.country ? countryName(user.country) : ""]
        .filter(Boolean)
        .join(", ");

    const activityLabel = user.lastSeen
        ? formatLastSeen(user.lastSeen, {
              dateLabel: (date) =>
                  t("card.lastSeenDate", { date: formatFullDate(date) }),
          })
        : null;

    return (
        <article className="group relative flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-500/40 focus-within:border-emerald-500/40 dark:border-noir-border dark:bg-noir-surface">
            <Link
                to={`/profile/${user._id}`}
                aria-label={t("card.openProfile", { name: user.name })}
                className={`absolute inset-0 z-0 rounded-2xl ${FOCUS_RING}`}
            />

            <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                    <Avatar src={user.avatar} name={user.name} size="lg" />
                    {online && (
                        <span
                            role="status"
                            aria-label={t("card.online")}
                            className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-noir-surface"
                        />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="block max-w-full truncate text-sm font-semibold text-slate-900 group-hover:underline dark:text-noir-text-bright">
                        {user.name}
                    </p>
                    <p className="truncate font-mono text-[11px] text-slate-500 dark:text-noir-text-muted">
                        #{user.publicId}
                    </p>
                    {location && (
                        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-600 dark:text-noir-text-muted">
                            {user.country && (
                                <CountryFlag
                                    country={user.country}
                                    name={countryName(user.country)}
                                    className="h-3 w-4"
                                />
                            )}
                            <span className="truncate">{location}</span>
                        </p>
                    )}
                    <p
                        className={`mt-1 text-[11px] ${
                            online
                                ? "font-medium text-emerald-600 dark:text-emerald-400"
                                : "text-slate-500 dark:text-noir-text-muted"
                        }`}
                    >
                        {online ? t("card.online") : activityLabel}
                    </p>
                </div>
            </div>

            {user.bio && (
                <p className="line-clamp-2 text-xs text-slate-600 dark:text-noir-text-muted">
                    {user.bio}
                </p>
            )}

            {interests.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                    {interests.map((id) => (
                        <li
                            key={id}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 dark:border-noir-border dark:bg-noir-surface-alt/60 dark:text-noir-text-muted"
                        >
                            <span aria-hidden="true">
                                {getInterestOption(id)?.emoji}
                            </span>
                            {interestLabel(id)}
                        </li>
                    ))}
                    {extraInterests > 0 && (
                        <li className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 dark:border-noir-border dark:text-noir-text-muted">
                            +{extraInterests}
                        </li>
                    )}
                </ul>
            )}

            {languages.length > 0 && (
                <p className="text-[11px] text-slate-500 dark:text-noir-text-muted">
                    {languages
                        .map((code) => spokenLanguageLabel(code))
                        .join(" · ")}
                    {extraLanguages > 0 ? ` +${extraLanguages}` : ""}
                </p>
            )}

            <div className="mt-auto flex items-center gap-2 pt-1">
                <span
                    aria-hidden="true"
                    className="flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors group-hover:bg-slate-50 dark:border-noir-border dark:text-noir-text-bright dark:group-hover:bg-noir-surface-alt"
                >
                    {t("card.viewProfile")}
                </span>
                <button
                    type="button"
                    onClick={() => onStartConversation(user)}
                    disabled={busy}
                    aria-busy={starting}
                    className={`relative z-10 inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-700/30 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 ${FOCUS_RING}`}
                >
                    {starting && (
                        <span
                            aria-hidden="true"
                            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                        />
                    )}
                    {starting ? t("card.starting") : t("card.chat")}
                </button>
            </div>
        </article>
    );
}
