import { useState, useEffect } from "react";
import api from "../../services/api";
import { formatTimeAgo, formatDateTime } from "../../utils/format";

interface ReadDetail {
    userId: string;
    name: string;
    avatar: string;
    readAt: string;
    sessionId: string;
}

interface MessageReadDetailsProps {
    messageId: string;
    onClose: () => void;
}

export default function MessageReadDetails({
    messageId,
    onClose,
}: MessageReadDetailsProps) {
    const [readDetails, setReadDetails] = useState<ReadDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReadDetails = async () => {
            try {
                setLoading(true);
                const response = await api.get(
                    `/messages/${messageId}/read-details`,
                );
                setReadDetails(response.data.readDetails);
            } catch {
                setError("Erro ao carregar detalhes de leitura.");
            } finally {
                setLoading(false);
            }
        };

        fetchReadDetails();
    }, [messageId]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden dark:bg-zinc-900">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Quem leu esta mensagem
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Fechar detalhes de leitura"
                        className="text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="animate-pulse flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 bg-slate-200 rounded-full dark:bg-zinc-700" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-1/3 dark:bg-zinc-700" />
                                        <div className="h-3 bg-slate-200 rounded w-1/2 dark:bg-zinc-700" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-4">
                            <p className="text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        </div>
                    ) : readDetails.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-slate-500 dark:text-zinc-400">
                                Ninguém leu esta mensagem ainda.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {readDetails.map((detail) => (
                                <div
                                    key={`${detail.userId}-${detail.sessionId}`}
                                    className="flex items-center gap-3"
                                >
                                    {detail.avatar ? (
                                        <img
                                            src={detail.avatar}
                                            alt={detail.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center">
                                            <span className="text-slate-500 dark:text-zinc-400 font-medium">
                                                {detail.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {detail.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                                            {formatTimeAgo(detail.readAt)} às{" "}
                                            {formatDateTime(detail.readAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
