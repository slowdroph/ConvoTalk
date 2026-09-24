import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import { useToast } from "../../contexts/ToastContext";
import Avatar from "../ui/Avatar";

interface BlockedUser {
    _id: string;
    name: string;
    publicId: string;
    avatar?: string;
    status?: string;
}

export default function BlockedUsers() {
    const [users, setUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const load = useCallback(() => {
        api.get("/user/blocked")
            .then(({ data }) => {
                setUsers(data.blockedUsers ?? []);
                setError(null);
            })
            .catch((err) => {
                setError(
                    getErrorMessage(
                        err,
                        "Erro ao carregar usuários bloqueados.",
                    ),
                );
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleUnblock = async (id: string) => {
        try {
            await api.delete(`/user/${id}/block`);
            setUsers((prev) => prev.filter((u) => u._id !== id));
            showToast({ type: "info", message: "Usuário desbloqueado." });
        } catch (err) {
            showToast({
                type: "error",
                message: getErrorMessage(err, "Erro ao desbloquear usuário."),
            });
        }
    };

    return (
        <div className="space-y-5">
            <div className="border-b border-noir-border pb-4">
                <h2 className="text-base font-semibold text-noir-text-bright">
                    Usuários bloqueados
                </h2>
                <p className="text-xs text-noir-text-muted mt-0.5">
                    Usuários bloqueados não podem enviar mensagens a você nem
                    iniciar conversas.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div
                    role="alert"
                    className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
                >
                    <svg
                        className="w-4 h-4 shrink-0 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span>{error}</span>
                </div>
            ) : users.length === 0 ? (
                <div className="py-8 text-center rounded-xl border border-dashed border-noir-border bg-noir-surface-alt/30">
                    <div className="w-10 h-10 mx-auto rounded-full bg-noir-surface-alt/60 flex items-center justify-center text-noir-text-muted mb-2">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                    </div>
                    <p className="text-xs text-noir-text-muted">
                        Você não bloqueou nenhum usuário.
                    </p>
                </div>
            ) : (
                <ul className="space-y-2.5">
                    {users.map((user) => (
                        <li
                            key={user._id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-noir-border bg-noir-surface-alt/50 hover:border-noir-border-light transition"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar
                                    src={user.avatar}
                                    name={user.name}
                                    size="sm"
                                />
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-noir-text-bright truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-[11px] text-noir-text-muted font-mono truncate">
                                        #{user.publicId}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleUnblock(user._id)}
                                className="px-3 py-1.5 rounded-lg bg-noir-surface-alt hover:bg-noir-card text-xs font-medium text-noir-text-bright border border-noir-border-light transition cursor-pointer shrink-0"
                            >
                                Desbloquear
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
