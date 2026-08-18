import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import MessageBubble from "./MessageBubble";
import api from "../../services/api";
import type { Message } from "../../types";

interface ThreadPanelProps {
    roomId: string;
    roomType: "group" | "direct";
    parent: Message;
    onClose: () => void;
    onReply: (message: Message) => void;
    onDeleteMessage: (messageId: string, forMe?: boolean) => void;
    onEditMessage: (messageId: string, content: string) => void;
    onToggleReaction: (messageId: string, emoji: string) => void;
    onTogglePin?: (message: Message) => void;
    isPinned?: (messageId: string) => boolean;
}

export default function ThreadPanel({
    roomId,
    roomType,
    parent,
    onClose,
    onReply,
    onDeleteMessage,
    onEditMessage,
    onToggleReaction,
    onTogglePin,
    isPinned,
}: ThreadPanelProps) {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [replies, setReplies] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await api.get(
                    `/messages/${roomId}/thread/${parent._id}`,
                );
                if (!cancelled) {
                    setReplies(data.replies ?? []);
                }
            } catch {
                if (!cancelled) {
                    setError("Erro ao carregar respostas.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [roomId, parent._id]);

    useEffect(() => {
        if (!socket) return;

        const handleThreadReply = (data: { parentId: string; message: Message }) => {
            if (data.parentId !== parent._id) return;
            setReplies((prev) => {
                if (prev.some((m) => m._id === data.message._id)) return prev;
                return [...prev, data.message];
            });
            requestAnimationFrame(() => {
                const el = containerRef.current;
                if (el) el.scrollTop = el.scrollHeight;
            });
        };

        socket.on("thread_reply", handleThreadReply);

        const handleMessageEdited = (data: {
            messageId: string;
            content: string;
            updatedAt?: string;
        }) => {
            if (data.messageId === parent._id) {
                onEditMessage(data.messageId, data.content);
            }
            setReplies((prev) =>
                prev.map((m) =>
                    m._id === data.messageId
                        ? {
                              ...m,
                              content: data.content,
                              edited: true,
                              updatedAt: data.updatedAt,
                          }
                        : m,
                ),
            );
        };

        const handleReactionUpdated = (data: {
            messageId: string;
            reactions: Record<string, string[]>;
        }) => {
            setReplies((prev) =>
                prev.map((m) =>
                    m._id === data.messageId
                        ? { ...m, reactions: data.reactions }
                        : m,
                ),
            );
        };

        const handleMessageDeleted = (messageId: string) => {
            setReplies((prev) =>
                prev.map((m) =>
                    m._id === messageId ? { ...m, deleted: true } : m,
                ),
            );
        };

        socket.on("message_edited", handleMessageEdited);
        socket.on("reaction_updated", handleReactionUpdated);
        socket.on("message_deleted", handleMessageDeleted);

        return () => {
            socket.off("thread_reply", handleThreadReply);
            socket.off("message_edited", handleMessageEdited);
            socket.off("reaction_updated", handleReactionUpdated);
            socket.off("message_deleted", handleMessageDeleted);
        };
    }, [socket, parent._id, onEditMessage]);

    useEffect(() => {
        const el = containerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [loading]);

    const handleDeleteInThread = (messageId: string, forMe = false) => {
        setReplies((prev) => prev.filter((m) => m._id !== messageId));
        if (forMe) {
            onDeleteMessage(messageId, true);
            return;
        }
        setReplies((prev) =>
            prev.map((m) =>
                m._id === messageId ? { ...m, deleted: true } : m,
            ),
        );
        onDeleteMessage(messageId, false);
    };

    return (
        <div className="fixed inset-0 z-40 w-full md:relative md:w-80 md:z-auto flex flex-col border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50 md:max-h-full dark:border-zinc-700 dark:bg-zinc-900/60">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0 dark:border-zinc-700 [padding-top:max(0.75rem,env(safe-area-inset-top))]">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Respostas
                </h3>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800"
                    title="Fechar respostas"
                    aria-label="Fechar respostas"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3"
            >
                <div className="mb-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
                    <MessageBubble
                        message={parent}
                        onDelete={onDeleteMessage}
                        onEdit={onEditMessage}
                        onToggleReaction={onToggleReaction}
                        onReply={onReply}
                        onTogglePin={onTogglePin}
                        isPinned={isPinned?.(parent._id) ?? false}
                        roomType={roomType}
                        currentUserId={user?._id ?? ""}
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin dark:border-green-500" />
                    </div>
                ) : error ? (
                    <p className="text-sm text-red-600 text-center py-6 dark:text-red-400">{error}</p>
                ) : replies.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6 dark:text-zinc-500">
                        Nenhuma resposta ainda. Seja o primeiro a responder!
                    </p>
                ) : (
                    replies.map((reply) => (
                        <MessageBubble
                            key={reply._id}
                            message={reply}
                            onDelete={handleDeleteInThread}
                            onEdit={onEditMessage}
                            onToggleReaction={onToggleReaction}
                            onReply={onReply}
                            onTogglePin={onTogglePin}
                            isPinned={isPinned?.(reply._id) ?? false}
                            roomType={roomType}
                            currentUserId={user?._id ?? ""}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
