import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSocket } from "../../hooks/useSocket";
import api from "../../services/api";
import { createDirectRoom } from "../../services/rooms";
import { getErrorMessage } from "../../utils/errors";
import { getCountryName } from "../../utils/countries";
import Avatar from "../ui/Avatar";
import CountryFlag from "../ui/CountryFlag";
import UserProfileModal from "../ui/UserProfileModal";
import type { PublicUser } from "../../types";

const SUGGESTIONS_LIMIT = 8;

const GRID_CLASS =
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3";

const chatIconPath =
    "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z";

const userIconPath =
    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z";

interface SuggestedUsersProps {
    onConversationCreated: (roomId: string) => void;
}

interface SuggestedUserCardProps {
    user: PublicUser;
    online: boolean;
    busy: boolean;
    onStart: () => void;
    onViewProfile: () => void;
}

function SuggestedUserCard({
    user,
    online,
    busy,
    onStart,
    onViewProfile,
}: SuggestedUserCardProps) {
    const statusText = user.status || (online ? "Online" : "Offline");

    return (
        <li className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-noir-card border border-noir-border hover:border-emerald-500/40 transition">
            <div className="relative">
                <Avatar src={user.avatar} name={user.name} size="lg" />
                <span
                    aria-hidden="true"
                    className={`absolute bottom-1 right-1 w-3.5 h-3.5 border-2 border-noir-card rounded-full ${
                        online ? "bg-emerald-500" : "bg-zinc-500"
                    }`}
                />
            </div>
            <div className="min-w-0 w-full text-center">
                <p className="font-medium text-sm text-noir-text-bright truncate">
                    {user.name}
                </p>
                <p className="text-[11px] text-noir-text-muted font-mono truncate mt-0.5">
                    #{user.publicId}
                </p>
                <p
                    className={`mt-1 flex items-center justify-center gap-1.5 text-xs min-w-0 ${
                        !user.status && online
                            ? "text-emerald-400"
                            : "text-noir-text-muted"
                    }`}
                >
                    {user.country && (
                        <CountryFlag
                            country={user.country}
                            name={getCountryName(user.country)}
                            className="w-4 h-3"
                        />
                    )}
                    <span className="truncate">{statusText}</span>
                </p>
            </div>
            <div className="flex items-center gap-2 w-full">
                <button
                    type="button"
                    onClick={onStart}
                    disabled={busy}
                    aria-busy={busy}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-emerald-300 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {busy ? (
                        <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d={chatIconPath}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                            />
                        </svg>
                    )}
                    Conversar
                </button>
                <button
                    type="button"
                    onClick={onViewProfile}
                    title="Ver perfil"
                    aria-label={`Ver perfil de ${user.name}`}
                    className="p-2 rounded-xl text-noir-text-muted border border-noir-border hover:text-emerald-400 hover:bg-noir-surface-alt hover:border-emerald-500/40 transition"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d={userIconPath}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                        />
                    </svg>
                </button>
            </div>
        </li>
    );
}

export default function SuggestedUsers({
    onConversationCreated,
}: SuggestedUsersProps) {
    const [users, setUsers] = useState<PublicUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [creatingId, setCreatingId] = useState<string | null>(null);
    const [profileUserId, setProfileUserId] = useState<string | null>(null);
    const { onlineUsers } = useSocket();

    const fetchSuggestions = useCallback(
        async (signal?: AbortSignal) => {
            setLoading(true);
            setError("");
            try {
                const { data } = await api.get("/users/suggestions", {
                    params: { limit: SUGGESTIONS_LIMIT },
                    signal,
                });
                const list = Array.isArray(data) ? data : (data?.data ?? []);
                setUsers(list);
            } catch (err: unknown) {
                if (axios.isCancel(err)) return;
                if (err instanceof Error && err.name === "AbortError") return;
                setError(getErrorMessage(err, "Erro ao carregar sugestões"));
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        const controller = new AbortController();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSuggestions(controller.signal);
        return () => controller.abort();
    }, [fetchSuggestions]);

    const isOnline = (userId: string) =>
        onlineUsers.some((u) => u.userId === userId);

    const handleStartConversation = async (userId: string) => {
        if (creatingId) return;
        setCreatingId(userId);
        setError("");
        try {
            const room = await createDirectRoom(userId);
            onConversationCreated(room._id);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao criar conversa"));
        } finally {
            setCreatingId(null);
        }
    };

    if (loading) {
        return (
            <div
                className="w-full max-w-5xl mx-auto"
                role="status"
                aria-live="polite"
                aria-label="Carregando sugestões"
            >
                <div className={GRID_CLASS}>
                    {Array.from({ length: SUGGESTIONS_LIMIT }).map((_, i) => (
                        <div
                            key={i}
                            aria-hidden="true"
                            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-noir-card border border-noir-border animate-pulse"
                        >
                            <div className="w-20 h-20 rounded-full bg-noir-border/50" />
                            <div className="h-3 w-24 rounded bg-noir-border/50" />
                            <div className="h-2.5 w-16 rounded bg-noir-border/30" />
                            <div className="h-8 w-full rounded-xl bg-noir-border/40" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-5xl mx-auto text-center">
                <p role="alert" className="text-red-400 text-sm mb-2">
                    {error}
                </p>
                <button
                    onClick={() => {
                        const controller = new AbortController();
                        fetchSuggestions(controller.signal);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    if (users.length === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-noir-text-muted">
                    Sugestões
                </h4>
                <span className="text-[10px] font-mono text-emerald-400/80 lowercase">
                    {users.length} usuário{users.length === 1 ? "" : "s"}
                </span>
            </div>
            <ul className={GRID_CLASS}>
                {users.map((user) => (
                    <SuggestedUserCard
                        key={user._id}
                        user={user}
                        online={isOnline(user._id)}
                        busy={creatingId === user._id}
                        onStart={() => handleStartConversation(user._id)}
                        onViewProfile={() => setProfileUserId(user._id)}
                    />
                ))}
            </ul>

            <UserProfileModal
                isOpen={profileUserId !== null}
                userId={profileUserId}
                onClose={() => setProfileUserId(null)}
                onConversationCreated={(roomId) => {
                    setProfileUserId(null);
                    onConversationCreated(roomId);
                }}
                initialUser={users.find((u) => u._id === profileUserId)}
            />
        </div>
    );
}
