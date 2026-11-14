import { APP_VERSION } from "../../../utils/version";

interface FeedStatusPillProps {
    connected: boolean;
}

export default function FeedStatusPill({ connected }: FeedStatusPillProps) {
    return (
        <aside
            aria-label="Status da conexão"
            className="fixed bottom-3 left-4 z-40 hidden items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 font-mono text-[11px] text-slate-500 shadow-sm backdrop-blur dark:border-noir-border dark:bg-noir-surface/90 dark:text-noir-text-muted sm:flex"
        >
            <span
                className={`h-2 w-2 rounded-full ${
                    connected
                        ? "animate-pulse bg-emerald-500"
                        : "bg-amber-500"
                }`}
            />
            <span>ConvoTalk Live</span>
            <span className="text-slate-300 dark:text-noir-border-light">|</span>
            <span>v{APP_VERSION}</span>
        </aside>
    );
}
