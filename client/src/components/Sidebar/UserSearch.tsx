import { useState, useRef, useEffect, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import Avatar from "../ui/Avatar";

interface SearchResult {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface UserSearchProps {
    onConversationCreated: (roomId: string) => void;
}

export default function UserSearch({ onConversationCreated }: UserSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");
    const { onlineUsers } = useSocket();
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const handleStartConversation = async (userId: string) => {
        setError("");
        try {
            const { data } = await api.post("/rooms/direct", { userId });
            onConversationCreated(data._id);
            setOpen(false);
            setQuery("");
            setResults([]);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao criar conversa"));
        }
    };

    const isOnline = (userId: string) =>
        onlineUsers.some((u) => u.userId === userId);

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-full flex items-center justify-start gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-sm"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
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
                Buscar usuário
            </button>
        );
    }

    return (
        <div className="px-2 py-2">
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setError("");
                    }}
                    placeholder="Nome ou email..."
                    maxLength={100}
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-base placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                />
                <button
                    onClick={() => {
                        setOpen(false);
                        setQuery("");
                        setResults([]);
                    }}
                    className="text-zinc-400 hover:text-white transition-colors text-sm px-2"
                >
                    Cancelar
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-1.5 rounded-lg text-xs mt-2">
                    {error}
                </div>
            )}

            {loading && (
                <p className="text-zinc-500 text-xs mt-2 px-1">Buscando...</p>
            )}

            {results.length > 0 && (
                <ul className="mt-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {results.map((user) => (
                        <li key={user._id}>
                            <button
                                onClick={() =>
                                    handleStartConversation(user._id)
                                }
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <div className="relative shrink-0">
                                    <Avatar
                                        src={user.avatar}
                                        name={user.name}
                                        size="sm"
                                    />
                                    {isOnline(user._id) && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
                                    )}
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-sm text-white truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {query.length > 0 && !loading && results.length === 0 && (
                <p className="text-zinc-500 text-xs mt-2 px-1">
                    Nenhum usuário encontrado.
                </p>
            )}
        </div>
    );
}
