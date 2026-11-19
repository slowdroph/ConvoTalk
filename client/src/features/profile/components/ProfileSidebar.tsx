import { useState } from "react";
import type { Post, PublicProfile } from "../../../types";
import Avatar from "../../../components/ui/Avatar";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import CountryFlag from "../../../components/ui/CountryFlag";
import DropdownMenu from "../../../components/ui/DropdownMenu";
import ImageLightbox from "../../../components/ui/ImageLightbox";
import { getCountryName } from "../../../utils/countries";
import { formatMemberSince } from "../../../utils/format";
import { formatLastSeen } from "../../../utils/formatLastSeen";
import { shareLink } from "../../../utils/share";
import { useToast } from "../../../contexts/ToastContext";
import type { ProfileSectionEditor } from "../hooks/useProfileSectionEditor";
import ProfileDetailsEditor from "./ProfileDetailsEditor";
import ProfileLanguagesCard from "./ProfileLanguagesCard";
import ProfileStatusEditor from "./ProfileStatusEditor";

interface ProfileSidebarProps {
    profile: PublicProfile;
    online: boolean;
    isSelf: boolean;
    starting: boolean;
    startError: string | null;
    photos: Post[];
    blocking: boolean;
    photoUploading: boolean;
    editor: ProfileSectionEditor;
    onStartConversation: () => void;
    onOpenGallery: () => void;
    onBlock: () => void;
    onUnblock: () => void;
    onPhotoSelected: (file: File) => void;
    onRemovePhoto: () => void;
}

const MAX_THUMBNAILS = 4;

const menuItemClass =
    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-noir-text-bright dark:hover:bg-noir-surface";

const menuDangerClass =
    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20";

export default function ProfileSidebar({
    profile,
    online,
    isSelf,
    starting,
    startError,
    photos,
    blocking,
    photoUploading,
    editor,
    onStartConversation,
    onOpenGallery,
    onBlock,
    onUnblock,
    onPhotoSelected,
    onRemovePhoto,
}: ProfileSidebarProps) {
    const { showToast } = useToast();
    const [copiedId, setCopiedId] = useState(false);
    const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
    const [removePhotoConfirmOpen, setRemovePhotoConfirmOpen] = useState(false);

    const profilePhoto = profile.avatar || null;
    const thumbnails = photos.slice(0, MAX_THUMBNAILS);
    const remaining = Math.max(0, photos.length - MAX_THUMBNAILS);
    const blockedByMe = Boolean(profile.blockedByMe);

    const profileUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/profile/${profile._id}`
            : "";

    const copyText = async (value: string, success: string) => {
        try {
            await navigator.clipboard.writeText(value);
            showToast({ type: "success", message: success });
            return true;
        } catch {
            showToast({
                type: "error",
                message: "Não foi possível copiar.",
            });
            return false;
        }
    };

    const handleCopyId = async () => {
        if (!profile.publicId) return;
        const ok = await copyText(`#${profile.publicId}`, "ID copiado.");
        if (ok) {
            setCopiedId(true);
            window.setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const handleCopyLink = () => {
        void copyText(profileUrl, "Link do perfil copiado.");
    };

    const handleShareProfile = async () => {
        const result = await shareLink({
            title: `Perfil de ${profile.name} no ConvoTalk`,
            text: `Confira o perfil de ${profile.name}`,
            url: profileUrl,
        });

        if (result === "copied") {
            showToast({
                type: "success",
                message: "Link do perfil copiado.",
            });
        } else if (result === "failed") {
            showToast({
                type: "error",
                message: "Não foi possível compartilhar o perfil.",
            });
        }
    };

    return (
        <section
            aria-label={`Perfil de ${profile.name}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-noir-border dark:bg-noir-surface"
        >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 lg:aspect-[4/3]">
                {profilePhoto ? (
                    <img
                        src={profilePhoto}
                        alt={`Foto de perfil de ${profile.name}`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Avatar
                            name={profile.name}
                            size="lg"
                            className="ring-4 ring-white/20"
                        />
                    </div>
                )}

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
                />

                <span
                    className={`absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm ${
                        online ? "" : "text-white/80"
                    }`}
                >
                    <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full ${
                            online
                                ? "animate-pulse bg-emerald-400"
                                : "bg-slate-300"
                        }`}
                    />
                    {online ? "Online agora" : "Offline"}
                </span>

                {profilePhoto && (
                    <ImageLightbox
                        src={profilePhoto}
                        alt={`Foto de perfil de ${profile.name}`}
                        triggerLabel="Expandir foto de perfil"
                        className="absolute right-2 top-2 inline-flex items-center justify-center rounded-lg bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d="M4 8V4h4m8 0h4v4m0 8v4h-4M8 20H4v-4"
                            />
                        </svg>
                    </ImageLightbox>
                )}

                {isSelf && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                        <label
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75 ${
                                photoUploading
                                    ? "cursor-wait opacity-70"
                                    : ""
                            }`}
                        >
                            {photoUploading ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.8}
                                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.8}
                                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            )}
                            Alterar foto
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={photoUploading}
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    event.target.value = "";
                                    if (file) onPhotoSelected(file);
                                }}
                            />
                        </label>

                        {profile.avatar && (
                            <button
                                type="button"
                                onClick={() => setRemovePhotoConfirmOpen(true)}
                                disabled={photoUploading}
                                aria-label="Remover foto"
                                title="Remover foto"
                                className="inline-flex items-center justify-center rounded-lg bg-black/55 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/75 disabled:opacity-60"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.8}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {thumbnails.length > 0 && (
                <div className="grid grid-cols-5 gap-1.5 border-b border-slate-200 bg-slate-50 p-2 dark:border-noir-border dark:bg-noir-surface-alt/50">
                    {thumbnails.map((post) => (
                        <ImageLightbox
                            key={post._id}
                            src={post.image?.url ?? ""}
                            alt={
                                post.content
                                    ? post.content.slice(0, 60)
                                    : "Miniatura da galeria"
                            }
                            className="group relative block aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-noir-border dark:bg-noir-surface-alt"
                            imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ))}

                    {remaining > 0 ? (
                        <button
                            type="button"
                            onClick={onOpenGallery}
                            aria-label={`Ver as ${photos.length} fotos da galeria`}
                            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm font-bold text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-muted dark:hover:border-emerald-500/60 dark:hover:text-emerald-400"
                        >
                            +{remaining}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onOpenGallery}
                            aria-label="Abrir galeria de fotos"
                            title="Abrir galeria de fotos"
                            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-400 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-muted dark:hover:border-emerald-500/60 dark:hover:text-emerald-400"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            <div className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-noir-text-bright">
                        {profile.name}
                    </h1>
                    {profile.age != null && (
                        <span
                            title={`${profile.age} anos`}
                            className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                        >
                            {profile.age} anos
                        </span>
                    )}
                    {profile.country && (
                        <CountryFlag
                            country={profile.country}
                            name={getCountryName(profile.country)}
                            className="h-3.5 w-5"
                        />
                    )}
                </div>

                {profile.publicId && (
                    <button
                        type="button"
                        onClick={handleCopyId}
                        title="Copiar ID único"
                        aria-label="Copiar ID"
                        className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500 transition-colors hover:border-emerald-500/40 hover:text-emerald-600 dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-muted dark:hover:text-emerald-400"
                    >
                        <span>#{profile.publicId}</span>
                        {copiedId ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-emerald-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                        )}
                    </button>
                )}

                <div className="mt-1 space-y-1">
                    <ProfileStatusEditor
                        status={profile.status}
                        isSelf={isSelf}
                        editor={editor}
                    />

                    <ProfileDetailsEditor
                        profile={profile}
                        isSelf={isSelf}
                        editor={editor}
                    />
                </div>

                {blockedByMe && !isSelf && (
                    <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                        Você bloqueou este usuário. Desbloqueie para conversar
                        e ver as publicações.
                    </p>
                )}

                {startError && (
                    <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                        {startError}
                    </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                    {isSelf && (
                        <button
                            type="button"
                            onClick={() => void handleShareProfile()}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-bright dark:hover:bg-noir-border"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.632l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                                />
                            </svg>
                            Compartilhar perfil
                        </button>
                    )}

                    {!isSelf &&
                        (blockedByMe ? (
                        <button
                            type="button"
                            onClick={onUnblock}
                            disabled={blocking}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-600/30 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40"
                        >
                            {blocking ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400" />
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.8}
                                        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                    />
                                </svg>
                            )}
                            Desbloquear
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onStartConversation}
                            disabled={starting}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {starting ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.8}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            )}
                            Conversar
                        </button>
                    ))}

                    <DropdownMenu
                        align="right"
                        trigger={(props) => (
                            <button
                                {...props}
                                type="button"
                                aria-label="Mais ações do perfil"
                                title="Mais ações"
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:border-emerald-500/40 hover:text-emerald-600 dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-muted dark:hover:text-emerald-400"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <circle cx="5" cy="12" r="1.6" />
                                    <circle cx="12" cy="12" r="1.6" />
                                    <circle cx="19" cy="12" r="1.6" />
                                </svg>
                            </button>
                        )}
                    >
                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleCopyLink}
                            className={menuItemClass}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5"
                                />
                            </svg>
                            Copiar link do perfil
                        </button>
                        {!isSelf && (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    if (blockedByMe) {
                                        onUnblock();
                                    } else {
                                        setBlockConfirmOpen(true);
                                    }
                                }}
                                disabled={blocking}
                                className={menuDangerClass}
                            >
                                {blockedByMe ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.8}
                                            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.8}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                )}
                                {blockedByMe ? "Desbloquear" : "Bloquear"}
                            </button>
                        )}
                    </DropdownMenu>
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-noir-border">
                <ProfileLanguagesCard
                    languages={profile.languages}
                    languageLevels={profile.languageLevels}
                    isSelf={isSelf}
                    editor={editor}
                />
            </div>

            <dl className="grid grid-cols-2 gap-2 border-t border-slate-200 px-5 py-4 dark:border-noir-border">
                <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 text-center dark:border-noir-border/60 dark:bg-noir-surface-alt/60">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-noir-text-muted">
                        Membro desde
                    </dt>
                    <dd className="mt-1 text-xs font-semibold text-slate-900 dark:text-noir-text-bright">
                        {profile.createdAt
                            ? formatMemberSince(profile.createdAt)
                            : "—"}
                    </dd>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 text-center dark:border-noir-border/60 dark:bg-noir-surface-alt/60">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-noir-text-muted">
                        Último acesso
                    </dt>
                    <dd className="mt-1 text-xs font-semibold text-slate-900 dark:text-noir-text-bright">
                        {online
                            ? "Agora"
                            : profile.lastSeen
                              ? formatLastSeen(profile.lastSeen).replace(
                                    /^Visto /,
                                    "",
                                )
                              : "—"}
                    </dd>
                </div>
            </dl>

            <ConfirmDialog
                isOpen={removePhotoConfirmOpen}
                title="Remover foto?"
                message="Sua foto de perfil será removida. Você pode enviar outra depois."
                confirmLabel="Remover"
                danger
                onConfirm={() => {
                    setRemovePhotoConfirmOpen(false);
                    onRemovePhoto();
                }}
                onCancel={() => setRemovePhotoConfirmOpen(false)}
            />

            <ConfirmDialog
                isOpen={blockConfirmOpen}
                title="Bloquear usuário"
                message={`${profile.name} não poderá enviar mensagens, comentar ou aparecer no seu feed. Você pode desbloquear depois.`}
                confirmLabel="Bloquear"
                danger
                onConfirm={() => {
                    setBlockConfirmOpen(false);
                    onBlock();
                }}
                onCancel={() => setBlockConfirmOpen(false)}
            />
        </section>
    );
}
