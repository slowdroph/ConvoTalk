import { useState, useRef, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Avatar from "../ui/Avatar";
import type { PreviewMessage } from "../../types";
import { SOCKET_URL } from "../../lib/apiUrl";

const MAX_LENGTH = 140;
const WARN_LENGTH = 120;
const NAME_STORAGE_KEY = "previewName";
const TYPING_TIMEOUT_MS = 2500;

function getGuestName(): string {
    const stored = localStorage.getItem(NAME_STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
    const generated = `Visitante-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(NAME_STORAGE_KEY, generated);
    return generated;
}

function formatTime(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
}

export default function PreviewChat() {
    const [messages, setMessages] = useState<PreviewMessage[]>([]);
    const [onlineCount, setOnlineCount] = useState(1);
    const [input, setInput] = useState("");
    const [name, setName] = useState<string>(() => getGuestName());
    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState(name);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState("");
    const [typingName, setTypingName] = useState<string | null>(null);
    const [mySocketId, setMySocketId] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const listRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef(name);

    useEffect(() => {
        nameRef.current = name;
    }, [name]);

    const scrollToBottom = useCallback(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, []);

    useEffect(() => {
        const socket = io(SOCKET_URL ? `${SOCKET_URL}/preview` : "/preview", {
            auth: { name: nameRef.current },
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setMySocketId(socket.id ?? null);
            setConnected(true);
            setError("");
        });

        socket.on("disconnect", () => {
            setConnected(false);
        });

        socket.on(
            "preview:history",
            (data: { messages: PreviewMessage[]; online: number }) => {
                setMessages(data.messages || []);
                setOnlineCount(data.online || 1);
            },
        );

        socket.on("preview:message", (msg: PreviewMessage) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                const next = [...prev, msg];
                return next.length > 50 ? next.slice(next.length - 50) : next;
            });
        });

        socket.on("preview:online", (count: number) => {
            setOnlineCount(count);
        });

        socket.on(
            "preview:typing",
            (data: { name: string; isTyping: boolean }) => {
                if (!data.isTyping) {
                    setTypingName((prev) => (prev === data.name ? null : prev));
                    return;
                }
                setTypingName(data.name || null);
                if (typingTimerRef.current) {
                    clearTimeout(typingTimerRef.current);
                }
                typingTimerRef.current = setTimeout(() => {
                    setTypingName(null);
                }, TYPING_TIMEOUT_MS);
            },
        );

        return () => {
            socket.disconnect();
            socketRef.current = null;
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            if (typingTimeoutRef.current)
                clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleTyping = () => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.emit("preview:typing", {
            name: nameRef.current,
            isTyping: true,
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("preview:typing", {
                name: nameRef.current,
                isTyping: false,
            });
        }, 2000);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const socket = socketRef.current;
        const trimmed = input.trim();
        if (!trimmed || !socket) return;

        if (trimmed.length > MAX_LENGTH) {
            setError(`Mensagem muito longa (máximo ${MAX_LENGTH} caracteres).`);
            return;
        }

        socket.emit(
            "preview:message",
            { content: trimmed },
            (response: { error?: string }) => {
                if (response?.error) {
                    setError(response.error);
                }
            },
        );
        setInput("");
        setError("");

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        socket.emit("preview:typing", {
            name: nameRef.current,
            isTyping: false,
        });
    };

    const saveName = () => {
        const trimmed = nameDraft.trim();
        const next = trimmed ? trimmed.slice(0, 30) : name;
        localStorage.setItem(NAME_STORAGE_KEY, next);
        setName(next);
        setEditingName(false);
    };

    const charCount = input.length;
    const isOverLimit = charCount > MAX_LENGTH;
    const isNearLimit = charCount > WARN_LENGTH && charCount <= MAX_LENGTH;
    const isMyMessage = (senderId: string) =>
        mySocketId !== null && senderId === mySocketId;

    return (
        <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-outline-variant/50 bg-surface-container-high/40 backdrop-blur-xl relative">
            <div className="bg-surface-container-lowest border-b border-outline-variant/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                            #
                        </span>
                    </div>
                    <div>
                        <span className="text-on-surface font-semibold text-sm block">
                            Preview
                        </span>
                        <span className="text-xs text-on-surface-variant">
                            Sala de demonstração
                        </span>
                    </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container-high border border-outline-variant rounded-full px-2.5 py-1">
                    <span
                        className={`w-2 h-2 rounded-full ${
                            connected ? "bg-primary animate-pulse" : "bg-error"
                        }`}
                    />
                    {onlineCount} online
                </span>
            </div>

            <div
                ref={listRef}
                className="p-6 bg-background/80 min-h-80 max-h-104 overflow-y-auto custom-scrollbar flex flex-col justify-end gap-6"
            >
                <div className="text-center text-xs text-on-surface-variant mb-2">
                    <p>
                        Você está em uma sala pública de demonstração, sem
                        cadastro.
                    </p>
                    <p>
                        {connected
                            ? "Conexão em tempo real ativa."
                            : "Conectando..."}
                    </p>
                </div>

                {messages.map((msg) => {
                    const mine = isMyMessage(msg.senderId);
                    return (
                        <div
                            key={msg.id}
                            className={`flex items-end gap-2 w-full ${
                                mine ? "justify-end" : "justify-start"
                            }`}
                        >
                            {!mine && <Avatar name={msg.name} size="sm" />}
                            <div
                                className={`px-4 py-2 rounded-t-lg max-w-[70%] font-geist text-sm relative ${
                                    mine
                                        ? "bg-primary-container/20 border border-primary/30 text-primary rounded-bl-lg"
                                        : "bg-surface-container-high border border-outline-variant text-on-surface rounded-br-lg"
                                }`}
                            >
                                {!mine && (
                                    <p className="text-[11px] font-semibold text-primary mb-0.5">
                                        {msg.name}
                                    </p>
                                )}
                                <p>{msg.content}</p>
                                <span
                                    className={`text-[10px] absolute -bottom-4 ${
                                        mine
                                            ? "text-primary/70 right-1"
                                            : "text-on-surface-variant left-1"
                                    }`}
                                >
                                    {formatTime(msg.createdAt)}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {typingName && (
                    <div className="flex items-end gap-2 w-full">
                        <Avatar name={typingName} size="sm" />
                        <div>
                            <p className="text-[11px] font-semibold text-primary mb-1 ml-1">
                                {typingName} está digitando
                            </p>
                            <div className="inline-flex items-center gap-1 bg-surface-container-high border border-outline-variant text-on-surface px-4 py-3 rounded-t-lg rounded-br-lg">
                                <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/50">
                {error && (
                    <div className="bg-error/10 border border-error/50 text-on-surface px-3 py-1.5 rounded-lg text-xs mb-2">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between mb-2">
                        <button
                            type="button"
                            onClick={() => {
                                setNameDraft(name);
                                setEditingName(true);
                            }}
                            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors"
                        >
                            <Avatar name={name} size="xs" />
                            {editingName ? (
                                <input
                                    autoFocus
                                    value={nameDraft}
                                    maxLength={30}
                                    onChange={(e) =>
                                        setNameDraft(e.target.value)
                                    }
                                    onBlur={saveName}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            saveName();
                                        }
                                        if (e.key === "Escape") {
                                            setEditingName(false);
                                        }
                                    }}
                                    className="w-32 px-2 py-0.5 bg-surface-container-high border border-outline-variant rounded text-on-surface text-xs focus:outline-none focus:border-primary"
                                />
                            ) : (
                                <>
                                    <span className="max-w-40 truncate">
                                        {name}
                                    </span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-3 h-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                </>
                            )}
                        </button>
                        <span
                            className={`text-xs ${
                                isOverLimit
                                    ? "text-error font-semibold"
                                    : isNearLimit
                                      ? "text-primary-fixed"
                                      : "text-on-surface-variant"
                            }`}
                        >
                            {charCount}/{MAX_LENGTH}
                        </span>
                    </div>
                    <div className="flex gap-2 items-end">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setError("");
                                handleTyping();
                            }}
                            placeholder="Digite sua mensagem..."
                            maxLength={MAX_LENGTH + 100}
                            className="flex-1 px-4 py-3 bg-surface-container-high border border-outline-variant rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={
                                !input.trim() || isOverLimit || !connected
                            }
                            className="px-6 py-3 bg-primary-container hover:bg-primary disabled:opacity-50 text-on-accent font-medium rounded-lg transition-colors shrink-0"
                        >
                            Enviar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
