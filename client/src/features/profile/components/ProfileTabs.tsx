import { useRef } from "react";

export type ProfileTab = "about" | "publications" | "gallery";

interface ProfileTabsProps {
    active: ProfileTab;
    onChange: (tab: ProfileTab) => void;
    postCount: number;
    authoredCount: number;
    photoCount: number;
    loading?: boolean;
}

const TABS: Array<{ id: ProfileTab; label: string; icon: string }> = [
    {
        id: "about",
        label: "Sobre & Interesses",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
        id: "publications",
        label: "Publicações",
        icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM7 8h10M7 12h10M7 16h6",
    },
    {
        id: "gallery",
        label: "Galeria de Fotos",
        icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
];

export default function ProfileTabs({
    active,
    onChange,
    postCount,
    authoredCount,
    photoCount,
    loading = false,
}: ProfileTabsProps) {
    const tabRefs = useRef<Record<ProfileTab, HTMLButtonElement | null>>({
        about: null,
        publications: null,
        gallery: null,
    });

    const counts: Record<ProfileTab, number | null> = {
        about: postCount,
        publications: authoredCount,
        gallery: photoCount,
    };

    const focusTab = (index: number) => {
        const next = TABS[(index + TABS.length) % TABS.length];
        tabRefs.current[next.id]?.focus();
        onChange(next.id);
    };

    return (
        <div
            role="tablist"
            aria-label="Seções do perfil"
            className="flex items-stretch gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm custom-scrollbar dark:border-noir-border dark:bg-noir-surface"
        >
            {TABS.map((tab, index) => {
                const selected = tab.id === active;
                const count = counts[tab.id];
                return (
                    <button
                        key={tab.id}
                        ref={(node) => {
                            tabRefs.current[tab.id] = node;
                        }}
                        type="button"
                        role="tab"
                        id={`profile-tab-${tab.id}`}
                        aria-selected={selected}
                        aria-controls="profile-tabpanel"
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onChange(tab.id)}
                        onKeyDown={(event) => {
                            if (event.key === "ArrowRight") {
                                event.preventDefault();
                                focusTab(index + 1);
                            } else if (event.key === "ArrowLeft") {
                                event.preventDefault();
                                focusTab(index - 1);
                            } else if (event.key === "Home") {
                                event.preventDefault();
                                focusTab(0);
                            } else if (event.key === "End") {
                                event.preventDefault();
                                focusTab(TABS.length - 1);
                            }
                        }}
                        className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                            selected
                                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-noir-text-muted dark:hover:bg-noir-surface-alt dark:hover:text-noir-text-bright"
                        }`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d={tab.icon}
                            />
                        </svg>
                        <span>{tab.label}</span>
                        <span
                            className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                                selected
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-100 text-slate-500 dark:bg-noir-surface-alt dark:text-noir-text-muted"
                            }`}
                        >
                            {loading ? "—" : count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
