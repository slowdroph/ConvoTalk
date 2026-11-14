import { useCallback, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import AppNavTabs from "../components/Navigation/AppNavTabs";
import Avatar from "../components/ui/Avatar";
import UserProfileModal from "../components/ui/UserProfileModal";
import FeedComposer from "../features/feed/components/FeedComposer";
import FeedFilters from "../features/feed/components/FeedFilters";
import FeedList from "../features/feed/components/FeedList";
import FeedProfileCard from "../features/feed/components/FeedProfileCard";
import FeedStatusPill from "../features/feed/components/FeedStatusPill";
import FeedSuggestedMembers from "../features/feed/components/FeedSuggestedMembers";
import SharedPostDialog from "../features/feed/components/SharedPostDialog";
import TrendingTopics from "../features/feed/components/TrendingTopics";
import { useFeed } from "../features/feed/hooks/useFeed";
import { usePostStats } from "../features/feed/hooks/usePostStats";
import { useTrendingTopics } from "../features/feed/hooks/useTrendingTopics";
import type { FeedFilter } from "../features/feed/services/feedApi";
import type { Post } from "../types";

export default function FeedPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { connected } = useSocket();
    const [filter, setFilter] = useState<FeedFilter>("all");
    const [profileUserId, setProfileUserId] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const sharedPostId = searchParams.get("post");

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
        toggleSave,
        setCommentCount,
    } = useFeed(filter);

    const {
        stats,
        loading: statsLoading,
        refresh: refreshStats,
    } = usePostStats();
    const {
        topics,
        loading: topicsLoading,
        error: topicsError,
        refresh: refreshTopics,
    } = useTrendingTopics();

    const isOnline = connected;

    const handleCreated = (post: Post) => {
        addPost(post);
        void refreshStats();
        void refreshTopics();
    };

    const handleDelete = async (postId: string) => {
        await deletePostById(postId);
        void refreshStats();
        void refreshTopics();
    };

    const closeSharedPost = useCallback(() => {
        const next = new URLSearchParams(searchParams);
        next.delete("post");
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);

    return (
        <div className="h-dvh-fallback flex flex-col bg-noir-base pt-[env(safe-area-inset-top)]">
            <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 px-4 py-2.5 backdrop-blur-md transition-all dark:border-noir-border/80 dark:bg-noir-surface/90 lg:px-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                    <Link
                        to="/feed"
                        aria-label="ConvoTalk Feed"
                        className="flex items-center gap-2.5 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white shadow-lg shadow-emerald-600/20">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M4.5 3.75A2.25 2.25 0 002.25 6v9a2.25 2.25 0 002.25 2.25h1.5v3.18a.75.75 0 001.28.53l3.71-3.71h6.01a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H4.5z"
                                    opacity="0.4"
                                />
                                <path d="M8.25 7.5A2.25 2.25 0 0110.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-1.5v3.18a.75.75 0 01-1.28.53L13.01 18.75H10.5A2.25 2.25 0 018.25 16.5V7.5z" />
                            </svg>
                        </span>
                        <span className="hidden items-center gap-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-noir-text-bright sm:flex">
                            ConvoTalk
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-600/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                                v2.0
                            </span>
                        </span>
                    </Link>

                    <AppNavTabs variant="pill" />

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => navigate("/settings")}
                            aria-label="Abrir configurações"
                            title="Configurações"
                            className="rounded-xl border border-transparent p-2 text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-noir-text-muted dark:hover:border-noir-border dark:hover:bg-noir-surface-alt dark:hover:text-noir-text-bright"
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
                <div className="mx-auto grid w-full max-w-7xl grid-cols-12 items-start gap-6 px-4 py-6 pb-20 sm:px-6">
                    <aside className="sticky top-20 hidden flex-col gap-5 self-start lg:col-span-3 lg:flex">
                        {user && (
                            <FeedProfileCard
                                user={user}
                                online={isOnline}
                                stats={stats}
                                statsLoading={statsLoading}
                            />
                        )}
                        <FeedFilters
                            value={filter}
                            onChange={setFilter}
                        />
                    </aside>

                    <section
                        aria-label="Feed"
                        className="col-span-12 flex flex-col gap-4 lg:col-span-6 lg:gap-6"
                    >
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-noir-text-bright">
                                Feed
                            </h1>
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-noir-text-muted">
                                Compartilhe ideias, novidades e imagens com a
                                comunidade.
                            </p>
                        </div>

                        <div className="lg:hidden">
                            <FeedFilters
                                value={filter}
                                onChange={setFilter}
                                variant="chips"
                            />
                        </div>

                        <FeedComposer onCreated={handleCreated} />

                        <FeedList
                            posts={posts}
                            loading={loading}
                            loadingMore={loadingMore}
                            hasMore={hasMore}
                            error={error}
                            currentUserId={user?._id}
                            filter={filter}
                            onLoadMore={() => void loadMore()}
                            onRetry={() => void load()}
                            onRetryMore={retryLoadMore}
                            onLike={toggleLike}
                            onSave={toggleSave}
                            onDelete={handleDelete}
                            onCommentCountChange={(postId, commentCount) =>
                                setCommentCount(postId, commentCount)
                            }
                            onOpenAuthor={(author) =>
                                setProfileUserId(author._id)
                            }
                        />
                    </section>

                    <aside className="sticky top-20 hidden flex-col gap-5 self-start lg:col-span-3 lg:flex">
                        <FeedSuggestedMembers
                            onOpenProfile={(member) =>
                                setProfileUserId(member._id)
                            }
                            onConversationCreated={(roomId) =>
                                navigate(`/chat/${roomId}`)
                            }
                        />

                        <TrendingTopics
                            topics={topics}
                            loading={topicsLoading}
                            error={topicsError}
                            onRetry={() => void refreshTopics()}
                        />

                        <footer className="space-y-1.5 px-2 text-xs text-slate-500 dark:text-noir-text-muted">
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                <Link
                                    to="/privacy"
                                    className="transition-colors hover:text-slate-700 dark:hover:text-slate-300"
                                >
                                    Privacidade
                                </Link>
                                <Link
                                    to="/terms"
                                    className="transition-colors hover:text-slate-700 dark:hover:text-slate-300"
                                >
                                    Termos
                                </Link>
                            </div>
                            <p className="font-mono text-[11px] text-slate-400 dark:text-noir-text-muted/70">
                                © {new Date().getFullYear()} ConvoTalk Inc.
                                Todos os direitos reservados.
                            </p>
                        </footer>
                    </aside>
                </div>
            </main>

            <FeedStatusPill connected={connected} />

            <SharedPostDialog
                postId={sharedPostId}
                currentUserId={user?._id}
                onClose={closeSharedPost}
                onOpenAuthor={(author) => {
                    closeSharedPost();
                    setProfileUserId(author._id);
                }}
            />

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
