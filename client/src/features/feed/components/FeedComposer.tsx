import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../contexts/ToastContext";
import { getErrorMessage } from "../../../utils/errors";
import type { Post } from "../../../types";
import Avatar from "../../../components/ui/Avatar";
import { createPost } from "../services/feedApi";

const MAX_CONTENT = 2000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

interface FeedComposerProps {
    onCreated: (post: Post) => void;
}

interface SelectedImage {
    file: File;
    url: string;
}

export default function FeedComposer({ onCreated }: FeedComposerProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [content, setContent] = useState("");
    const [image, setImage] = useState<SelectedImage | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
            showToast({
                type: "error",
                message: "Formato de imagem não suportado. Use JPEG, PNG, WebP ou GIF.",
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

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSubmit) return;

        const trimmed = content.trim();
        setSubmitting(true);

        try {
            if (!clientPostIdRef.current) {
                clientPostIdRef.current = crypto.randomUUID();
            }

            const post = await createPost({
                content: trimmed,
                image: image?.file,
                clientPostId: clientPostIdRef.current,
            });

            clientPostIdRef.current = null;
            onCreated(post);
            setContent("");
            clearImage();
            showToast({ type: "success", message: "Post publicado!" });
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
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-noir-border dark:bg-noir-card"
        >
            <div className="flex gap-3">
                <Avatar
                    src={user?.avatar}
                    name={user?.name ?? "?"}
                    size="md"
                    className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                    <textarea
                        value={content}
                        onChange={handleContentChange}
                        placeholder="O que você está pensando?"
                        aria-label="Escreva seu post"
                        rows={3}
                        disabled={submitting}
                        className="w-full resize-none bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none disabled:opacity-60 dark:text-noir-text-bright dark:placeholder-noir-text-muted/70"
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

                    <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
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
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
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
                                Imagem
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
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.8}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                </svg>
                            )}
                            Publicar
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
