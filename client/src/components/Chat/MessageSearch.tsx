import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import type { Message } from "../../types";

interface MessageSearchProps {
    roomId: string;
    onHighlight: (messageId: string) => void;
    onQueryChange: (query: string) => void;
    onClose: () => void;
}

export default function MessageSearch({
    roomId,
    onHighlight,
    onQueryChange,
    onClose,
}: MessageSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [current, setCurrent] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setCurrent(0);
        if (!value.trim()) {
            setResults([]);
        }
        onQueryChange(value);
    };

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const trimmed = query.trim();
        if (!trimmed) {
            return;
        }

        timeoutRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await api.get(
                    `/messages/${roomId}/search`,
                    { params: { q: trimmed, limit: 50 } },
                );
                setResults(data.messages as Message[]);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [query, roomId]);

    const goTo = (index: number) => {
        const next = results[index];
        if (next) {
            setCurrent(index);
            onHighlight(next._id);
        }
    };

    const handleNext = () => {
        if (current < results.length - 1) goTo(current + 1);
    };

    const handlePrev = () => {
        if (current > 0) goTo(current - 1);
    };

    return (
        <div className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur px-4 py-2 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-md">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Buscar mensagens..."
                    autoFocus
                    className="w-full pl-9 pr-4 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-base placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                />
            </div>

            {loading ? (
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            ) : query.trim() ? (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span>
                        {results.length === 0
                            ? "Nenhum resultado"
                            : `${current + 1}/${results.length}`}
                    </span>
                    <button
                        onClick={handlePrev}
                        disabled={current <= 0 || results.length === 0}
                        className="text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
                        title="Resultado anterior"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={current >= results.length - 1 || results.length === 0}
                        className="text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
                        title="Próximo resultado"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            ) : null}

            <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors"
                title="Fechar busca"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
