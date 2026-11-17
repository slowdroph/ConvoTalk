import FeedList from "../../feed/components/FeedList";
import { useProfilePosts } from "../hooks/useProfilePosts";

interface ProfilePublicationsTabProps {
    profileUserId: string;
    profileName: string;
    isSelf: boolean;
    currentUserId?: string;
    onOpenAuthor: (authorId: string) => void;
    onStatsChanged: () => void;
}

export default function ProfilePublicationsTab({
    profileUserId,
    profileName,
    isSelf,
    currentUserId,
    onOpenAuthor,
    onStatsChanged,
}: ProfilePublicationsTabProps) {
    const {
        posts,
        loading,
        loadingMore,
        error,
        hasMore,
        load,
        loadMore,
        deletePostById,
        toggleLike,
        toggleSave,
        votePoll,
        setCommentCount,
    } = useProfilePosts(profileUserId, { authored: true });

    return (
        <FeedList
            posts={posts}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            currentUserId={currentUserId}
            wallOwnerId={profileUserId}
            emptyState={{
                title: "Nenhuma publicação",
                description: isSelf
                    ? "Os posts que você publicar no feed aparecerão aqui."
                    : `${profileName} ainda não publicou no feed.`,
            }}
            endLabel="Você chegou ao fim das publicações."
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
    );
}
