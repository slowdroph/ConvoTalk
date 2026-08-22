import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import { useToast } from "../../contexts/ToastContext";
import Avatar from "../ui/Avatar";

interface BlockedUser {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
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
        <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2 dark:text-white">
                Usuários bloqueados
            </h3>
            <p className="text-slate-500 text-sm mb-4 dark:text-zinc-400">
                Usuários bloqueados não podem enviar mensagens a você nem
                iniciar conversas.
            </p>

            {loading ? (
                <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin dark:border-green-500" />
                </div>
            ) : error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            ) : users.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-zinc-500">
                    Você não bloqueou nenhum usuário.
                </p>
            ) : (
                <ul className="space-y-2">
                    {users.map((user) => (
                        <li
                            key={user._id}
                            className="flex items-center gap-3 py-2"
                        >
                            <Avatar
                                src={user.avatar}
                                name={user.name}
                                size="sm"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-slate-900 text-sm font-medium truncate dark:text-white">
                                    {user.name}
                                </p>
                                <p className="text-slate-500 text-xs truncate dark:text-zinc-500">
                                    {user.email}
                                </p>
                            </div>
                            <button
                                onClick={() => handleUnblock(user._id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer dark:bg-zinc-800 dark:border-transparent dark:hover:bg-zinc-700 dark:text-zinc-200"
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
