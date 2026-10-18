import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import Avatar from "./Avatar";
import CountryFlag from "./CountryFlag";
import { getCountryName } from "../../utils/countries";
import { formatLastSeen } from "../../utils/formatLastSeen";
import { formatMemberSince } from "../../utils/format";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { createDirectRoom } from "../../services/rooms";
import { getErrorMessage } from "../../utils/errors";
import api from "../../services/api";
import type { PublicProfile, PublicUser } from "../../types";

interface UserProfileModalProps {
    isOpen: boolean;
    userId: string | null;
    onClose: () => void;
    onConversationCreated: (roomId: string) => void;
    initialUser?: PublicUser;
    hideStartConversation?: boolean;
}

function statusOf(err: unknown): number | undefined {
    if (err && typeof err === "object" && "response" in err) {
        return (err as { response?: { status?: number } }).response?.status;
    }
    return undefined;
}

export default function UserProfileModal({
    isOpen,
    userId,
    onClose,
    onConversationCreated,
    initialUser,
    hideStartConversation = false,
}: UserProfileModalProps) {
    const { onlineUsers } = useSocket();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [unavailable, setUnavailable] = useState(false);
    const [startError, setStartError] = useState("");
    const [starting, setStarting] = useState(false);

    const requestKey = isOpen && userId ? userId : null;
    const [prevKey, setPrevKey] = useState<string | null>(null);
    if (prevKey !== requestKey) {
        setPrevKey(requestKey);
        setProfile(null);
        setLoading(requestKey !== null);
        setError("");
        setUnavailable(false);
        setStartError("");
        setStarting(false);
    }

    useEffect(() => {
        if (!isOpen || !userId) return;
        let active = true;

        api.get<PublicProfile>(`/user/${userId}/profile`)
            .then(({ data }) => {
                if (active) setProfile(data);
            })
            .catch((err: unknown) => {
                if (!active) return;
                if (statusOf(err) === 404) {
                    setUnavailable(true);
                } else {
                    setError(getErrorMessage(err, "Erro ao carregar perfil."));
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [isOpen, userId]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
            }
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    if (!isOpen || !userId) return null;

    const isOnline = onlineUsers.some((u) => u.userId === userId);
    const isSelf = currentUser?._id === userId;
    const name = profile?.name ?? initialUser?.name ?? "";
    const avatar = profile?.avatar ?? initialUser?.avatar ?? "";
    const publicId = profile?.publicId ?? initialUser?.publicId ?? "";
    const bio = profile?.status ?? initialUser?.status ?? "";
    const country = profile?.country ?? initialUser?.country ?? "";
    const city = profile?.city ?? "";
    const location = [city, getCountryName(country)].filter(Boolean).join(", ");

    const handleStart = async () => {
        if (starting || isSelf) return;
        setStarting(true);
        setStartError("");
        try {
            const room = await createDirectRoom(userId);
            onClose();
            onConversationCreated(room._id);
        } catch (err: unknown) {
            setStartError(getErrorMessage(err, "Erro ao iniciar conversa."));
            setStarting(false);
        }
    };

    const infoRow = (label: string, value: ReactNode) => (
        <div className="flex items-start justify-between gap-3">
            <dt className="text-xs text-noir-text-muted shrink-0 pt-0.5">
                {label}
            </dt>
            <dd className="text-sm text-noir-text-bright text-right min-w-0">
                {value}
            </dd>
        </div>
    );

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={`Perfil de ${name || "usuário"}`}
        >
            <div
                className="w-full max-w-sm bg-[#111714] border border-emerald-500/30 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <div className="h-20 bg-gradient-to-r from-emerald-900/50 via-emerald-800/20 to-transparent" />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-noir-text-muted hover:text-white hover:bg-white/10 transition"
                    >
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

                    <div className="-mt-11 px-6 flex flex-col items-center text-center">
                        <div className="relative">
                            <Avatar src={avatar} name={name || "?"} size="lg" />
                            <span
                                className={`absolute bottom-1 right-1 w-4 h-4 border-2 border-[#111714] rounded-full ${
                                    isOnline ? "bg-emerald-500" : "bg-zinc-500"
                                }`}
                            />
                        </div>
                        <h2 className="mt-3 text-lg font-bold text-white truncate max-w-full">
                            {name || "Usuário"}
                        </h2>
                        {publicId && (
                            <p className="text-zinc-500 text-xs font-mono">
                                #{publicId}
                            </p>
                        )}
                        {bio && (
                            <p className="mt-2 text-sm text-noir-text-bright/80 break-words">
                                {bio}
                            </p>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 mt-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-5">
                            <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <p className="text-center text-sm text-red-400 py-3">
                            {error}
                        </p>
                    ) : unavailable ? (
                        <p className="text-center text-sm text-noir-text-muted py-3">
                            Perfil indisponível.
                        </p>
                    ) : (
                        <dl className="space-y-3">
                            {infoRow(
                                "Status",
                                <span
                                    className={
                                        isOnline
                                            ? "text-green-400"
                                            : "text-noir-text-muted"
                                    }
                                >
                                    {isOnline
                                        ? "Online"
                                        : profile?.lastSeen
                                          ? formatLastSeen(profile.lastSeen)
                                          : "Offline"}
                                </span>,
                            )}
                            {location &&
                                infoRow(
                                    "Localização",
                                    <span className="inline-flex items-center gap-1.5 justify-end">
                                        {country && (
                                            <CountryFlag
                                                country={country}
                                                name={getCountryName(country)}
                                                className="w-4 h-3"
                                            />
                                        )}
                                        {location}
                                    </span>,
                                )}
                            {profile?.createdAt &&
                                infoRow(
                                    "Membro desde",
                                    formatMemberSince(profile.createdAt),
                                )}
                        </dl>
                    )}
                </div>

                <div className="px-6 pb-5">
                    {startError && (
                        <p className="text-center text-xs text-red-400 mb-2">
                            {startError}
                        </p>
                    )}
                    {!isSelf && !hideStartConversation && (
                        <button
                            type="button"
                            onClick={handleStart}
                            disabled={starting || unavailable}
                            title={
                                unavailable
                                    ? "Perfil indisponível"
                                    : "Iniciar conversa"
                            }
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-300 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {starting ? (
                                <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.8}
                                        />
                                    </svg>
                                    Iniciar conversa
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
