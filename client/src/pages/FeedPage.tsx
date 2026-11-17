import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import AppFooter from "../components/Navigation/AppFooter";
import AppHeader from "../components/Navigation/AppHeader";
import FeedComposer from "../features/feed/components/FeedComposer";
import FeedFilters from "../features/feed/components/FeedFilters";
import FeedList from "../features/feed/components/FeedList";
import FeedProfileCard from "../features/feed/components/FeedProfileCard";
import FeedSearchBar from "../features/feed/components/FeedSearchBar";
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
    const [searchParams, setSearchParams] = useSearchParams();
    const sharedPostId = searchParams.get("post");
    const query = searchParams.get("q") ?? "";
    const activeQuery = query.trim().length >= 2 ? query : "";

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
        votePoll,
        setCommentCount,
    } = useFeed(filter, { query });

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

    const updateQuery = useCallback(
        (value: string) => {
            const trimmed = value.trim();
            const next = new URLSearchParams(searchParams);
            if (trimmed) {
                next.set("q", trimmed);
            } else {
                next.delete("q");
            }
            setSearchParams(next, { replace: true });
        },
        [searchParams, setSearchParams],
    );

    const handleFilterChange = (next: FeedFilter) => {
        setFilter(next);
        if (next === "saved" && query) {
            updateQuery("");
        }
    };

    const handleSelectTopic = (tag: string) => {
        if (filter === "saved") {
            setFilter("all");
        }
        updateQuery(tag);
    };

    return (
        <div className="h-dvh-fallback flex flex-col bg-noir-base pt-[env(safe-area-inset-top)]">
            <AppHeader />

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
                            onChange={handleFilterChange}
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
                                onChange={handleFilterChange}
                                variant="chips"
                            />
                        </div>

                        <FeedComposer onCreated={handleCreated} />

                        <FeedSearchBar value={query} onSearch={updateQuery} />

                        <FeedList
                            posts={posts}
                            loading={loading}
                            loadingMore={loadingMore}
                            hasMore={hasMore}
                            error={error}
                            currentUserId={user?._id}
                            filter={filter}
                            query={activeQuery}
                            onLoadMore={() => void loadMore()}
                            onRetry={() => void load()}
                            onRetryMore={retryLoadMore}
                            onLike={toggleLike}
                            onSave={toggleSave}
                            onVote={votePoll}
                            onDelete={handleDelete}
                            onCommentCountChange={(postId, commentCount) =>
                                setCommentCount(postId, commentCount)
                            }
                            onOpenAuthor={(author) =>
                                navigate(
                                    author._id === user?._id
                                        ? "/profile"
                                        : `/profile/${author._id}`,
                                )
                            }
                        />
                    </section>

                    <aside className="sticky top-20 hidden flex-col gap-5 self-start lg:col-span-3 lg:flex">
                        <FeedSuggestedMembers
                            onOpenProfile={(member) =>
                                navigate(`/profile/${member._id}`)
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
                            onSelectTopic={handleSelectTopic}
                        />

                        <AppFooter />
                    </aside>
                </div>
            </main>

            <SharedPostDialog
                postId={sharedPostId}
                currentUserId={user?._id}
                onClose={closeSharedPost}
                onOpenAuthor={(author) => {
                    closeSharedPost();
                    navigate(
                        author._id === user?._id
                            ? "/profile"
                            : `/profile/${author._id}`,
                    );
                }}
            />
        </div>
    );
}
