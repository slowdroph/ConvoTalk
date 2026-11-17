import type { PublicProfile } from "../../../types";
import FeedComposer from "../../feed/components/FeedComposer";
import FeedList from "../../feed/components/FeedList";
import { useProfilePosts } from "../hooks/useProfilePosts";
import ProfileAboutCard from "./ProfileAboutCard";
import ProfileInterestsCard from "./ProfileInterestsCard";

interface ProfileAboutTabProps {
    profile: PublicProfile;
    profileUserId: string;
    isSelf: boolean;
    currentUserId?: string;
    onEditAbout: () => void;
    onOpenAuthor: (authorId: string) => void;
    onStatsChanged: () => void;
}

export default function ProfileAboutTab({
    profile,
    profileUserId,
    isSelf,
    currentUserId,
    onEditAbout,
    onOpenAuthor,
    onStatsChanged,
}: ProfileAboutTabProps) {
    const {
        posts,
        loading,
        loadingMore,
        error,
        hasMore,
        load,
        loadMore,
        addPost,
        deletePostById,
        toggleLike,
        toggleSave,
        votePoll,
        setCommentCount,
    } = useProfilePosts(profileUserId);

    return (
        <div className="flex flex-col gap-4">
            <ProfileAboutCard
                bio={profile.bio}
                isSelf={isSelf}
                onEdit={onEditAbout}
            />

            <ProfileInterestsCard
                interests={profile.interests}
                isSelf={isSelf}
                onEdit={onEditAbout}
            />

            <div className="flex items-center gap-2 pt-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-noir-text-bright">
                    Mural
                </h2>
            </div>

            <FeedComposer
                profileId={profileUserId}
                variant="compact"
                placeholder={
                    isSelf
                        ? "Escrever algo no seu mural..."
                        : `Escrever algo no mural de ${profile.name}...`
                }
                onCreated={(post) => {
                    addPost(post);
                    onStatsChanged();
                }}
            />

            <FeedList
                posts={posts}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                error={error}
                currentUserId={currentUserId}
                wallOwnerId={profileUserId}
                emptyState={{
                    title: "Mural vazio",
                    description: isSelf
                        ? "Publique algo para começar o seu mural."
                        : `Seja a primeira pessoa a escrever no mural de ${profile.name}.`,
                }}
                endLabel="Você chegou ao fim do mural."
                onLoadMore={() => void loadMore()}
                onRetry={() => void load()}
                onRetryMore={() => void loadMore()}
                onLike={toggleLike}
                onSave={toggleSave}
                onVote={votePoll}
                onDelete={async (postId) => {
                    await deletePostById(postId);
                    onStatsChanged();
                }}
                onCommentCountChange={(postId, commentCount) =>
                    setCommentCount(postId, commentCount)
                }
                onOpenAuthor={(author) => onOpenAuthor(author._id)}
            />
        </div>
    );
}
