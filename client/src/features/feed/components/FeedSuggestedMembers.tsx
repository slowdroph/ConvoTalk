import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSocket } from "../../../hooks/useSocket";
import { useToast } from "../../../contexts/ToastContext";
import { getErrorMessage } from "../../../utils/errors";
import { countryName } from "../../../i18n/catalogs";
import { createDirectRoom } from "../../../services/rooms";
import api from "../../../services/api";
import Avatar from "../../../components/ui/Avatar";
import CountryFlag from "../../../components/ui/CountryFlag";
import type { PublicUser } from "../../../types";

const SUGGESTIONS_LIMIT = 4;

interface FeedSuggestedMembersProps {
    onOpenProfile: (user: PublicUser) => void;
    onConversationCreated: (roomId: string) => void;
}

export default function FeedSuggestedMembers({
    onOpenProfile,
    onConversationCreated,
}: FeedSuggestedMembersProps) {
    const { t } = useTranslation("feed");
    const { onlineUsers } = useSocket();
    const { showToast } = useToast();
    const [users, setUsers] = useState<PublicUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startingId, setStartingId] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const load = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);

        try {
            const { data } = await api.get<PublicUser[]>("/users/suggestions", {
                params: { limit: SUGGESTIONS_LIMIT },
            });
            if (requestId !== requestIdRef.current) return;
            setUsers(data);
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setError(
                getErrorMessage(err, t("suggested.loadError")),
            );
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [t]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    const onlineIds = new Set(onlineUsers.map((user) => user.userId));
    const onlineCount = users.filter((user) =>
        onlineIds.has(user._id),
    ).length;

    const handleStartConversation = async (userId: string) => {
        if (startingId) return;
        setStartingId(userId);

        try {
            const room = await createDirectRoom(userId);
            onConversationCreated(room._id);
        } catch (err) {
            showToast({
                type: "error",
                message: getErrorMessage(err, t("suggested.startError")),
            });
        } finally {
            setStartingId(null);
        }
    };

    return (
        <section
            aria-label={t("suggested.aria")}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-noir-border dark:bg-noir-surface sm:p-5"
        >
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-noir-text-bright">
                    {t("suggested.title")}
                </h2>
                <span className="font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {t("suggested.onlineCount", { count: onlineCount })}
                </span>
            </div>

            {loading && users.length === 0 && (
                <div className="space-y-3">
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className="flex animate-pulse items-center gap-2.5"
                        >
                            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-noir-surface-alt" />
                            <div className="flex-1 space-y-2">
                                <div className="h-2.5 w-24 rounded bg-slate-200 dark:bg-noir-surface-alt" />
                                <div className="h-2 w-16 rounded bg-slate-100 dark:bg-noir-surface-alt/70" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && error && (
                <div className="text-center">
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={() => void load()}
                        className="mt-2 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        {t("suggested.retry")}
                    </button>
                </div>
            )}

            {!loading && !error && users.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-noir-text-muted">
                    {t("suggested.empty")}
                </p>
            )}

            {users.length > 0 && (
                <ul className="flex flex-col divide-y divide-slate-100 dark:divide-noir-border/50">
                    {users.map((member) => {
                        const online = onlineIds.has(member._id);
                        return (
                            <li
                                key={member._id}
                                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 transition-colors hover:bg-slate-50 dark:hover:bg-noir-surface-alt/40"
                            >
                                <button
                                    type="button"
                                    onClick={() => onOpenProfile(member)}
                                    aria-label={t("suggested.openProfileOf", {
                                        name: member.name,
                                    })}
                                    className="flex min-w-0 items-center gap-2.5 text-left"
                                >
                                    <span className="relative shrink-0">
                                        <Avatar
                                            src={member.avatar}
                                            name={member.name}
                                            size="sm"
                                        />
                                        <span
                                            aria-hidden="true"
                                            className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white dark:border-noir-surface ${
                                                online
                                                    ? "bg-emerald-500"
                                                    : "bg-slate-400"
                                            }`}
                                        />
                                    </span>
                                    <span className="flex min-w-0 flex-col">
                                        <span className="flex items-center gap-1 truncate text-xs font-semibold text-slate-800 dark:text-noir-text-bright">
                                            <span className="truncate">
                                                {member.name}
                                            </span>
                                            {member.country && (
                                                <CountryFlag
                                                    country={member.country}
                                                    name={countryName(
                                                        member.country,
                                                    )}
                                                    className="h-2.5 w-4"
                                                />
                                            )}
                                        </span>
                                        <span className="truncate font-mono text-[10px] text-slate-500 dark:text-noir-text-muted">
                                            {member.publicId
                                                ? `#${member.publicId}`
                                                : online
                                                  ? t("suggested.available")
                                                  : t("suggested.offline")}
                                        </span>
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleStartConversation(member._id)
                                    }
                                    disabled={startingId === member._id}
                                    aria-label={t("suggested.chatWith", {
                                        name: member.name,
                                    })}
                                    title={t("suggested.chat")}
                                    className="shrink-0 rounded-lg border border-emerald-700/30 bg-emerald-50 p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
                                >
                                    {startingId === member._id ? (
                                        <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
