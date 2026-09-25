import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../ui/Avatar";
import ConfirmDialog from "../ui/ConfirmDialog";
import type { Room, PublicUser } from "../../types";

interface SearchResult {
    _id: string;
    name: string;
    publicId: string;
    avatar?: string;
    status?: string;
}

interface GroupSettingsProps {
    isOpen: boolean;
    room: Room;
    onClose: () => void;
    onRoomUpdated: (room: Room) => void;
    onRoomDeleted: (roomId: string) => void;
}

export default function GroupSettings({
    isOpen,
    room,
    onClose,
    onRoomUpdated,
    onRoomDeleted,
}: GroupSettingsProps) {
    const { user } = useAuth();
    const [name, setName] = useState(room.name);
    const [description, setDescription] = useState(room.description);
    const [visibility, setVisibility] = useState<"private" | "public">(
        room.visibility ?? "private",
    );
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const isCreator = room.createdBy === user?._id;
    const isAdmin = (room.admins ?? []).some((a) => a._id === user?._id);
    const canEdit = isCreator || isAdmin;

    const search = useCallback(async (term: string) => {
        if (term.trim().length < 3) {
            setResults([]);
            return;
        }
        if (term.includes("@")) {
            setResults([]);
            setError("Busque por nome ou #ID. Busca por email foi desativada.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get(
                `/users/search?q=${encodeURIComponent(term)}`,
            );
            const list = Array.isArray(data) ? data : (data?.data ?? []);
            setResults(list);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const [prevRoomId, setPrevRoomId] = useState<string | null>(
        room?._id ?? null,
    );
    if (prevIsOpen !== isOpen || prevRoomId !== (room?._id ?? null)) {
        setPrevIsOpen(isOpen);
        setPrevRoomId(room?._id ?? null);
        if (isOpen) {
            setName(room.name);
            setDescription(room.description);
            setVisibility(room.visibility ?? "private");
            setQuery("");
            setResults([]);
            setError("");
            setAvatarPreview(null);
        }
    }

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(query), 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, search]);

    if (!isOpen || !canEdit) return null;

    const handleSave = async () => {
        setError("");
        setSaving(true);
        try {
            if (visibility !== (room.visibility ?? "private")) {
                await api.patch(`/rooms/${room._id}/visibility`, {
                    visibility,
                });
            }
            const { data } = await api.put(`/rooms/${room._id}`, {
                name,
                description,
            });
            onRoomUpdated(data);
            setSaving(false);
        } catch (err: unknown) {
            setSaving(false);
            setError(getErrorMessage(err, "Erro ao salvar o grupo"));
        }
    };

    const handleAddMember = async (userId: string) => {
        setError("");
        try {
            const { data } = await api.post(`/rooms/${room._id}/members`, {
                userId,
            });
            onRoomUpdated(data);
            setResults((prev) => prev.filter((r) => r._id !== userId));
            setQuery("");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao adicionar membro"));
        }
    };

    const handleRemoveMember = async (userId: string) => {
        setError("");
        try {
            const { data } = await api.delete(
                `/rooms/${room._id}/members/${userId}`,
            );
            onRoomUpdated(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao remover membro"));
        }
    };

    const handlePromoteAdmin = async (userId: string) => {
        setError("");
        try {
            const { data } = await api.post(`/rooms/${room._id}/admins`, {
                userId,
            });
            onRoomUpdated(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao promover administrador"));
        }
    };

    const handleDemoteAdmin = async (userId: string) => {
        setError("");
        try {
            const { data } = await api.delete(
                `/rooms/${room._id}/admins/${userId}`,
            );
            onRoomUpdated(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao rebaixar administrador"));
        }
    };

    const handleAvatarChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("A imagem deve ter no máximo 5MB.");
            return;
        }

        setAvatarPreview(URL.createObjectURL(file));
        setError("");
        setAvatarLoading(true);

        try {
            const formData = new FormData();
            formData.append("avatar", file);
            const { data } = await api.put(
                `/rooms/${room._id}/avatar`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                },
            );
            onRoomUpdated(data);
            setAvatarPreview(null);
        } catch (err: unknown) {
            setAvatarPreview(null);
            setError(getErrorMessage(err, "Erro ao fazer upload da imagem"));
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setError("");
        setAvatarLoading(true);
        try {
            const { data } = await api.delete(`/rooms/${room._id}/avatar`);
            onRoomUpdated(data);
            setAvatarPreview(null);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao remover avatar"));
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
        }
    };

    const { participants } = room;
    const admins = room.admins ?? [];
    const isMemberInSearch = (u: SearchResult) =>
        participants.some((p) => p._id === u._id);
    const isAdminOf = (participantId: string) =>
        participantId !== room.createdBy &&
        admins.some((a) => a._id === participantId);
    const currentAvatar = avatarPreview || room.avatar;

    const visibilityCard = (
        value: "private" | "public",
        title: string,
        hint: string,
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
            aria-label="Configurações do grupo"
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
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                />
                                <path
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                Configurações do grupo
                            </h2>
                            <p className="text-xs text-noir-text-muted mt-0.5">
                                Gerencie foto, membros e privacidade.
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
                            <Avatar
                                src={currentAvatar}
                                name={room.name}
                                size="lg"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={avatarLoading}
                                className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {avatarLoading
                                    ? "Enviando..."
                                    : "Alterar foto"}
                            </button>
                            {room.avatar && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    disabled={avatarLoading}
                                    className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Remover
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                name="avatar"
                                id="group-settings-avatar"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {isCreator && (
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label
                                    htmlFor="groupSettingsName"
                                    className="text-[11px] font-semibold tracking-wider text-noir-text-bright uppercase"
                                >
                                    Nome do grupo
                                </label>
                                <span className="text-[10px] text-noir-text-muted font-mono">
                                    {name.length}/50
                                </span>
                            </div>
                            <input
                                type="text"
                                name="name"
                                id="groupSettingsName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={50}
                                autoComplete="off"
                                className="w-full bg-[#090f09] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-noir-text-muted focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition shadow-sm"
                            />
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="groupSettingsDescription"
                            className="block text-[11px] font-semibold tracking-wider text-noir-text-muted uppercase mb-1.5"
                        >
                            Descrição
                        </label>
                        <textarea
                            name="description"
                            id="groupSettingsDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={200}
                            rows={2}
                            placeholder="Sobre o que é o grupo?"
                            className="w-full bg-[#090f09] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-noir-text-bright placeholder-noir-text-muted focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none transition"
                        />
                    </div>

                    <div>
                        <span className="block text-[11px] font-semibold tracking-wider text-noir-text-muted uppercase mb-1.5">
                            Privacidade
                        </span>
                        <div className="grid grid-cols-2 gap-2.5">
                            {visibilityCard(
                                "private",
                                "Privado",
                                "Apenas convidados",
                            )}
                            {visibilityCard(
                                "public",
                                "Público",
                                "Qualquer um entra",
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="settingsAddMemberSearch"
                            className="block text-[11px] font-semibold tracking-wider text-noir-text-bright uppercase"
                        >
                            Adicionar membro
                        </label>
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
                                ref={inputRef}
                                type="text"
                                name="search"
                                id="settingsAddMemberSearch"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar por nome ou #ID..."
                                maxLength={50}
                                autoComplete="off"
                                className="w-full bg-[#090f09] border border-emerald-500/40 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-noir-text-muted focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition"
                            />
                        </div>
                        {loading && (
                            <p className="text-noir-text-muted text-xs px-1">
                                Buscando...
                            </p>
                        )}
                        {results.length > 0 && (
                            <div className="border border-white/10 rounded-xl bg-[#090f09]/80 divide-y divide-white/5 overflow-hidden max-h-40 overflow-y-auto custom-scrollbar">
                                {results.map((u) => {
                                    const member = isMemberInSearch(u);
                                    return (
                                        <div
                                            key={u._id}
                                            onClick={() =>
                                                !member &&
                                                handleAddMember(u._id)
                                            }
                                            className={`px-3 py-2 flex items-center justify-between transition ${
                                                member
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "hover:bg-emerald-950/20 cursor-pointer"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Avatar
                                                    src={u.avatar}
                                                    name={u.name}
                                                    size="sm"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-white truncate">
                                                        {u.name}
                                                    </p>
                                                    <p className="text-[11px] text-noir-text-muted truncate font-mono">
                                                        #{u.publicId}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] text-emerald-400 shrink-0">
                                                {member
                                                    ? "Já é membro"
                                                    : "+ Adicionar"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <span className="block text-[11px] font-semibold tracking-wider text-noir-text-muted uppercase mb-1.5">
                            Participantes ({participants.length})
                        </span>
                        <ul className="border border-white/10 rounded-xl bg-[#090f09]/80 divide-y divide-white/5 overflow-hidden">
                            {participants.map((p: PublicUser) => (
                                <li
                                    key={p._id}
                                    className="flex items-center gap-3 px-3 py-2"
                                >
                                    <Avatar
                                        src={p.avatar}
                                        name={p.name}
                                        size="sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-white truncate">
                                            {p.name}
                                        </p>
                                        {p._id === room.createdBy ? (
                                            <p className="text-[11px] text-emerald-400">
                                                Criador
                                            </p>
                                        ) : isAdminOf(p._id) ? (
                                            <p className="text-[11px] text-amber-400">
                                                Administrador
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-noir-text-muted">
                                                Membro
                                            </p>
                                        )}
                                    </div>
                                    {isCreator && p._id !== user?._id && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveMember(p._id)
                                            }
                                            className="text-noir-text-muted hover:text-red-400 transition-colors p-1"
                                            title="Remover do grupo"
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                    {isCreator &&
                                        p._id !== user?._id &&
                                        p._id !== room.createdBy &&
                                        (isAdminOf(p._id) ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDemoteAdmin(p._id)
                                                }
                                                className="text-noir-text-muted hover:text-amber-400 transition-colors p-1"
                                                title="Rebaixar administrador"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                    />
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handlePromoteAdmin(p._id)
                                                }
                                                className="text-noir-text-muted hover:text-emerald-400 transition-colors p-1"
                                                title="Promover a administrador"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                    />
                                                </svg>
                                            </button>
                                        ))}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {isCreator && (
                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirm(true)}
                                className="w-full px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-medium rounded-xl transition-colors text-xs"
                            >
                                Excluir grupo
                            </button>
                        </div>
                    )}
                </div>

                <footer className="border-t border-white/10 pt-4 mt-2 flex items-center justify-between">
                    <span className="text-xs text-noir-text-muted hidden sm:inline-block">
                        Pressione{" "}
                        <kbd className="px-1 py-0.5 bg-black/40 border border-white/10 rounded font-mono text-[10px] text-noir-text-muted">
                            esc
                        </kbd>{" "}
                        para fechar
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-noir-text-muted hover:text-white hover:bg-white/5 transition"
                        >
                            Fechar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={
                                saving || (isCreator && name.trim().length < 2)
                            }
                            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 shadow-lg shadow-emerald-950/60"
                        >
                            {saving ? "Salvando..." : "Salvar alterações"}
                        </button>
                    </div>
                </footer>
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm}
                title="Excluir grupo"
                message={`Tem certeza que deseja excluir "${room.name}"? Todas as mensagens serão removidas e isso não pode ser desfeito.`}
                confirmLabel="Excluir"
                danger
                onCancel={() => setDeleteConfirm(false)}
                onConfirm={() => {
                    setDeleteConfirm(false);
                    onRoomDeleted(room._id);
                }}
            />
        </div>,
        document.body,
    );
}
