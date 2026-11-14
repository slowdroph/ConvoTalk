import { useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import type { PostStats, User } from "../../../types";
import Avatar from "../../../components/ui/Avatar";
import CountryFlag from "../../../components/ui/CountryFlag";
import { getCountryName } from "../../../utils/countries";

interface FeedProfileCardProps {
    user: User;
    online: boolean;
    stats: PostStats | null;
    statsLoading?: boolean;
}

export default function FeedProfileCard({
    user,
    online,
    stats,
    statsLoading = false,
}: FeedProfileCardProps) {
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopyId = async () => {
        if (!user.publicId) return;

        try {
            await navigator.clipboard.writeText(`#${user.publicId}`);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
            showToast({ type: "success", message: "ID copiado." });
        } catch {
            showToast({
                type: "error",
                message: "Não foi possível copiar o ID.",
            });
        }
    };

    return (
        <section
            aria-label="Seu perfil"
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-noir-border dark:bg-noir-surface"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-600/10 blur-2xl"
            />

            <div className="relative mb-3 inline-block">
                <Avatar
                    src={user.avatar}
                    name={user.name}
                    size="lg"
                    className="ring-4 ring-slate-100 dark:ring-noir-surface-alt"
                />
                <span
                    aria-label={online ? "Online" : "Offline"}
                    className={`absolute bottom-0 right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-noir-surface ${
                        online ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                />
            </div>

            <h2 className="flex items-center justify-center gap-1.5 text-base font-bold text-slate-900 dark:text-noir-text-bright">
                <span className="truncate">{user.name}</span>
                {user.country && (
                    <CountryFlag
                        country={user.country}
                        name={getCountryName(user.country)}
                        className="h-3.5 w-5"
                    />
                )}
            </h2>

            {user.publicId && (
                <button
                    type="button"
                    onClick={handleCopyId}
                    title="Copiar ID único"
                    aria-label="Copiar ID"
                    className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-500 transition-colors hover:border-emerald-500/40 hover:text-emerald-600 dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-muted dark:hover:text-emerald-400"
                >
                    <span>#{user.publicId}</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    <span className="sr-only">
                        {copied ? "ID copiado" : "Copiar ID"}
                    </span>
                </button>
            )}

            <dl className="mt-5 grid w-full grid-cols-2 gap-2 border-t border-slate-200 pt-4 dark:border-noir-border">
                <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-2 dark:border-noir-border/60 dark:bg-noir-surface-alt/60">
                    <dd className="font-mono text-lg font-bold text-slate-900 dark:text-noir-text-bright">
                        {statsLoading ? "—" : (stats?.postCount ?? 0)}
                    </dd>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-noir-text-muted">
                        Publicações
                    </dt>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-2 dark:border-noir-border/60 dark:bg-noir-surface-alt/60">
                    <dd className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {statsLoading ? "—" : (stats?.totalLikes ?? 0)}
                    </dd>
                    <dt className="text-[11px] font-medium text-slate-500 dark:text-noir-text-muted">
                        Curtidas
                    </dt>
                </div>
            </dl>

            <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-emerald-700/30 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                <span
                    className={`h-2 w-2 rounded-full ${
                        online ? "animate-pulse bg-emerald-500" : "bg-slate-400"
                    }`}
                />
                Status: {online ? "Disponível" : "Offline"}
            </div>
        </section>
    );
}
