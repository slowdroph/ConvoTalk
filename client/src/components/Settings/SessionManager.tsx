import { useState } from "react";
import { useSessions } from "../../hooks/useSessions";
import { useToast } from "../../contexts/ToastContext";
import { formatTimeAgo } from "../../utils/format";

function getDeviceIcon(deviceType: string): string {
    switch (deviceType) {
        case "mobile":
            return "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z";
        case "desktop":
            return "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z";
        default:
            return "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9";
    }
}

export default function SessionManager() {
    const { sessions, loading, error, removeSession, removeAllOtherSessions } =
        useSessions();
    const { showToast } = useToast();
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [removingAll, setRemovingAll] = useState(false);

    const handleRemoveSession = async (sessionId: string) => {
        try {
            setRemovingId(sessionId);
            await removeSession(sessionId);
            showToast({
                type: "success",
                message: "Sessão encerrada com sucesso.",
            });
        } catch {
            showToast({
                type: "error",
                message: "Erro ao encerrar sessão.",
            });
        } finally {
            setRemovingId(null);
        }
    };

    const handleRemoveAll = async () => {
        try {
            setRemovingAll(true);
            await removeAllOtherSessions();
            showToast({
                type: "success",
                message: "Todas as outras sessões foram encerradas.",
            });
        } catch {
            showToast({
                type: "error",
                message: "Erro ao encerrar outras sessões.",
            });
        } finally {
            setRemovingAll(false);
        }
    };

    const otherSessions = sessions.filter((s) => !s.current);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Sessões Ativas
                </h3>
                {otherSessions.length > 0 && (
                    <button
                        onClick={handleRemoveAll}
                        disabled={removingAll}
                        aria-label="Encerrar todas as outras sessões"
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors cursor-pointer dark:text-red-400 dark:hover:text-red-300"
                    >
                        {removingAll
                            ? "Encerrando..."
                            : "Encerrar todas outras"}
                    </button>
                )}
            </div>

            <p className="text-sm text-slate-500 dark:text-zinc-400">
                Gerencie os dispositivos conectados à sua conta.
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm dark:bg-red-500/10 dark:border-red-500/50 dark:text-red-400">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="animate-pulse flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-zinc-800"
                        >
                            <div className="w-10 h-10 bg-slate-200 rounded-lg dark:bg-zinc-700" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-1/3 dark:bg-zinc-700" />
                                <div className="h-3 bg-slate-200 rounded w-1/2 dark:bg-zinc-700" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <div
                            key={session._id}
                            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                                session.current
                                    ? "bg-emerald-50 border-emerald-200 dark:bg-green-500/10 dark:border-green-500/30"
                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-750"
                            }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    session.current
                                        ? "bg-emerald-100 dark:bg-green-500/20"
                                        : "bg-slate-100 dark:bg-zinc-700"
                                }`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`w-5 h-5 ${
                                        session.current
                                            ? "text-emerald-600 dark:text-green-400"
                                            : "text-slate-500 dark:text-zinc-400"
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d={getDeviceIcon(session.deviceType)}
                                    />
                                </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p
                                        className={`text-sm font-medium truncate ${
                                            session.current
                                                ? "text-emerald-700 dark:text-green-300"
                                                : "text-slate-900 dark:text-white"
                                        }`}
                                    >
                                        {session.deviceLabel || "Dispositivo desconhecido"}
                                    </p>
                                    {session.current && (
                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full dark:bg-green-500/20 dark:text-green-400">
                                            Atual
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                                        {session.ip || "IP desconhecido"}
                                    </p>
                                    <span className="text-slate-300 dark:text-zinc-600">
                                        ·
                                    </span>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                                        {formatTimeAgo(session.lastActiveAt)}
                                    </p>
                                </div>
                            </div>

                            {!session.current && (
                                <button
                                    onClick={() => handleRemoveSession(session._id)}
                                    disabled={removingId === session._id}
                                    aria-label={`Encerrar sessão ${session.deviceLabel}`}
                                    className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors cursor-pointer dark:text-red-400 dark:hover:text-red-300"
                                >
                                    {removingId === session._id
                                        ? "Encerrando..."
                                        : "Encerrar"}
                                </button>
                            )}
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <p className="text-center text-slate-500 py-4 dark:text-zinc-400">
                            Nenhuma sessão ativa.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
