import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../utils/errors";
import { createDirectRoom } from "../services/rooms";
import AppFooter from "../components/Navigation/AppFooter";
import ProfileAboutDialog from "../features/profile/components/ProfileAboutDialog";
import ProfileAboutTab from "../features/profile/components/ProfileAboutTab";
import ProfileGallery from "../features/profile/components/ProfileGallery";
import ProfilePublicationsTab from "../features/profile/components/ProfilePublicationsTab";
import ProfileSidebar from "../features/profile/components/ProfileSidebar";
import ProfileTabs, {
    type ProfileTab,
} from "../features/profile/components/ProfileTabs";
import { useProfile, useProfileGallery } from "../features/profile/hooks/useProfile";
import {
    blockUser as blockUserRequest,
    removeAvatar as removeAvatarRequest,
    unblockUser as unblockUserRequest,
    updateAvatar as updateAvatarRequest,
} from "../features/profile/services/profileApi";
import type { User } from "../types";

export default function ProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const { onlineUsers } = useSocket();
    const { showToast } = useToast();

    const profileUserId = userId ?? user?._id ?? null;
    const isSelf = Boolean(
        user && profileUserId && user._id === profileUserId,
    );

    const {
        profile,
        stats,
        loading,
        statsLoading,
        error,
        notFound,
        refreshStats,
        reload,
    } = useProfile(profileUserId);

    const contentHidden = Boolean(profile?.blockedByMe) && !isSelf;

    const {
        images,
        loading: galleryLoading,
        error: galleryError,
    } = useProfileGallery(
        contentHidden ? null : profileUserId,
        stats?.photoCount ?? 0,
    );

    const [tab, setTab] = useState<ProfileTab>("about");
    const [aboutOpen, setAboutOpen] = useState(false);
    const [starting, setStarting] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);
    const [blocking, setBlocking] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);

    const isOnline = Boolean(
        profileUserId &&
            onlineUsers.some((online) => online.userId === profileUserId),
    );

    const goToProfile = (authorId: string) => {
        navigate(authorId === user?._id ? "/profile" : `/profile/${authorId}`);
    };

    const handleStartConversation = async () => {
        if (!profileUserId || starting) return;
        setStarting(true);
        setStartError(null);
        try {
            const room = await createDirectRoom(profileUserId);
            navigate(`/chat/${room._id}`);
        } catch (err) {
            setStartError(
                getErrorMessage(err, "Erro ao iniciar conversa."),
            );
        } finally {
            setStarting(false);
        }
    };

    const handleAboutSaved = (updated: User) => {
        updateUser(updated);
        reload();
    };

    const handleBlock = async () => {
        if (!profileUserId || blocking) return;
        setBlocking(true);
        try {
            await blockUserRequest(profileUserId);
            showToast({
                type: "success",
                message: "Usuário bloqueado.",
            });
            reload();
        } catch (err) {
            showToast({
                type: "error",
                message: getErrorMessage(err, "Erro ao bloquear usuário."),
            });
        } finally {
            setBlocking(false);
        }
    };

    const handleUnblock = async () => {
        if (!profileUserId || blocking) return;
        setBlocking(true);
        try {
            await unblockUserRequest(profileUserId);
            showToast({
                type: "success",
                message: "Usuário desbloqueado.",
            });
            reload();
        } catch (err) {
            showToast({
                type: "error",
                message: getErrorMessage(err, "Erro ao desbloquear usuário."),
            });
        } finally {
            setBlocking(false);
        }
    };

    const handlePhotoSelected = async (file: File) => {
        if (photoUploading) return;
        if (!file.type.startsWith("image/")) {
            showToast({
                type: "error",
                message: "Selecione um arquivo de imagem.",
            });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast({
                type: "error",
                message: "A imagem deve ter no máximo 5 MB.",
            });
            return;
        }
        setPhotoUploading(true);
        try {
            const updated = await updateAvatarRequest(file);
            updateUser(updated);
            showToast({ type: "success", message: "Foto atualizada." });
            reload();
        } catch (err) {
            showToast({
                type: "error",
                message: getErrorMessage(err, "Erro ao atualizar a foto."),
            });
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (photoUploading) return;
        setPhotoUploading(true);
        try {
            const updated = await removeAvatarRequest();
            updateUser(updated);
            showToast({ type: "success", message: "Foto removida." });
            reload();
        } catch (err) {
            showToast({
                type: "error",
                message: getErrorMessage(err, "Erro ao remover a foto."),
            });
        } finally {
            setPhotoUploading(false);
        }
    };

    if (!profileUserId) {
        return (
            <div className="flex h-full min-h-0 flex-col bg-noir-base">
                <main className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500 dark:text-noir-text-muted">
                    Carregando perfil...
                </main>
            </div>
        );
    }

    if (loading && !profile) {
        return (
            <div className="flex h-full min-h-0 flex-col bg-noir-base">
                <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="mx-auto grid w-full max-w-6xl grid-cols-12 items-start gap-6 px-4 py-6 pb-8 sm:px-6">
                        <aside className="col-span-12 lg:col-span-4">
                            <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-noir-surface" />
                        </aside>
                        <section className="col-span-12 space-y-4 lg:col-span-8">
                            <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-noir-surface" />
                            <div className="h-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-noir-surface" />
                        </section>
                    </div>
                </main>
            </div>
        );
    }

    if (notFound || error || !profile) {
        return (
            <div className="flex h-full min-h-0 flex-col bg-noir-base">
                <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-noir-text-bright">
                        {notFound
                            ? "Perfil não encontrado."
                            : (error ?? "Não foi possível carregar o perfil.")}
                    </p>
                    <div className="flex items-center gap-2">
                        {error && (
                            <button
                                type="button"
                                onClick={reload}
                                className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-bright dark:hover:bg-noir-border"
                            >
                                Tentar novamente
                            </button>
                        )}
                        <Link
                            to="/feed"
                            className="rounded-lg border border-emerald-700/30 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                        >
                            Voltar ao feed
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col bg-noir-base">
            <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="mx-auto grid w-full max-w-6xl grid-cols-12 items-start gap-6 px-4 py-6 pb-20 sm:px-6">
                    <aside className="col-span-12 self-start lg:sticky lg:top-6 lg:col-span-4">
                        <ProfileSidebar
                            profile={profile}
                            online={isOnline}
                            isSelf={isSelf}
                            starting={starting}
                            startError={startError}
                            photos={images}
                            blocking={blocking}
                            photoUploading={photoUploading}
                            onStartConversation={() =>
                                void handleStartConversation()
                            }
                            onEditAbout={() => setAboutOpen(true)}
                            onOpenGallery={() => setTab("gallery")}
                            onBlock={() => void handleBlock()}
                            onUnblock={() => void handleUnblock()}
                            onPhotoSelected={(file) =>
                                void handlePhotoSelected(file)
                            }
                            onRemovePhoto={() => void handleRemovePhoto()}
                        />
                    </aside>

                    <section
                        aria-label={`Perfil de ${profile.name}`}
                        className="col-span-12 flex flex-col gap-4 lg:col-span-8"
                    >
                        {contentHidden ? (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-6 py-10 text-center">
                                <p className="text-sm font-semibold text-slate-800 dark:text-noir-text-bright">
                                    Conteúdo oculto
                                </p>
                                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-noir-text-muted">
                                    Você bloqueou {profile.name}. Desbloqueie
                                    para ver as publicações, as fotos e o mural
                                    deste perfil.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => void handleUnblock()}
                                    disabled={blocking}
                                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-red-600/30 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40"
                                >
                                    {blocking ? (
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400" />
                                    ) : null}
                                    Desbloquear
                                </button>
                            </div>
                        ) : (
                            <>
                                <ProfileTabs
                                    active={tab}
                                    onChange={setTab}
                                    postCount={stats?.postCount ?? 0}
                                    authoredCount={stats?.authoredCount ?? 0}
                                    photoCount={stats?.photoCount ?? 0}
                                    loading={statsLoading}
                                />

                                <div
                                    role="tabpanel"
                                    id="profile-tabpanel"
                                    aria-labelledby={`profile-tab-${tab}`}
                                    className="flex flex-col gap-4"
                                >
                                    {tab === "about" && (
                                        <ProfileAboutTab
                                            profile={profile}
                                            profileUserId={profileUserId}
                                            isSelf={isSelf}
                                            currentUserId={user?._id}
                                            onEditAbout={() =>
                                                setAboutOpen(true)
                                            }
                                            onOpenAuthor={goToProfile}
                                            onStatsChanged={() =>
                                                void refreshStats()
                                            }
                                        />
                                    )}

                                    {tab === "publications" && (
                                        <ProfilePublicationsTab
                                            profileUserId={profileUserId}
                                            profileName={profile.name}
                                            isSelf={isSelf}
                                            currentUserId={user?._id}
                                            onOpenAuthor={goToProfile}
                                            onStatsChanged={() =>
                                                void refreshStats()
                                            }
                                        />
                                    )}

                                    {tab === "gallery" && (
                                        <ProfileGallery
                                            images={images}
                                            loading={galleryLoading}
                                            error={galleryError}
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        <AppFooter className="pt-2" />
                    </section>
                </div>
            </main>

            <ProfileAboutDialog
                isOpen={aboutOpen}
                bio={profile.bio ?? ""}
                interests={profile.interests ?? []}
                gender={profile.gender ?? ""}
                birthdate={profile.birthdate ?? ""}
                country={profile.country ?? ""}
                city={profile.city ?? ""}
                languages={profile.languages ?? []}
                languageLevels={profile.languageLevels ?? {}}
                status={profile.status ?? ""}
                onClose={() => setAboutOpen(false)}
                onSaved={handleAboutSaved}
            />
        </div>
    );
}
