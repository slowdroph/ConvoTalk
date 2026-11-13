import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AppNavTabs from "../components/Navigation/AppNavTabs";
import Avatar from "../components/ui/Avatar";
import UserProfileModal from "../components/ui/UserProfileModal";
import FeedComposer from "../features/feed/components/FeedComposer";
import FeedList from "../features/feed/components/FeedList";
import { useFeed } from "../features/feed/hooks/useFeed";

export default function FeedPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profileUserId, setProfileUserId] = useState<string | null>(null);
    const {
        posts,
        loading,
        loadingMore,
        error,
        hasMore,
        load,
        loadMore,
        retryLoadMore,
        addPost,
        deletePostById,
        toggleLike,
    } = useFeed();

    return (
        <div className="h-dvh-fallback flex flex-col bg-noir-base pt-[env(safe-area-inset-top)]">
            <header className="border-b border-noir-border bg-noir-surface/90 backdrop-blur">
                <div className="mx-auto flex max-w-2xl items-center gap-3 px-3 py-2.5">
                    <div className="flex shrink-0 items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-600/20 text-emerald-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM7 8h10M7 12h10M7 16h6"
                                />
                            </svg>
                        </span>
                        <span className="hidden text-sm font-semibold text-noir-text-bright sm:inline">
                            ConvoTalk
                        </span>
                    </div>

                    <AppNavTabs className="flex-1" />

                    <div className="flex shrink-0 items-center gap-1">
                        <button
                            type="button"
                            onClick={() => navigate("/settings")}
                            aria-label="Abrir configurações"
                            title="Configurações"
                            className="rounded-lg p-2 text-noir-text-muted transition-colors hover:bg-noir-surface-alt hover:text-noir-text-bright"
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
                                    strokeWidth={1.8}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/settings")}
                            aria-label="Abrir meu perfil"
                            title={user?.name ?? "Meu perfil"}
                            className="rounded-full transition-opacity hover:opacity-90"
                        >
                            <Avatar
                                src={user?.avatar}
                                name={user?.name ?? "?"}
                                size="sm"
                            />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="mx-auto max-w-2xl space-y-4 px-3 py-4 pb-20">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-noir-text-bright">
                            Feed
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-noir-text-muted">
                            Compartilhe ideias, novidades e imagens com a
                            comunidade.
                        </p>
                    </div>

                    <FeedComposer onCreated={addPost} />

                    <FeedList
                        posts={posts}
                        loading={loading}
                        loadingMore={loadingMore}
                        hasMore={hasMore}
                        error={error}
                        currentUserId={user?._id}
                        onLoadMore={() => void loadMore()}
                        onRetry={() => void load()}
                        onRetryMore={retryLoadMore}
                        onLike={toggleLike}
                        onDelete={deletePostById}
                        onOpenAuthor={(author) =>
                            setProfileUserId(author._id)
                        }
                    />
                </div>
            </main>

            <UserProfileModal
                isOpen={Boolean(profileUserId)}
                userId={profileUserId}
                onClose={() => setProfileUserId(null)}
                onConversationCreated={(roomId) => {
                    setProfileUserId(null);
                    navigate(`/chat/${roomId}`);
                }}
            />
        </div>
    );
}
