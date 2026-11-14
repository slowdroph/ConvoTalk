import { useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { getErrorMessage } from "../../../utils/errors";
import type { Comment } from "../../../types";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import CommentItem from "./CommentItem";
import { usePostComments } from "../hooks/usePostComments";

const MAX_CONTENT = 500;

interface PostCommentsProps {
    postId: string;
    postAuthorId?: string;
    currentUserId?: string;
    onCommentCountChange?: (commentCount: number) => void;
    onOpenAuthor: (author: NonNullable<Comment["author"]>) => void;
}

export default function PostComments({
    postId,
    postAuthorId,
    currentUserId,
    onCommentCountChange,
    onOpenAuthor,
}: PostCommentsProps) {
    const { showToast } = useToast();
    const {
        comments,
        loading,
        loadingMore,
        error,
        hasMore,
        load,
        loadMore,
        retryLoadMore,
        addComment,
        removeComment,
    } = usePostComments(postId, true);

    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<Comment | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = content.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        try {
            const count = await addComment(trimmed);
            setContent("");
            onCommentCountChange?.(count);
        } catch (err) {
            showToast({
                type: "error",
                message: getErrorMessage(err, "Não foi possível comentar."),
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return;

        setDeleting(true);
        try {
            const count = await removeComment(pendingDelete._id);
            onCommentCountChange?.(count);
            setPendingDelete(null);
            showToast({ type: "success", message: "Comentário excluído." });
        } catch (err) {
            showToast({
                type: "error",
                message: getErrorMessage(
                    err,
                    "Não foi possível excluir o comentário.",
                ),
            });
        } finally {
            setDeleting(false);
        }
    };

    const canDelete = (comment: Comment) =>
        Boolean(currentUserId) &&
        (comment.author?._id === currentUserId ||
            postAuthorId === currentUserId);

    return (
        <section
            aria-label="Comentários"
            className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-noir-border/70 dark:bg-noir-surface-alt/20 sm:px-5"
        >
            <form onSubmit={handleSubmit} className="flex items-start gap-2">
                <textarea
                    value={content}
                    onChange={(event) =>
                        setContent(event.target.value.slice(0, MAX_CONTENT))
                    }
                    rows={2}
                    maxLength={MAX_CONTENT}
                    placeholder="Escreva um comentário..."
                    aria-label="Escrever comentário"
                    className="min-h-[44px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-bright dark:placeholder:text-noir-text-muted"
                />
                <button
                    type="submit"
                    disabled={!content.trim() || submitting}
                    className="min-h-[44px] shrink-0 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting ? "..." : "Enviar"}
                </button>
            </form>

            {loading && comments.length === 0 && (
                <div className="flex justify-center py-4">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </div>
            )}

            {!loading && error && comments.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-3 text-center">
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={() => void load()}
                        className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            {!loading && !error && comments.length === 0 && (
                <p className="py-3 text-center text-xs text-slate-500 dark:text-noir-text-muted">
                    Nenhum comentário ainda. Seja o primeiro a comentar.
                </p>
            )}

            {comments.length > 0 && (
                <ul className="mt-2 divide-y divide-slate-100 dark:divide-noir-border/50">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment._id}
                            comment={comment}
                            canDelete={canDelete(comment)}
                            onDelete={setPendingDelete}
                            onOpenAuthor={onOpenAuthor}
                        />
                    ))}
                </ul>
            )}

            {hasMore && (
                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={() => void loadMore()}
                        disabled={loadingMore}
                        className="text-xs font-medium text-emerald-700 hover:underline disabled:opacity-60 dark:text-emerald-400"
                    >
                        {loadingMore
                            ? "Carregando..."
                            : "Carregar mais comentários"}
                    </button>
                </div>
            )}

            {error && comments.length > 0 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={retryLoadMore}
                        className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                title="Excluir comentário"
                message="Esta ação não pode ser desfeita. Deseja excluir este comentário?"
                confirmLabel={deleting ? "Excluindo..." : "Excluir"}
                danger
                onConfirm={handleConfirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </section>
    );
}
