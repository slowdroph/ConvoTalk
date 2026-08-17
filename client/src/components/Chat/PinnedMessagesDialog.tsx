import { useEffect, useState } from "react";
import api from "../../services/api";
import type { Message } from "../../types";
import { getErrorMessage } from "../../utils/errors";

interface PinnedMessagesDialogProps {
    isOpen: boolean;
    roomId: string;
    onClose: () => void;
    onOpenThread: (message: Message) => void;
    onUnpin: (messageId: string) => void;
}

interface PinnedEntry {
    message: Message;
    pinnedBy: string;
    pinnedAt: string;
}

export default function PinnedMessagesDialog({
    isOpen,
    roomId,
    onClose,
    onOpenThread,
    onUnpin,
}: PinnedMessagesDialogProps) {
    const [pinned, setPinned] = useState<PinnedEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        api.get(`/rooms/${roomId}/pinned`)
            .then(({ data }) => {
                if (!cancelled) {
                    setPinned(data.pinnedMessages ?? []);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(getErrorMessage(err, "Erro ao carregar mensagens fixadas."));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [isOpen, roomId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                        Mensagens fixadas
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Fechar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <p className="text-sm text-red-400 text-center py-6">{error}</p>
                    ) : pinned.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center py-6">
                            Nenhuma mensagem fixada.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {pinned.map((entry) => (
                                <li
                                    key={entry.pinnedAt + entry.message._id}
                                    className="flex items-start gap-2 bg-zinc-800/60 border border-zinc-700 rounded-lg p-3"
                                >
                                    <button
                                        onClick={() => onOpenThread(entry.message)}
                                        className="flex-1 min-w-0 text-left"
                                        title="Abrir thread"
                                    >
                                        <p className="text-sm text-zinc-300 line-clamp-2 break-words">
                                            {entry.message.content ||
                                                (entry.message.attachments &&
                                                entry.message.attachments.length > 0
                                                    ? "📎 Anexo"
                                                    : "")}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {entry.message.sender?.name || "Desconhecido"} ·{" "}
                                            {new Date(entry.pinnedAt).toLocaleString("pt-BR")}
                                        </p>
                                    </button>
                                    <button
                                        onClick={() => onUnpin(entry.message._id)}
                                        className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0"
                                        title="Desafixar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3h12M9 3v4l-3 5a2 2 0 002 2h8a2 2 0 002-2l-3-5V3M9 21h6" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
