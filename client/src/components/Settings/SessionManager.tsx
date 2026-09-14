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
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-noir-border gap-2">
                <div>
                    <h2 className="text-base font-semibold text-noir-text-bright">
                        Sessões Ativas
                    </h2>
                    <p className="text-xs text-noir-text-muted mt-0.5">
                        Gerencie os dispositivos conectados à sua conta ConvoTalk.
                    </p>
                </div>
                {otherSessions.length > 0 && (
                    <button
                        onClick={handleRemoveAll}
                        disabled={removingAll}
                        aria-label="Encerrar todas as outras sessões"
                        className="text-xs text-red-400 hover:text-red-300 font-medium hover:underline self-start sm:self-auto cursor-pointer disabled:opacity-50"
                    >
                        {removingAll
                            ? "Encerrando..."
                            : "Encerrar todas outras"}
                    </button>
                )}
            </div>

            {error && (
                <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="animate-pulse flex items-center gap-4 p-4 rounded-xl border border-noir-border bg-noir-surface-alt/50"
                        >
                            <div className="w-10 h-10 bg-noir-surface-alt rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 bg-noir-surface-alt rounded w-1/3" />
                                <div className="h-2.5 bg-noir-surface-alt rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session._id}
                            className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                session.current
                                    ? "border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 to-noir-surface-alt"
                                    : "border-noir-border bg-noir-surface-alt/50 hover:border-noir-border-light"
                            }`}
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        session.current
                                            ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                                            : "bg-noir-surface-alt/80 border border-noir-border-light text-noir-text-muted"
                                    }`}
                                >
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
                                            d={getDeviceIcon(session.deviceType)}
                                        />
                                    </svg>
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-noir-text-bright truncate">
                                            {session.deviceLabel || "Dispositivo"}
                                        </span>
                                        {session.current && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/25 text-emerald-400 border border-emerald-500/30">
                                                Atual
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-noir-text-muted font-mono mt-0.5">
                                        <span>{session.ip || "IP desconhecido"}</span>
                                        <span>•</span>
                                        <span className={session.current ? "text-emerald-400" : "text-noir-text-muted"}>
                                            {session.current ? "Agora mesmo" : formatTimeAgo(session.lastActiveAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {session.current ? (
                                <span className="hidden sm:inline-block text-xs text-noir-text-muted italic shrink-0">
                                    Dispositivo principal
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleRemoveSession(session._id)}
                                    disabled={removingId === session._id}
                                    aria-label={`Encerrar sessão ${session.deviceLabel}`}
                                    className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-950/20 border border-transparent hover:border-red-900/40 transition cursor-pointer disabled:opacity-50 shrink-0"
                                >
                                    {removingId === session._id
                                        ? "Encerrando..."
                                        : "Encerrar"}
                                </button>
                            )}
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <p className="text-center text-noir-text-muted py-6 text-xs">
                            Nenhuma sessão ativa encontrada.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
