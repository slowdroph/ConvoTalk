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
    const [filter, setFilter] = useState<"all" | "mentions">("all");
    const [results, setResults] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [current, setCurrent] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const abortRef = useRef<AbortController | null>(null);
    const requestVersionRef = useRef(0);

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setCurrent(0);
        if (!value.trim() && filter === "all") {
            setResults([]);
        }
        onQueryChange(value);
    };

    const handleFilterChange = (newFilter: "all" | "mentions") => {
        setFilter(newFilter);
        setCurrent(0);
        if (!query.trim() && newFilter === "all") {
            setResults([]);
        }
    };

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (abortRef.current) abortRef.current.abort();

        if (filter === "all" && !query.trim()) {
            return;
        }

        const version = ++requestVersionRef.current;

        timeoutRef.current = setTimeout(async () => {
            const controller = new AbortController();
            abortRef.current = controller;
            setLoading(true);
            try {
                const params: Record<string, string | number> = {
                    limit: 50,
                    filter,
                };
                if (query.trim()) {
                    params.q = query.trim();
                }
                const { data } = await api.get(`/messages/${roomId}/search`, {
                    params,
                    signal: controller.signal,
                });
                if (version === requestVersionRef.current) {
                    setResults(data.messages as Message[]);
                    setCurrent(0);
                }
            } catch {
                if (version === requestVersionRef.current) {
                    setResults([]);
                    setCurrent(0);
                }
            } finally {
                if (version === requestVersionRef.current) {
                    setLoading(false);
                }
            }
        }, 300);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, [query, filter, roomId]);

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
        <div className="border-b border-noir-border bg-noir-surface/90 backdrop-blur px-4 py-2 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-50 max-w-md">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-slate-500 dark:text-noir-text-muted absolute left-3 top-1/2 -translate-y-1/2"
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
                    type="text"
                    name="search"
                    id="search"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder={filter === "mentions" ? "Filtrar menções (opcional)..." : "Buscar mensagens..."}
                    aria-label="Buscar mensagens"
                    autoFocus
                    className="w-full pl-9 pr-4 py-1.5 bg-noir-surface-alt border border-noir-border rounded-lg text-noir-text-bright text-base placeholder-noir-text-muted/70 focus:outline-none focus:border-emerald-500 transition-colors"
                />
            </div>

            <div className="flex items-center gap-1 bg-noir-surface-alt border border-noir-border rounded-lg p-0.5">
                <button
                    onClick={() => handleFilterChange("all")}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        filter === "all"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 hover:text-slate-900 dark:text-noir-text-muted dark:hover:text-noir-text-bright"
                    }`}
                >
                    Todas
                </button>
                <button
                    onClick={() => handleFilterChange("mentions")}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        filter === "mentions"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 hover:text-slate-900 dark:text-noir-text-muted dark:hover:text-noir-text-bright"
                    }`}
                >
                    Menções
                </button>
            </div>

            {loading ? (
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : query.trim() || filter === "mentions" ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-noir-text-muted">
                    <span>
                        {results.length === 0
                            ? "Nenhum resultado"
                            : `${Math.min(current + 1, results.length)}/${results.length}`}
                    </span>
                    <button
                        onClick={handlePrev}
                        disabled={current <= 0 || results.length === 0}
                        className="text-slate-500 hover:text-slate-900 dark:text-noir-text-muted dark:hover:text-noir-text-bright disabled:opacity-30 transition-colors"
                        title="Resultado anterior"
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
                                d="M5 15l7-7 7 7"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={
                            current >= results.length - 1 ||
                            results.length === 0
                        }
                        className="text-slate-500 hover:text-slate-900 dark:text-noir-text-muted dark:hover:text-noir-text-bright disabled:opacity-30 transition-colors"
                        title="Próximo resultado"
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
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                </div>
            ) : null}

            <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-900 dark:text-noir-text-muted dark:hover:text-noir-text-bright transition-colors"
                title="Fechar busca"
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
    );
}
