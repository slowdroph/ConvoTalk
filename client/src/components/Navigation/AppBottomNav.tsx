import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRooms } from "../../hooks/useRooms";
import {
    MOBILE_NAV_ITEMS,
    isNavItemActive,
    type NavItem,
} from "./navigation";

const HEIGHT_CLASS = "h-[calc(4rem+env(safe-area-inset-bottom))]";

function BottomLink({ item, badge }: { item: NavItem; badge?: number }) {
    const { pathname } = useLocation();
    const { t } = useTranslation("common");
    const active = isNavItemActive(pathname, item.to);

    return (
        <Link
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                active
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-slate-500 dark:text-noir-text-muted"
            }`}
        >
            {active && (
                <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-600 dark:bg-emerald-400"
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

export default function AppBottomNav() {
    const { t } = useTranslation("common");
    const { totalUnread } = useRooms();

    return (
        <nav
            aria-label={t("nav.main")}
            className={`fixed inset-x-0 bottom-0 z-40 flex ${HEIGHT_CLASS} items-stretch border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden dark:border-noir-border dark:bg-noir-surface/95`}
        >
            {MOBILE_NAV_ITEMS.map((item) => (
                <BottomLink
                    key={item.to}
                    item={item}
                    badge={item.badge === "unread" ? totalUnread : undefined}
                />
            ))}
        </nav>
    );
}
