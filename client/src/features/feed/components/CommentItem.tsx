import { useTranslation } from "react-i18next";
import { formatTimeAgo } from "../../../utils/format";
import type { Comment } from "../../../types";
import Avatar from "../../../components/ui/Avatar";

interface CommentItemProps {
    comment: Comment;
    canDelete: boolean;
    onDelete: (comment: Comment) => void;
    onOpenAuthor: (author: NonNullable<Comment["author"]>) => void;
}

export default function CommentItem({
    comment,
    canDelete,
    onDelete,
    onOpenAuthor,
}: CommentItemProps) {
    const { t } = useTranslation("feed");
    const pending = comment._id.startsWith("temp-");
    const author = comment.author;

    return (
        <li
            className={`flex gap-2.5 rounded-xl px-2 py-2 transition-opacity ${
                pending ? "opacity-60" : ""
            }`}
        >
            <button
                type="button"
                onClick={() => author && onOpenAuthor(author)}
                disabled={!author}
                aria-label={
                    author
                        ? t("comment.openProfileOf", { name: author.name })
                        : t("comment.authorUnavailable")
                }
                className="shrink-0 rounded-full transition-opacity hover:opacity-90 disabled:cursor-default"
            >
                <Avatar
                    src={author?.avatar}
                    name={author?.name ?? "?"}
                    size="xs"
                />
            </button>

            <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5 text-xs">
                    <button
                        type="button"
                        onClick={() => author && onOpenAuthor(author)}
                        disabled={!author}
                        className="max-w-full truncate text-left font-semibold text-slate-800 hover:underline disabled:cursor-default disabled:hover:no-underline dark:text-noir-text-bright"
                    >
                        {author?.name ?? t("comment.user")}
                    </button>
                    {author?.publicId && (
                        <span className="truncate font-mono text-[10px] text-slate-400 dark:text-noir-text-muted">
                            #{author.publicId}
                        </span>
                    )}
                    <span
                        aria-hidden="true"
                        className="text-slate-300 dark:text-noir-border-light"
                    >
                        •
                    </span>
                    <time
                        dateTime={comment.createdAt}
                        className="shrink-0 text-[11px] text-slate-500 dark:text-noir-text-muted"
                    >
                        {pending
                            ? t("comment.sending")
                            : formatTimeAgo(comment.createdAt)}
                    </time>

                    {canDelete && !pending && (
                        <button
                            type="button"
                            onClick={() => onDelete(comment)}
                            aria-label={t("comment.deleteOf", {
                                name: author?.name ?? t("comment.user"),
                            })}
                            title={t("comment.deleteTitle")}
                            className="ml-auto shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-noir-text-muted dark:hover:bg-red-950/20 dark:hover:text-red-400"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
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

                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-noir-text-bright/90">
                    {comment.content}
                </p>
            </div>
        </li>
    );
}
