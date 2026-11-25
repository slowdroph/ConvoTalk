import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useRooms } from "../../hooks/useRooms";
import {
    NAV_ITEMS,
    SETTINGS_ITEM,
    isNavItemActive,
    type NavItem,
} from "./navigation";

function RailLink({ item, badge }: { item: NavItem; badge?: number }) {
    const { pathname } = useLocation();
    const { t } = useTranslation("common");
    const active = isNavItemActive(pathname, item.to);

    return (
        <Link
            to={item.to}
            title={t(item.labelKey)}
            aria-current={active ? "page" : undefined}
            className={`relative flex w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-center transition-colors ${
                active
                    ? "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-noir-text-muted dark:hover:bg-noir-surface-alt dark:hover:text-noir-text-bright"
            }`}
        >
            {active && (
                <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-emerald-600 dark:bg-emerald-400"
                />
            )}
            <span className="relative">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d={item.icon}
                    />
                </svg>
                {badge ? (
                    <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-emerald-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                        {badge > 99 ? "99+" : badge}
                    </span>
                ) : null}
            </span>
            <span className="text-[10px] font-medium leading-none">
                {t(item.shortLabelKey ?? item.labelKey)}
            </span>
        </Link>
    );
}

export default function AppRail() {
    const { t } = useTranslation("common");
    const { logout } = useAuth();
    const { totalUnread } = useRooms();

    return (
        <nav
            aria-label={t("nav.main")}
            className="hidden w-[76px] shrink-0 flex-col items-center border-r border-slate-200 bg-white py-3 lg:flex dark:border-noir-border dark:bg-noir-surface"
        >
            <Link
                to="/chat"
                title="ConvoTalk"
                aria-label={t("nav.goToChat")}
                className="mb-3 rounded-xl p-1.5 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
                <img
                    src="/logo-192.webp" width={192} height={163}
                    alt="ConvoTalk"
                    className="h-8 w-8 object-contain"
                />
            </Link>

            <div className="flex w-full flex-1 flex-col items-center gap-1 px-2">
                {NAV_ITEMS.map((item) => (
                    <RailLink
                        key={item.to}
                        item={item}
                        badge={item.badge === "unread" ? totalUnread : undefined}
                    />
                ))}
            </div>

            <div className="flex w-full flex-col items-center gap-1 px-2">
                <RailLink item={SETTINGS_ITEM} />
                <button
                    type="button"
                    onClick={logout}
                    title={t("nav.logoutTitle")}
                    aria-label={t("nav.logoutTitle")}
                    className="flex w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-noir-text-muted dark:hover:bg-red-950/20 dark:hover:text-red-400"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>
                    <span className="text-[10px] font-medium leading-none">
                        {t("nav.logout")}
                    </span>
                </button>
            </div>
        </nav>
    );
}
