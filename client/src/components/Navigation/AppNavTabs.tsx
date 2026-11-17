import { Link, useLocation } from "react-router-dom";

const TABS = [
    {
        to: "/chat",
        label: "Chat",
        icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    },
    {
        to: "/feed",
        label: "Feed",
        icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM7 8h10M7 12h10M7 16h6",
    },
    {
        to: "/profile",
        label: "Perfil",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
] as const;

interface AppNavTabsProps {
    className?: string;
    onNavigate?: () => void;
    variant?: "default" | "pill";
}

export default function AppNavTabs({
    className = "",
    onNavigate,
    variant = "default",
}: AppNavTabsProps) {
    const { pathname } = useLocation();
    const isPill = variant === "pill";

    return (
        <nav
            aria-label="Navegação principal"
            className={
                isPill
                    ? `flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 shadow-inner dark:border-noir-border dark:bg-noir-surface-alt/90 ${className}`
                    : `grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-noir-border dark:bg-noir-surface-alt ${className}`
            }
        >
            {TABS.map((tab) => {
                const active = pathname.startsWith(tab.to);
                return (
                    <Link
                        key={tab.to}
                        to={tab.to}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={
                            isPill
                                ? `flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                                      active
                                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                          : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-noir-text-muted dark:hover:bg-white/5 dark:hover:text-noir-text-bright"
                                  }`
                                : `flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                      active
                                          ? "bg-emerald-600 text-white shadow-sm dark:border dark:border-emerald-500/40 dark:bg-emerald-600/20 dark:text-emerald-300"
                                          : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-noir-text-muted dark:hover:bg-noir-border/60 dark:hover:text-noir-text-bright"
                                  }`
                        }
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d={tab.icon}
                            />
                        </svg>
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
