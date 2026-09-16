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
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/80">
                {/* Top bar */}
                <div className="bg-surface-container-lowest/90 px-4 py-3 border-b border-outline-variant/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                        </div>
                        <div className="h-4 w-px bg-outline-variant" />
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                                #
                            </span>
                            <span className="font-semibold text-xs sm:text-sm text-on-surface">
                                Preview: Sala Geral
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-primary animate-ping" : "bg-error"}`} />
                            {onlineCount} online
                        </span>
                    </div>
                </div>

                {/* Message Body */}
                <div
                    ref={listRef}
                    className="p-6 bg-surface-container-lowest/60 min-h-[240px] max-h-[360px] overflow-y-auto custom-scrollbar flex flex-col justify-end gap-3 text-xs sm:text-sm"
                >
                    {/* Welcome Bot message */}
                    <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                        <div className="w-7 h-7 rounded-full bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 text-xs font-bold">
                            CT
                        </div>
                        <div className="bg-surface-container-high border border-outline-variant rounded-2xl rounded-bl-sm px-4 py-2.5 text-on-surface shadow-sm">
                            <p className="leading-relaxed">
                                Olá! Bem-vindo ao ConvoTalk. Experimente a latência ultra-baixa com WebSockets em tempo real.
                            </p>
                            <div className="flex items-center justify-end mt-1 gap-1 text-[10px] text-on-surface-variant">
                                <span>Agora</span>
                            </div>
                        </div>
                    </div>

                    {/* Socket Messages */}
                    {messages.map((msg) => {
                        const mine = isMyMessage(msg.senderId);
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${
                                    mine ? "self-end justify-end" : "self-start justify-start"
                                }`}
                            >
                                {!mine && (
                                    <Avatar name={msg.name} size="xs" />
                                )}
                                <div
                                    className={`px-4 py-2.5 rounded-2xl ${
                                        mine
                                            ? "bg-primary-container/25 border border-primary/40 rounded-br-sm text-on-surface backdrop-blur"
                                            : "bg-surface-container-high border border-outline-variant rounded-bl-sm text-on-surface shadow-sm"
                                    }`}
                                >
                                    {!mine && (
                                        <p className="text-[10px] font-bold text-primary mb-0.5">
                                            {msg.name}
                                        </p>
                                    )}
                                    <p className="leading-relaxed">{msg.content}</p>
                                    <div
                                        className={`flex items-center gap-1.5 mt-1 text-[10px] ${
                                            mine ? "justify-end text-primary" : "justify-end text-on-surface-variant"
                                        }`}
                                    >
                                        <span>{formatTime(msg.createdAt)}</span>
                                        {mine && <span className="font-bold">✓✓</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {typingName && (
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant italic pt-1">
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary bounce-1" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary bounce-2" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary bounce-3" />
                            </div>
                            <span>{typingName} está digitando...</span>
                        </div>
                    )}
                </div>

            <div className="p-3 bg-surface-container-lowest/80 border-t border-outline-variant/30">
                {error && (
                    <div className="bg-error/10 border border-error/50 text-on-surface px-3 py-1.5 rounded-lg text-xs mb-2">
                        {error}
                    </div>
                )}
                <div className="flex items-center justify-between mb-2 px-1">
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
                                name="name"
                                value={nameDraft}
                                maxLength={30}
                                onChange={(e) => setNameDraft(e.target.value)}
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
                                <span className="max-w-40 truncate text-on-surface/80 font-medium">
                                    {name}
                                </span>
                                <span className="material-symbols-outlined text-[13px] text-on-surface-variant">edit</span>
                            </>
                        )}
                    </button>
                    <span
                        className={`text-[11px] ${
                            isOverLimit
                                ? "text-error font-semibold"
                                : isNearLimit
                                  ? "text-primary-fixed"
                                  : "text-on-surface-variant/70"
                        }`}
                    >
                        {charCount}/{MAX_LENGTH}
                    </span>
                </div>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <button type="button" aria-label="Emoji" className="text-on-surface-variant hover:text-primary transition-colors text-sm px-1">😊</button>
                    <button type="button" aria-label="Anexo" className="text-on-surface-variant hover:text-primary transition-colors text-sm px-1">📎</button>
                    <input
                        type="text"
                        name="message"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setError("");
                            handleTyping();
                        }}
                        placeholder="Digite uma mensagem em tempo real..."
                        maxLength={MAX_LENGTH + 100}
                        className="flex-1 bg-surface-container-high/60 border border-outline-variant/30 rounded-full px-4 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isOverLimit || !connected}
                        aria-label="Enviar mensagem"
                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs shadow-lg shadow-primary/20 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
