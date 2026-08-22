import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";

interface SearchResult {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (roomId: string) => void;
}

export default function CreateGroupModal({
    isOpen,
    onClose,
    onCreated,
}: CreateGroupModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<SearchResult[]>([]);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const search = useCallback(async (term: string) => {
        if (term.trim().length < 1) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get(
                `/users/search?q=${encodeURIComponent(term)}`,
            );
            setResults(data);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (prevIsOpen !== isOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setName("");
            setDescription("");
            setQuery("");
            setResults([]);
            setSelected([]);
            setError("");
        }
    }

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(query), 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, search]);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 0);
    }, [isOpen]);

    if (!isOpen) return null;

    const addUser = (u: SearchResult) => {
        if (selected.some((s) => s._id === u._id)) return;
        setSelected((prev) => [...prev, u]);
        setQuery("");
        setResults([]);
    };

    const removeUser = (id: string) => {
        setSelected((prev) => prev.filter((s) => s._id !== id));
    };

    const handleCreate = async () => {
        setError("");
        const participantIds = selected.map((s) => s._id);
        try {
            const { data } = await api.post("/rooms/group", {
                name,
                description,
                participantIds,
            });
            setCreating(false);
            onCreated(data._id);
            onClose();
        } catch (err: unknown) {
            setCreating(false);
            setError(getErrorMessage(err, "Erro ao criar grupo"));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                        Criar grupo
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors"
                        title="Fechar"
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

                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                            Nome do grupo
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                            placeholder="Ex: Turma de estudos"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-base placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                            Descrição (opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={200}
                            rows={2}
                            placeholder="Sobre o que é o grupo?"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-base placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                            Adicionar participantes
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nome ou email..."
                            maxLength={100}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-base placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                        />

                        {selected.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selected.map((u) => (
                                    <span
                                        key={u._id}
                                        className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-full pl-1.5 pr-2 py-1"
                                    >
                                        <Avatar
                                            src={u.avatar}
                                            name={u.name}
                                            size="xs"
                                        />
                                        <span className="text-xs text-white max-w-32 truncate">
                                            {u.name}
                                        </span>
                                        <button
                                            onClick={() => removeUser(u._id)}
                                            className="text-zinc-400 hover:text-white transition-colors"
                                            title="Remover"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-3 w-3"
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
                                    </span>
                                ))}
                            </div>
                        )}

                        {loading && (
                            <p className="text-zinc-500 text-xs mt-2 px-1">
                                Buscando...
                            </p>
                        )}

                        {results.length > 0 && (
                            <ul className="mt-2 max-h-40 overflow-y-auto custom-scrollbar border border-zinc-700 rounded-lg">
                                {results.map((u) => (
                                    <li key={u._id}>
                                        <button
                                            onClick={() => addUser(u)}
                                            disabled={selected.some(
                                                (s) => s._id === u._id,
                                            )}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                                                selected.some(
                                                    (s) => s._id === u._id,
                                                )
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "hover:bg-zinc-800"
                                            }`}
                                        >
                                            <Avatar
                                                src={u.avatar}
                                                name={u.name}
                                                size="sm"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm text-white truncate">
                                                    {u.name}
                                                </p>
                                                <p className="text-xs text-zinc-500 truncate">
                                                    {u.email}
                                                </p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {query.length > 0 &&
                            !loading &&
                            results.length === 0 && (
                                <p className="text-zinc-500 text-xs mt-2 px-1">
                                    Nenhum usuário encontrado.
                                </p>
                            )}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-xs">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-4">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleCreate}
                        disabled={
                            creating ||
                            name.trim().length < 2 ||
                            selected.length === 0
                        }
                    >
                        {creating ? "Criando..." : "Criar grupo"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
