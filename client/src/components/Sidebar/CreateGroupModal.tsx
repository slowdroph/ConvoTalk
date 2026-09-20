import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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

type Visibility = "private" | "public";

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
    const [visibility, setVisibility] = useState<Visibility>("private");
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
            setResults(Array.isArray(data) ? data : []);
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
            setVisibility("private");
            setPhoto(null);
            setPhotoPreview(null);
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

    useEffect(() => {
        return () => {
            if (photoPreview) URL.revokeObjectURL(photoPreview);
        };
    }, [photoPreview]);

    if (!isOpen) return null;

    const isSelected = (id: string) => selected.some((s) => s._id === id);

    const toggleUser = (u: SearchResult) => {
        setSelected((prev) =>
            prev.some((s) => s._id === u._id)
                ? prev.filter((s) => s._id !== u._id)
                : [...prev, u],
        );
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("A imagem deve ter no máximo 5MB.");
            return;
        }
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
        setError("");
    };

    const handleCreate = async () => {
        if (creating) return;
        setError("");
        setCreating(true);
        try {
            const { data } = await api.post("/rooms/group", {
                name: name.trim(),
                description: description.trim(),
                participantIds: selected.map((s) => s._id),
                visibility,
            });

            if (photo) {
                try {
                    const formData = new FormData();
                    formData.append("avatar", photo);
                    await api.put(`/rooms/${data._id}/avatar`, formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                } catch (err: unknown) {
                    console.error("Erro ao enviar foto do grupo:", err);
                }
            }

            setCreating(false);
            onCreated(data._id);
            onClose();
        } catch (err: unknown) {
            setCreating(false);
            setError(getErrorMessage(err, "Erro ao criar grupo"));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
        }
    };

    const canCreate = !creating && name.trim().length >= 2;

    const privacyCard = (
        value: Visibility,
        title: string,
        hint: string,
        icon: React.ReactNode,
    ) => {
        const active = visibility === value;
        return (
            <button
                key={value}
                type="button"
                onClick={() => setVisibility(value)}
                aria-pressed={active}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    active
                        ? "border-emerald-500/50 bg-emerald-950/25 shadow-sm hover:border-emerald-400"
                        : "border-white/10 bg-[#090f09] hover:border-white/20"
                }`}
            >
                <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        active
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/5 text-noir-text-muted"
                    }`}
                >
                    {icon}
                </span>
                <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                        <span
                            className={`text-xs font-semibold ${active ? "text-white" : "text-noir-text-muted"}`}
                        >
                            {title}
                        </span>
                        {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                    </span>
                    <span className="block text-[10px] text-noir-text-muted leading-tight truncate">
                        {hint}
                    </span>
                </span>
            </button>
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label="Criar grupo"
        >
            <div
                className="relative w-full max-w-xl bg-[#111711] border border-emerald-500/25 rounded-2xl p-6 text-noir-text-bright flex flex-col gap-5 overflow-hidden max-h-[90vh] shadow-2xl shadow-black/90"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

                <header className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                Criar grupo
                            </h2>
                            <p className="text-xs text-noir-text-muted mt-0.5">
                                Crie uma sala compartilhada para sua equipe ou
                                comunidade.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        title="Fechar (ESC)"
                        className="group flex items-center gap-1.5 p-1.5 rounded-lg text-noir-text-muted hover:text-white hover:bg-white/5 transition"
                    >
                        <kbd className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-noir-text-muted group-hover:text-noir-text-bright">
                            esc
                        </kbd>
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M6 18L18 6M6 6l12 12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                            />
                        </svg>
                    </button>
                </header>

                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-xs">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="shrink-0">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                title="Escolher foto do grupo"
                                className="w-[60px] h-[60px] rounded-full bg-[#182318] border border-dashed border-emerald-500/40 hover:border-emerald-400 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition group shadow-inner"
                            >
                                {photoPreview ? (
                                    <img
                                        src={photoPreview}
                                        alt="Foto do grupo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <>
                                        <svg
                                            className="w-5 h-5 text-emerald-400/80 group-hover:text-emerald-300 transition"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.8}
                                            />
                                            <path
                                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.8}
                                            />
                                        </svg>
                                        <span className="text-[9px] text-emerald-300/80 font-medium tracking-tight mt-0.5">
                                            Foto
                                        </span>
                                    </>
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                name="group-photo"
                                id="group-photo"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="sr-only"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1.5">
                                <label
                                    htmlFor="group-name"
                                    className="text-[11px] font-semibold tracking-wider text-noir-text-bright uppercase"
                                >
                                    Nome do grupo{" "}
                                    <span className="text-emerald-400">*</span>
                                </label>
                                <span className="text-[10px] text-noir-text-muted font-mono">
                                    {name.length}/50
                                </span>
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                name="name"
                                id="group-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={50}
                                placeholder="Ex: Turma de estudos"
                                autoComplete="off"
                                className="w-full bg-[#090f09] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-noir-text-muted focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition shadow-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="group-desc"
                            className="block text-[11px] font-semibold tracking-wider text-noir-text-muted uppercase mb-1.5"
                        >
                            Descrição (opcional)
                        </label>
                        <textarea
                            name="description"
                            id="group-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={200}
                            rows={2}
                            placeholder="Sobre o que é o grupo? Compartilhe regras, links ou objetivos..."
                            className="w-full bg-[#090f09] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-noir-text-bright placeholder-noir-text-muted focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none transition"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-semibold tracking-wider text-noir-text-bright uppercase">
                                Adicionar participantes
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {selected.length} selecionado
                                {selected.length === 1 ? "" : "s"}
                            </span>
                        </div>
                        <div className="relative">
                            <svg
                                className="w-4 h-4 absolute left-3.5 top-3 text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                />
                            </svg>
                            <input
                                type="text"
                                name="search"
                                id="addParticipantsSearch"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar por nome, email ou #ID..."
                                maxLength={100}
                                autoComplete="off"
                                className="w-full bg-[#090f09] border border-emerald-500/40 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-noir-text-muted focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition"
                            />
                        </div>

                        {selected.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-0.5">
                                {selected.map((u) => (
                                    <span
                                        key={u._id}
                                        className="bg-emerald-950/60 border border-emerald-500/35 text-emerald-200 text-xs pl-1.5 pr-2.5 py-1 rounded-full flex items-center gap-2 shadow-sm"
                                    >
                                        <Avatar
                                            src={u.avatar}
                                            name={u.name}
                                            size="xs"
                                        />
                                        <span className="font-medium text-xs max-w-32 truncate">
                                            {u.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toggleUser(u)}
                                            title="Remover"
                                            className="text-emerald-400/80 hover:text-white transition ml-0.5"
                                        >
                                            <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    d="M6 18L18 6M6 6l12 12"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {loading && (
                            <p className="text-noir-text-muted text-xs px-1">
                                Buscando...
                            </p>
                        )}

                        {results.length > 0 && (
                            <div className="border border-white/10 rounded-xl bg-[#090f09]/80 divide-y divide-white/5 overflow-hidden max-h-44 overflow-y-auto custom-scrollbar">
                                {results.map((u) => {
                                    const checked = isSelected(u._id);
                                    return (
                                        <div
                                            key={u._id}
                                            onClick={() => toggleUser(u)}
                                            role="checkbox"
                                            aria-checked={checked}
                                            className="px-3 py-2 flex items-center justify-between hover:bg-emerald-950/20 transition cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Avatar
                                                    src={u.avatar}
                                                    name={u.name}
                                                    size="sm"
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold text-white truncate">
                                                            {u.name}
                                                        </span>
                                                        <span
                                                            className={`text-[10px] border px-1 rounded font-mono shrink-0 ${
                                                                checked
                                                                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/30"
                                                                    : "bg-white/5 text-noir-text-muted border-white/10"
                                                            }`}
                                                        >
                                                            #{u.publicId}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-noir-text-muted truncate">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                                                    checked
                                                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                                        : "border-white/15 text-transparent"
                                                }`}
                                            >
                                                <svg
                                                    className="w-3.5 h-3.5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        d="M5 13l4 4L19 7"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2.5}
                                                    />
                                                </svg>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {query.trim().length > 0 &&
                            !loading &&
                            results.length === 0 && (
                                <p className="text-noir-text-muted text-xs px-1">
                                    Nenhum usuário encontrado.
                                </p>
                            )}
                    </div>

                    <div>
                        <span className="block text-[11px] font-semibold tracking-wider text-noir-text-muted uppercase mb-1.5">
                            Privacidade
                        </span>
                        <div className="grid grid-cols-2 gap-2.5">
                            {privacyCard(
                                "private",
                                "Privado",
                                "Apenas convidados",
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                    />
                                </svg>,
                            )}
                            {privacyCard(
                                "public",
                                "Público",
                                "Qualquer um entra",
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                    />
                                </svg>,
                            )}
                        </div>
                    </div>
                </div>

                <footer className="border-t border-white/10 pt-4 mt-2 flex items-center justify-between">
                    <span className="text-xs text-noir-text-muted hidden sm:inline-block">
                        Pressione{" "}
                        <kbd className="px-1 py-0.5 bg-black/40 border border-white/10 rounded font-mono text-[10px] text-noir-text-muted">
                            esc
                        </kbd>{" "}
                        para cancelar
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-noir-text-muted hover:text-white hover:bg-white/5 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={!canCreate}
                            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 shadow-lg shadow-emerald-950/60 flex items-center gap-2"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M12 4v16m8-8H4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                />
                            </svg>
                            <span>{creating ? "Criando..." : "Criar grupo"}</span>
                        </button>
                    </div>
                </footer>
            </div>
        </div>,
        document.body,
    );
}
