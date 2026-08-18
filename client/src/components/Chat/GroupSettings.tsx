import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../ui/Avatar";
import ConfirmDialog from "../ui/ConfirmDialog";
import Button from "../ui/Button";
import type { Room, Participant } from "../../types";

interface SearchResult {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
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
  const [prevRoomId, setPrevRoomId] = useState<string | null>(room?._id ?? null);
  if (prevIsOpen !== isOpen || prevRoomId !== (room?._id ?? null)) {
    setPrevIsOpen(isOpen);
    setPrevRoomId(room?._id ?? null);
    if (isOpen) {
      setName(room.name);
      setDescription(room.description);
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

  if (!isOpen) return null;

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const { data } = await api.put(`/rooms/${room._id}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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

  const { participants } = room;
  const admins = room.admins ?? [];
  const isMemberInSearch = (u: SearchResult) =>
    participants.some((p) => p._id === u._id);
  const isAdminOf = (participantId: string) =>
    participantId !== room.createdBy &&
    admins.some((a) => a._id === participantId);
  const currentAvatar = avatarPreview || room.avatar;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Configurações do grupo</h3>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <Avatar src={currentAvatar} name={room.name} size="lg" />
            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {avatarLoading ? "Enviando..." : "Alterar foto"}
                </button>
                {room.avatar && (
                  <button
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
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {canEdit ? (
            <>
              {isCreator && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Nome do grupo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-base placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-base placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || (isCreator && name.trim().length < 2)}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-on-accent font-medium rounded-lg transition-colors text-sm"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Adicionar membro
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
                {loading && (
                  <p className="text-zinc-500 text-xs mt-2 px-1">Buscando...</p>
                )}
                {results.length > 0 && (
                  <ul className="mt-2 max-h-40 overflow-y-auto custom-scrollbar border border-zinc-700 rounded-lg">
                    {results.map((u) => (
                      <li key={u._id}>
                        <button
                          onClick={() => handleAddMember(u._id)}
                          disabled={isMemberInSearch(u)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                            isMemberInSearch(u)
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-zinc-800"
                          }`}
                        >
                          <Avatar src={u.avatar} name={u.name} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{u.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-400">
              Apenas o criador e os administradores do grupo podem editar as
              configurações.
            </p>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Participantes ({participants.length})
            </label>
            <ul className="space-y-1">
              {participants.map((p: Participant) => (
                <li
                  key={p._id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <Avatar src={p.avatar} name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{p.name}</p>
                    {p._id === room.createdBy ? (
                      <p className="text-xs text-green-400">Criador</p>
                    ) : isAdminOf(p._id) ? (
                      <p className="text-xs text-amber-400">Administrador</p>
                    ) : (
                      <p className="text-xs text-zinc-500">Membro</p>
                    )}
                  </div>
                  {isCreator && p._id !== user?._id && (
                    <button
                      onClick={() => handleRemoveMember(p._id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                      title="Remover do grupo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  {isCreator &&
                    p._id !== user?._id &&
                    p._id !== room.createdBy &&
                    (isAdminOf(p._id) ? (
                      <button
                        onClick={() => handleDemoteAdmin(p._id)}
                        className="text-zinc-500 hover:text-amber-400 transition-colors p-1"
                        title="Rebaixar administrador"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePromoteAdmin(p._id)}
                        className="text-zinc-500 hover:text-green-400 transition-colors p-1"
                        title="Promover a administrador"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          </div>

          {isCreator && (
            <div className="pt-2 border-t border-zinc-700">
              <button
                onClick={() => setDeleteConfirm(true)}
                className="w-full px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-medium rounded-lg transition-colors text-sm"
              >
                Excluir grupo
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Fechar
          </Button>
        </div>
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
    </div>
  );
}
