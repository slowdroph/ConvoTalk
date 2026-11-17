import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../contexts/ToastContext";
import { getErrorMessage } from "../../../utils/errors";
import type { Post } from "../../../types";
import Avatar from "../../../components/ui/Avatar";
import { createPost } from "../services/feedApi";

const MAX_CONTENT = 2000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_POLL_OPTIONS = 2;
const MAX_POLL_OPTIONS = 4;
const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);
const EMOJIS = [
    "😀",
    "😂",
    "😍",
    "😎",
    "🤔",
    "👍",
    "👏",
    "🙌",
    "🔥",
    "❤️",
    "✨",
    "🎉",
];

interface FeedComposerProps {
    onCreated: (post: Post) => void;
    profileId?: string;
    placeholder?: string;
    variant?: "default" | "compact";
}

interface SelectedImage {
    file: File;
    url: string;
}

export default function FeedComposer({
    onCreated,
    profileId,
    placeholder = "O que você gostaria de compartilhar com a comunidade ConvoTalk?",
    variant = "default",
}: FeedComposerProps) {
    const isCompact = variant === "compact";
    const { user } = useAuth();
    const { showToast } = useToast();
    const [content, setContent] = useState("");
    const [image, setImage] = useState<SelectedImage | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [pollOptions, setPollOptions] = useState<string[] | null>(null);
    const [pollError, setPollError] = useState<string | null>(null);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const imageRef = useRef<SelectedImage | null>(null);
    const clientPostIdRef = useRef<string | null>(null);

    useEffect(() => {
        imageRef.current = image;
    }, [image]);

    useEffect(() => {
        return () => {
            if (imageRef.current) {
                URL.revokeObjectURL(imageRef.current.url);
            }
        };
    }, []);

    const clearImage = () => {
        if (image) URL.revokeObjectURL(image.url);
        clientPostIdRef.current = null;
        setImage(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleContentChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
        clientPostIdRef.current = null;
        setContent(event.target.value.slice(0, MAX_CONTENT));
    };

    const addEmoji = (emoji: string) => {
        setContent((current) => (current + emoji).slice(0, MAX_CONTENT));
        setEmojiOpen(false);
        textareaRef.current?.focus();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
            showToast({
                type: "error",
                message:
                    "Formato de imagem não suportado. Use JPEG, PNG, WebP ou GIF.",
            });
            event.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
            showToast({
                type: "error",
                message: "A imagem deve ter no máximo 5 MB.",
            });
            event.target.value = "";
            return;
        }

        if (image) URL.revokeObjectURL(image.url);
        clientPostIdRef.current = null;
        setImage({ file, url: URL.createObjectURL(file) });
    };

    const canSubmit =
        (content.trim().length > 0 || Boolean(image)) && !submitting;

    const togglePoll = () => {
        setPollError(null);
        setPollOptions((current) => (current ? null : ["", ""]));
    };

    const updatePollOption = (index: number, value: string) => {
        setPollError(null);
        setPollOptions((current) =>
            current
                ? current.map((option, position) =>
                      position === index ? value.slice(0, 100) : option,
                  )
                : current,
        );
    };

    const addPollOption = () => {
        setPollOptions((current) =>
            current && current.length < MAX_POLL_OPTIONS
                ? [...current, ""]
                : current,
        );
    };

    const removePollOption = (index: number) => {
        setPollOptions((current) =>
            current && current.length > MIN_POLL_OPTIONS
                ? current.filter((_, position) => position !== index)
                : current,
        );
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSubmit) return;

        const trimmed = content.trim();
        const trimmedOptions =
            pollOptions?.map((option) => option.trim()) ?? [];

        if (pollOptions) {
            if (!trimmed) {
                setPollError("Escreva a pergunta da enquete.");
                return;
            }
            if (trimmedOptions.some((option) => !option)) {
                setPollError("Preencha todas as opções da enquete.");
                return;
            }
            if (
                new Set(trimmedOptions.map((option) => option.toLowerCase()))
                    .size !== trimmedOptions.length
            ) {
                setPollError("As opções da enquete não podem se repetir.");
                return;
            }
        }

        setSubmitting(true);

        try {
            if (!clientPostIdRef.current) {
                clientPostIdRef.current = crypto.randomUUID();
            }

            const post = await createPost({
                content: trimmed,
                image: image?.file,
                clientPostId: clientPostIdRef.current,
                profileId,
                poll: pollOptions ? { options: trimmedOptions } : undefined,
            });

            clientPostIdRef.current = null;
            onCreated(post);
            setContent("");
            setPollOptions(null);
            setPollError(null);
            clearImage();
            showToast({
                type: "success",
                message: profileId ? "Publicado no mural!" : "Post publicado!",
            });
        } catch (err) {
            showToast({
                type: "error",
                message: getErrorMessage(err, "Erro ao publicar o post."),
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={
                isCompact
                    ? "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-noir-border dark:bg-noir-surface sm:p-4"
                    : "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-noir-border dark:bg-noir-surface sm:p-5"
            }
        >
            <div className="flex gap-3">
                <Avatar
                    src={user?.avatar}
                    name={user?.name ?? "?"}
                    size="md"
                    className="shrink-0 ring-2 ring-emerald-500/20"
                />
                <div className="min-w-0 flex-1">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        placeholder={placeholder}
                        aria-label="Escreva seu post"
                        rows={isCompact ? 1 : 2}
                        disabled={submitting}
                        className={
                            isCompact
                                ? "w-full resize-none rounded-xl border border-transparent bg-transparent px-1 py-1.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60 dark:text-noir-text-bright dark:placeholder:text-noir-text-muted/70"
                                : "w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 dark:border-noir-border dark:bg-noir-surface-alt/60 dark:text-noir-text-bright dark:placeholder:text-noir-text-muted/70"
                        }
                    />

                    {image && (
                        <div className="relative mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-noir-border">
                            <img
                                src={image.url}
                                alt="Prévia da imagem selecionada"
                                className="max-h-64 w-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={clearImage}
                                aria-label="Remover imagem"
                                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                            >
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
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {pollOptions && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-noir-border dark:bg-noir-surface-alt/40">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700 dark:text-noir-text-bright">
                            Enquete
                        </p>
                        <span className="text-[11px] text-slate-500 dark:text-noir-text-muted">
                            2 a 4 opções
                        </span>
                    </div>

                    <div className="mt-2 space-y-2">
                        {pollOptions.map((option, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2"
                            >
                                <input
                                    value={option}
                                    onChange={(event) =>
                                        updatePollOption(
                                            index,
                                            event.target.value,
                                        )
                                    }
                                    placeholder={`Opção ${index + 1}`}
                                    aria-label={`Opção ${index + 1}`}
                                    maxLength={100}
                                    disabled={submitting}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-bright dark:placeholder:text-noir-text-muted"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePollOption(index)}
                                    disabled={
                                        pollOptions.length <=
                                            MIN_POLL_OPTIONS || submitting
                                    }
                                    aria-label={`Remover opção ${index + 1}`}
                                    title="Remover opção"
                                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/20 dark:hover:text-red-400"
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
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {pollOptions.length < MAX_POLL_OPTIONS && (
                        <button
                            type="button"
                            onClick={addPollOption}
                            disabled={submitting}
                            className="mt-2 text-xs font-medium text-emerald-700 hover:underline disabled:opacity-50 dark:text-emerald-400"
                        >
                            Adicionar opção
                        </button>
                    )}

                    {pollError && (
                        <p
                            role="alert"
                            className="mt-2 text-xs text-red-600 dark:text-red-400"
                        >
                            {pollError}
                        </p>
                    )}
                </div>
            )}

            <div
                className={
                    isCompact
                        ? "flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-noir-border/70"
                        : "flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-noir-border/70"
                }
            >
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={submitting || Boolean(image)}
                        title={
                            image
                                ? "Remova a imagem para escolher outra"
                                : "Adicionar imagem"
                        }
                        aria-label="Adicionar imagem"
                        className={
                            isCompact
                                ? "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-noir-text-muted dark:hover:bg-noir-surface-alt dark:hover:text-emerald-400"
                                : "inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/30 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                        }
                    >
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
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        {!isCompact && "Imagem"}
                    </button>

                    {isCompact && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setEmojiOpen((open) => !open)}
                                disabled={submitting}
                                title="Adicionar emoji"
                                aria-label="Adicionar emoji"
                                aria-expanded={emojiOpen}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-noir-text-muted dark:hover:bg-noir-surface-alt dark:hover:text-emerald-400"
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
                                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </button>
                            {emojiOpen && (
                                <div
                                    role="group"
                                    aria-label="Emojis"
                                    className="absolute bottom-full left-0 z-20 mb-2 grid grid-cols-6 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-noir-border dark:bg-noir-surface"
                                >
                                    {EMOJIS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => addEmoji(emoji)}
                                            aria-label={`Inserir ${emoji}`}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-slate-100 dark:hover:bg-noir-surface-alt"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={togglePoll}
                        disabled={submitting}
                        title={
                            pollOptions
                                ? "Remover enquete"
                                : "Adicionar enquete"
                        }
                        aria-label={
                            pollOptions
                                ? "Remover enquete"
                                : "Adicionar enquete"
                        }
                        aria-pressed={pollOptions !== null}
                        className={
                            isCompact
                                ? `inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                      pollOptions
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                          : "text-slate-500 hover:bg-slate-100 hover:text-emerald-600 dark:text-noir-text-muted dark:hover:bg-noir-surface-alt dark:hover:text-emerald-400"
                                  }`
                                : `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                      pollOptions
                                          ? "border-emerald-700/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                                          : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-noir-border dark:text-noir-text-muted dark:hover:bg-noir-surface-alt"
                                  }`
                        }
                    >
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
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        {!isCompact && "Enquete"}
                    </button>

                    {content.length > MAX_CONTENT - 200 && (
                        <span
                            className={`text-xs ${
                                content.length >= MAX_CONTENT
                                    ? "text-red-500"
                                    : "text-slate-400 dark:text-noir-text-muted"
                            }`}
                        >
                            {content.length}/{MAX_CONTENT}
                        </span>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                    )}
                    Publicar
                </button>
            </div>
        </form>
    );
}
