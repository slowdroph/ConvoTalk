import { useState, useRef, useEffect, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import Avatar from "../ui/Avatar";

interface SearchResult {
    _id: string;
    name: string;
    email: string;
    publicId: string;
    avatar?: string;
}

interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConversationCreated: (roomId: string) => void;
}

export default function UserSearchModal({
    isOpen,
    onClose,
    onConversationCreated,
}: UserSearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { onlineUsers } = useSocket();
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isOpen]);

    const handleClose = () => {
        setQuery("");
        setResults([]);
        setError("");
        setSelectedIndex(0);
        onClose();
    };

    const search = useCallback(async (term: string) => {
        if (term.trim().length < 1) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const { data } = await api.get(
                `/users/search?q=${encodeURIComponent(term)}`,
            );
            setResults(data);
            setError("");
        } catch (err: unknown) {
            setResults([]);
            setError(getErrorMessage(err, "Erro ao buscar usuários"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(query), 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, search]);

    const isOnline = (userId: string) =>
        onlineUsers.some((u) => u.userId === userId);

    const handleStartConversation = async (userId: string) => {
        setError("");
        try {
            const { data } = await api.post("/rooms/direct", { userId });
            onConversationCreated(data._id);
            handleClose();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao criar conversa"));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            handleClose();
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) =>
                prev < results.length - 1 ? prev + 1 : prev,
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter" && results.length > 0) {
            e.preventDefault();
            handleStartConversation(results[selectedIndex]._id);
        }
    };

    useEffect(() => {
        if (selectedIndex > 0 && listRef.current) {
            const items = listRef.current.children;
            if (items[selectedIndex]) {
                (items[selectedIndex] as HTMLElement).scrollIntoView({
                    block: "nearest",
                });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4"
            onClick={handleClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label="Buscar usuário"
        >
            <div
                className="w-full max-w-lg mt-16 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col max-h-[70vh] dark:bg-noir-card dark:border-noir-border"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 dark:border-noir-border">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-400 dark:text-noir-text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        ref={inputRef}
                        name="search"
                        id="userSearch"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setError("");
                        }}
                        placeholder="Buscar por nome, email ou #ID..."
                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 outline-none dark:text-noir-text-bright dark:placeholder-noir-text-muted/70"
                        aria-label="Buscar usuário"
                        aria-autocomplete="list"
                        aria-controls="user-search-results"
                        aria-activedescendant={
                            results.length > 0
                                ? `user-search-result-${selectedIndex}`
                                : undefined
                        }
                        autoComplete="off"
                    />
                    {loading && (
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-900 transition-colors dark:text-noir-text-muted dark:hover:text-noir-text-bright"
                        aria-label="Fechar busca"
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

                {error && (
                    <div className="px-4 py-2 bg-red-500/10 border-b border-slate-200 dark:border-noir-border">
                        <p className="text-red-600 text-sm dark:text-red-400">{error}</p>
                    </div>
                )}

                <div
                    id="user-search-results"
                    className="overflow-y-auto"
                    ref={listRef}
                    role="listbox"
                    aria-label="Resultados da busca"
                >
                    {query.trim() && results.length === 0 && !loading && !error && (
                        <p className="px-4 py-8 text-center text-slate-500 text-sm dark:text-noir-text-muted">
                            Nenhum usuário encontrado.
                        </p>
                    )}
                    {results.map((user, index) => (
                        <button
                            key={user._id}
                            id={`user-search-result-${index}`}
                            onClick={() => handleStartConversation(user._id)}
                            role="option"
                            aria-selected={index === selectedIndex}
                            className={`w-full text-left px-4 py-3 border-b border-slate-200 transition-colors flex items-center gap-3 dark:border-noir-border ${
                                index === selectedIndex
                                    ? "bg-slate-200/70 dark:bg-noir-surface-alt/80"
                                    : "hover:bg-slate-100 dark:hover:bg-noir-surface-alt/60"
                            }`}
                        >
                            <div className="relative shrink-0">
                                <Avatar
                                    src={user.avatar}
                                    name={user.name}
                                    size="sm"
                                />
                                {isOnline(user._id) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-noir-card" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-900 text-sm font-semibold truncate dark:text-noir-text-bright">
                                        {user.name}
                                    </span>
                                    <span className="text-slate-500 text-xs font-mono shrink-0 dark:text-noir-text-muted">
                                        #{user.publicId}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs truncate dark:text-noir-text-muted">
                                    {user.email}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
