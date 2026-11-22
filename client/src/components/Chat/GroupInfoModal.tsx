import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import Avatar from "../ui/Avatar";
import ConfirmDialog from "../ui/ConfirmDialog";
import type { Room, PublicUser } from "../../types";

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
    const { t } = useTranslation("chat");
    const navigate = useNavigate();
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

    const roleOf = (p: PublicUser): "creator" | "admin" | "member" => {
        if (p._id === room.createdBy) return "creator";
        if (admins.some((a) => a._id === p._id)) return "admin";
        return "member";
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
            setError(getErrorMessage(err, t("group.leaveError")));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
        }
    };

    return (
        <>
            {createPortal(
        <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={t("group.infoAria")}
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
                                {t("group.infoTitle")}
                            </h2>
                            <p className="text-xs text-noir-text-muted mt-0.5">
                                {t("group.infoSubtitle")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        title={t("group.closeWithEsc")}
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
                                        ? t("group.publicBadge")
                                        : t("group.privateBadge")}
                                </span>
                            </div>
                            <p className="text-xs text-noir-text-muted mt-0.5">
                                {t("group.memberCount", {
                                    count: participants.length,
                                })}
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
                            {t("group.members", {
                                count: participants.length,
                            })}
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
                                                    {t("group.you")}
                                                </span>
                                            )}
                                        </p>
                                        <p
                                            className={`text-[11px] ${
                                                roleOf(p) === "member"
                                                    ? "text-noir-text-muted"
                                                    : roleOf(p) === "creator"
                                                      ? "text-emerald-400"
                                                      : "text-amber-400"
                                            }`}
                                        >
                                            {t(`group.${roleOf(p)}`)}
                                        </p>
                                    </div>
                                    {p._id !== currentUserId && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(`/profile/${p._id}`)
                                            }
                                            title={t("group.viewProfile")}
                                            aria-label={t("group.viewProfileOf", {
                                                name: p.name,
                                            })}
                                            className="flex-shrink-0 p-1.5 rounded-lg text-noir-text-muted hover:text-emerald-400 hover:bg-white/5 transition"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.8}
                                                />
                                            </svg>
                                        </button>
                                    )}
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
                                    ? t("group.leaveBlockedPromote")
                                    : t("group.leaveGroup")
                            }
                            className="w-full px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-medium rounded-xl transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t("group.leaveGroup")}
                        </button>
                        {creatorBlocked && (
                            <p className="text-[11px] text-amber-400/90 mt-1.5 px-1">
                                {participants.length <= 1
                                    ? t("group.soleMemberHint")
                                    : t("group.creatorPromoteHint")}
                            </p>
                        )}
                    </div>
                </div>

                <footer className="border-t border-white/10 pt-4 mt-2 flex items-center justify-between">
                    <span className="text-xs text-noir-text-muted hidden sm:inline-block">
                        {t("group.pressEscPrefix")}{" "}
                        <kbd className="px-1 py-0.5 bg-black/40 border border-white/10 rounded font-mono text-[10px] text-noir-text-muted">
                            esc
                        </kbd>{" "}
                        {t("group.pressEscSuffix")}
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-noir-text-muted hover:text-white hover:bg-white/5 transition"
                        >
                            {t("group.closeAction")}
                        </button>
                    </div>
                </footer>
            </div>

            <ConfirmDialog
                isOpen={confirmLeave}
                title={t("group.leaveConfirmTitle")}
                message={t("group.leaveConfirmMessage", {
                    name: room.name,
                })}
                confirmLabel={
                    leaving ? t("group.leaving") : t("group.leave")
                }
                danger
                onCancel={() => setConfirmLeave(false)}
                onConfirm={handleLeave}
            />
        </div>,
        document.body,
    )}
        </>
    );
}
