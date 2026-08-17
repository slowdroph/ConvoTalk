import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import Avatar from "../ui/Avatar";

interface SearchResult {
  _id: string;
  content: string;
  createdAt: string;
  sender: { _id: string; name: string; avatar?: string } | null;
  room: { _id: string; name: string; type: "group" | "direct" };
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (roomId: string, messageId: string) => void;
}

export default function SearchDialog({
  isOpen,
  onClose,
  onSelectResult,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const trimmed = query.trim();

    timeoutRef.current = setTimeout(async () => {
      if (!trimmed) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data } = await api.get("/messages/search", {
          params: { q: trimmed, limit: 20 },
        });
        setResults(data.messages as SearchResult[]);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  if (!isOpen) return null;

  const handleEscape = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleEscape}
    >
      <div
        className="w-full max-w-lg mt-16 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-700 flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar em todas as conversas..."
            className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none"
            aria-label="Buscar mensagens em todas as conversas"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
            aria-label="Fechar busca"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto">
          {query.trim() && results.length === 0 && !loading && (
            <p className="px-4 py-8 text-center text-zinc-500 text-sm">
              Nenhum resultado encontrado.
            </p>
          )}
          {results.map((result) => (
            <button
              key={result._id}
              onClick={() => onSelectResult(result.room._id, result._id)}
              className="w-full text-left px-4 py-3 border-b border-zinc-800 hover:bg-zinc-800/60 transition-colors flex items-start gap-3"
            >
              <Avatar
                src={result.sender?.avatar}
                name={result.sender?.name ?? "Sistema"}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold truncate">
                    {result.sender?.name ?? "Mensagem de sistema"}
                  </span>
                  <span className="text-zinc-500 text-xs truncate shrink-0">
                    {result.room.name}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm truncate">{result.content}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}