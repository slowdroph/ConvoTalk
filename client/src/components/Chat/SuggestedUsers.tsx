import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSocket } from "../../hooks/useSocket";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import Avatar from "../ui/Avatar";

interface SuggestedUser {
    _id: string;
    name: string;
    publicId: string;
    avatar?: string;
    status?: string;
}

interface SuggestedUsersProps {
    onConversationCreated: (roomId: string) => void;
}

export default function SuggestedUsers({
    onConversationCreated,
}: SuggestedUsersProps) {
    const [users, setUsers] = useState<SuggestedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [creatingId, setCreatingId] = useState<string | null>(null);
    const { onlineUsers } = useSocket();

    const fetchSuggestions = useCallback(
        async (signal?: AbortSignal) => {
            setLoading(true);
            setError("");
            try {
                const { data } = await api.get("/users/suggestions", {
                    params: { limit: 5 },
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
            const { data } = await api.post("/rooms/direct", { userId });
            onConversationCreated(data._id);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao criar conversa"));
        } finally {
            setCreatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-sm mx-auto mt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-noir-text-muted">
                        Carregando sugestões...
                    </span>
                </div>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-noir-surface-alt/50 animate-pulse"
                        >
                            <div className="w-10 h-10 rounded-full bg-noir-border/50" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 w-24 rounded bg-noir-border/50" />
                                <div className="h-2.5 w-16 rounded bg-noir-border/30" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-sm mx-auto mt-6 text-center">
                <p className="text-red-400 text-sm mb-2">{error}</p>
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
        <div className="w-full max-w-sm mx-auto mt-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-noir-text-muted">
                    Sugestões
                </h4>
                <span className="text-[10px] font-mono text-emerald-400/80 lowercase">
                    {users.length} usuário{users.length === 1 ? "" : "s"}
                </span>
            </div>
            <div className="space-y-1.5">
                {users.map((user) => {
                    const online = isOnline(user._id);
                    const busy = creatingId === user._id;
                    return (
                        <button
                            key={user._id}
                            onClick={() => handleStartConversation(user._id)}
                            disabled={busy}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:bg-noir-surface-alt/70 hover:border-noir-border/60 transition group text-left"
                        >
                            <div className="relative flex-shrink-0">
                                <Avatar
                                    src={user.avatar}
                                    name={user.name}
                                    size="md"
                                />
                                <span
                                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-noir-base rounded-full ${
                                        online
                                            ? "bg-emerald-500"
                                            : "bg-zinc-500"
                                    }`}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-noir-text-bright truncate group-hover:text-emerald-300 transition">
                                        {user.name}
                                    </span>
                                    <span className="text-[10px] bg-noir-surface border border-noir-border/80 text-emerald-400 font-mono px-1.5 py-0.2 rounded shrink-0">
                                        #{user.publicId}
                                    </span>
                                </div>
                                <p className="text-xs text-noir-text-muted truncate mt-0.5 font-mono">
                                    #{user.publicId}
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                {busy ? (
                                    <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <span className="text-xs text-noir-text-muted group-hover:text-emerald-400 p-1.5 rounded-lg hover:bg-noir-surface transition flex items-center gap-1">
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.8}
                                            />
                                        </svg>
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
