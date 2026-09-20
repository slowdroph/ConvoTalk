import { useState } from "react";
import { createPortal } from "react-dom";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import Avatar from "../ui/Avatar";
import ConfirmDialog from "../ui/ConfirmDialog";
import type { Room, Participant } from "../../types";

interface GroupInfoModalProps {
    isOpen: boolean;
    room: Room;
    currentUserId: string | null;
    onClose: () => void;
    onLeft: (roomId: string) => void;
}

export default function GroupInfoModal({
    isOpen,
    room,
    currentUserId,
    onClose,
    onLeft,
}: GroupInfoModalProps) {
    const [leaving, setLeaving] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const participants = room.participants ?? [];
    const admins = room.admins ?? [];
    const isCreator = !!currentUserId && room.createdBy === currentUserId;
    const otherAdmins = admins.filter((a) => a._id !== currentUserId);
    const creatorBlocked =
        isCreator && (participants.length <= 1 || otherAdmins.length === 0);

    const roleOf = (p: Participant) => {
        if (p._id === room.createdBy) return "Criador";
        if (admins.some((a) => a._id === p._id)) return "Administrador";
        return "Membro";
    };

    const handleLeave = async () => {
        if (leaving || creatorBlocked) return;
        setLeaving(true);
        setError("");
        try {
            await api.post(`/rooms/${room._id}/leave`);
            setConfirmLeave(false);
            setLeaving(false);
            onLeft(room._id);
            onClose();
        } catch (err: unknown) {
            setLeaving(false);
            setConfirmLeave(false);
            setError(getErrorMessage(err, "Erro ao sair do grupo"));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label="Informações do grupo"
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
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                Informações do grupo
                            </h2>
                            <p className="text-xs text-noir-text-muted mt-0.5">
                                Detalhes, membros e saída.
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
                                src={room.avatar}
                                name={room.name}
                                size="lg"
                            />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white truncate">
                                    {room.name}
                                </h3>
                                <span
                                    className={`text-[10px] border px-1.5 py-0.2 rounded font-mono shrink-0 ${
                                        (room.visibility ?? "private") ===
                                        "public"
                                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/30"
                                            : "bg-white/5 text-noir-text-muted border-white/10"
                                    }`}
                                >
                                    {(room.visibility ?? "private") ===
                                    "public"
                                        ? "PÚBLICO"
                                        : "PRIVADO"}
                                </span>
                            </div>
                            <p className="text-xs text-noir-text-muted mt-0.5">
                                {participants.length} participante
                                {participants.length === 1 ? "" : "s"}
                            </p>
                        </div>
                    </div>

                    {room.description && (
                        <p className="text-sm text-noir-text-bright/80 bg-[#090f09] border border-white/10 rounded-xl px-3.5 py-2.5">
                            {room.description}
                        </p>
                    )}

                    <div>
                        <span className="block text-[11px] font-semibold tracking-wider text-noir-text-muted uppercase mb-1.5">
                            Membros ({participants.length})
                        </span>
                        <ul className="border border-white/10 rounded-xl bg-[#090f09]/80 divide-y divide-white/5 overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
                            {participants.map((p) => (
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
                                            {p._id === currentUserId && (
                                                <span className="text-noir-text-muted font-normal">
                                                    {" "}
                                                    (você)
                                                </span>
                                            )}
                                        </p>
                                        <p
                                            className={`text-[11px] ${
                                                roleOf(p) === "Membro"
                                                    ? "text-noir-text-muted"
                                                    : roleOf(p) === "Criador"
                                                      ? "text-emerald-400"
                                                      : "text-amber-400"
                                            }`}
                                        >
                                            {roleOf(p)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => setConfirmLeave(true)}
                            disabled={creatorBlocked}
                            title={
                                creatorBlocked
                                    ? "Promova um administrador antes de sair do grupo"
                                    : "Sair do grupo"
                            }
                            className="w-full px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-medium rounded-xl transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sair do grupo
                        </button>
                        {creatorBlocked && (
                            <p className="text-[11px] text-amber-400/90 mt-1.5 px-1">
                                {participants.length <= 1
                                    ? "Você é o único membro. Exclua o grupo nas configurações para encerrá-lo."
                                    : "Como criador, promova um administrador antes de sair do grupo."}
                            </p>
                        )}
                    </div>
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
                    </div>
                </footer>
            </div>

            <ConfirmDialog
                isOpen={confirmLeave}
                title="Sair do grupo"
                message={`Tem certeza que deseja sair de "${room.name}"? Você deixará de receber as mensagens do grupo.`}
                confirmLabel={leaving ? "Saindo..." : "Sair"}
                danger
                onCancel={() => setConfirmLeave(false)}
                onConfirm={handleLeave}
            />
        </div>,
        document.body,
    );
}
