import { useState, useRef, useEffect, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/errors";
import { useToast } from "../../contexts/ToastContext";
import api from "../../services/api";
import EmojiPicker from "./EmojiPicker";
import AudioRecorder from "./AudioRecorder";
import { queuePendingMessage } from "../../lib/offlineStorage";
import type { Message } from "../../types";

const MAX_LENGTH = 2000;
const WARN_LENGTH = 1800;
const MAX_FILES = 5;
const SEND_ACK_TIMEOUT_MS = 15_000;

interface MessageInputProps {
    roomId: string;
    replyingTo?: Message | null;
    onCancelReply?: () => void;
    isBlocked?: boolean;
    onOptimisticMessage?: (msg: Message) => void;
    onOptimisticFailed?: (clientMessageId: string) => void;
}

const ALLOWED_DROP_TYPES = [
    "image/",
    "audio/",
    "application/pdf",
    "text/plain",
    "application/json",
];

function isAllowedFile(file: File): boolean {
    return ALLOWED_DROP_TYPES.some(
        (t) => file.type === t || file.type.startsWith(t),
    );
}

export default function MessageInput({
    roomId,
    replyingTo,
    onCancelReply,
    isBlocked = false,
    onOptimisticMessage,
    onOptimisticFailed,
}: MessageInputProps) {
    const [message, setMessage] = useState("");
    const { socket, connected } = useSocket();
    const { user } = useAuth();
    const { showToast } = useToast();
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [dragDepth, setDragDepth] = useState(0);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const offline = !navigator.onLine || !connected;

    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, []);

    useEffect(() => {
        resizeTextarea();
    }, [message, resizeTextarea]);

    const handleTextareaKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
    ) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!dragging) return;
        const handleDragOverGlobal = (e: DragEvent) => {
            e.preventDefault();
        };
        const handleDropGlobal = (e: DragEvent) => {
            e.preventDefault();
            setDragDepth(0);
            setDragging(false);
        };
        window.addEventListener("dragover", handleDragOverGlobal);
        window.addEventListener("drop", handleDropGlobal);
        return () => {
            window.removeEventListener("dragover", handleDragOverGlobal);
            window.removeEventListener("drop", handleDropGlobal);
        };
    }, [dragging]);

    const addFiles = (incoming: File[]) => {
        const valid = incoming
            .filter(isAllowedFile)
            .filter((f) => f.size <= 10 * 1024 * 1024);
        const rejected = incoming.length - valid.length;
        const remaining = MAX_FILES - files.length;
        setFiles((prev) => [...prev, ...valid.slice(0, remaining)]);
        if (rejected > 0) {
            showToast({
                type: "error",
                message: `${rejected} arquivo(s) ignorado(s) por tipo ou tamanho inválido.`,
            });
        }
        if (incoming.length > remaining) {
            showToast({
                type: "error",
                message: `No máximo ${MAX_FILES} anexos por mensagem.`,
            });
        }
        setError("");
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        setDragDepth((d) => d + 1);
        setDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragDepth((d) => Math.max(0, d - 1));
        if (dragDepth - 1 <= 0) {
            setDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragDepth(0);
        setDragging(false);
        const dropped = Array.from(e.dataTransfer.files || []);
        if (dropped.length > 0) {
            addFiles(dropped);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        const remaining = MAX_FILES - files.length;
        setFiles((prev) => [...prev, ...selected.slice(0, remaining)]);
        e.target.value = "";
        setError("");
    };

    const handleTyping = () => {
        if (!socket) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit("typing", { roomId, isTyping: true });
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit("typing", { roomId, isTyping: false });
        }, 4000);
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const hasFiles = files.length > 0;
        const trimmed = message.trim();
        if (!trimmed && !hasFiles) return;
        if (isBlocked) return;
        if (trimmed.length > MAX_LENGTH) {
            setError(`Mensagem muito longa (máximo ${MAX_LENGTH} caracteres).`);
            return;
        }

        if (offline) {
            if (hasFiles) {
                setError("Sem conexão. Tente novamente quando estiver online.");
                return;
            }
            await queuePendingMessage(roomId, trimmed);
            setMessage("");
            showToast({
                type: "info",
                message:
                    "Sem conexão. A mensagem será enviada quando você voltar online.",
            });
            return;
        }

        let attachments: {
            url: string;
            filename: string;
            mimetype: string;
            size: number;
        }[] = [];

        if (hasFiles) {
            setUploading(true);
            setError("");
            try {
                const formData = new FormData();
                for (const file of files) {
                    formData.append("files", file);
                }
                const { data } = await api.post(
                    `/messages/${roomId}/attachments`,
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    },
                );
                attachments = data.files;
            } catch (err: unknown) {
                setError(getErrorMessage(err, "Erro ao enviar arquivo"));
                setUploading(false);
                return;
            }
        }

        const clearInput = () => {
            setMessage("");
            setFiles([]);
            if (onCancelReply) onCancelReply();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            setIsTyping(false);
            socket?.emit("typing", { roomId, isTyping: false });
        };

        const clientMessageId = crypto.randomUUID();

        if (socket && user) {
            // UI otimista: exibe a mensagem imediatamente com status "pending"
            // e limpa o input sem esperar a confirmação do servidor.
            const optimistic: Message = {
                _id: `temp-${clientMessageId}`,
                sender: {
                    _id: user._id,
                    name: user.name,
                    avatar: user.avatar || "",
                    status: user.status || "",
                },
                content: trimmed,
                room: roomId,
                deleted: false,
                edited: false,
                reactions: {},
                attachments,
                readBy: [],
                parentMessage: replyingTo
                    ? {
                          _id: replyingTo._id,
                          sender: replyingTo.sender,
                          content: replyingTo.content,
                          attachments: replyingTo.attachments,
                          deleted: replyingTo.deleted,
                      }
                    : null,
                clientMessageId,
                status: "pending",
                createdAt: new Date().toISOString(),
            };
            onOptimisticMessage?.(optimistic);
            clearInput();
            setUploading(false);

            const failOptimistic = () => {
                onOptimisticFailed?.(clientMessageId);
                showToast({
                    type: "error",
                    message: "Não foi possível enviar a mensagem.",
                });
                setMessage((prev) => prev || trimmed);
            };

            const ackTimeout = setTimeout(failOptimistic, SEND_ACK_TIMEOUT_MS);

            socket.emit(
                replyingTo ? "reply" : "message",
                replyingTo
                    ? {
                          roomId,
                          parentId: replyingTo._id,
                          content: trimmed,
                          attachments,
                          clientMessageId,
                      }
                    : {
                          roomId,
                          content: trimmed,
                          attachments,
                          clientMessageId,
                      },
                (response: { error?: string }) => {
                    clearTimeout(ackTimeout);
                    if (response?.error) {
                        failOptimistic();
                        return;
                    }
                },
            );
            return;
        }

        if (!hasFiles && trimmed) {
            await queuePendingMessage(roomId, trimmed);
            setMessage("");
            if (onCancelReply) onCancelReply();
            setUploading(false);
            showToast({
                type: "info",
                message:
                    "Sem conexão. A mensagem será enviada quando você voltar online.",
            });
            return;
        }
        setUploading(false);
    };

    const handleAudioFinish = async (blob: Blob) => {
        setIsRecording(false);
        setError("");

        if (offline) {
            setError("Sem conexão para enviar o áudio.");
            return;
        }

        const file = new File([blob], `audio-${Date.now()}.webm`, {
            type: blob.type || "audio/webm",
        });

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("files", file);
            const { data } = await api.post(
                `/messages/${roomId}/attachments`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } },
            );
            const attachments = data.files;
            if (socket) {
                socket.emit(
                    replyingTo ? "reply" : "message",
                    replyingTo
                        ? {
                              roomId,
                              parentId: replyingTo._id,
                              content: "",
                              attachments,
                          }
                        : { roomId, content: "", attachments },
                    (response: { error?: string }) => {
                        setUploading(false);
                        if (response?.error) {
                            setError(
                                getErrorMessage(
                                    response,
                                    "Erro ao enviar áudio",
                                ),
                            );
                        } else {
                            if (onCancelReply) onCancelReply();
                        }
                    },
                );
            } else {
                setUploading(false);
            }
        } catch (err) {
            setError(getErrorMessage(err, "Erro ao enviar áudio"));
            setUploading(false);
        }
    };
    const charCount = message.length;
    const isOverLimit = charCount > MAX_LENGTH;
    const isNearLimit = charCount > WARN_LENGTH && charCount <= MAX_LENGTH;
    const canSubmit =
        !uploading &&
        !isBlocked &&
        (message.trim().length > 0 || files.length > 0);

    return (
        <form
            ref={dropZoneRef}
            onSubmit={handleSubmit}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-200 dark:border-zinc-700 shrink-0"
        >
            {dragging && (
                <div className="absolute inset-0 z-20 bg-emerald-500/10 border-2 border-dashed border-emerald-500 rounded-xl flex items-center justify-center pointer-events-none dark:bg-green-600/10 dark:border-green-500">
                    <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-green-400">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="text-sm font-medium">
                            Solte os arquivos para enviar
                        </p>
                        <p className="text-xs opacity-80">
                            Imagens, áudios, PDF, TXT ou JSON
                        </p>
                    </div>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs mb-2 dark:bg-red-500/10 dark:border-red-500/50 dark:text-red-400">
                    {error}
                </div>
            )}

            {replyingTo && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-2 dark:bg-zinc-800/80 dark:border-zinc-700">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-600 dark:text-green-400">
                            Respondendo a{" "}
                            {replyingTo.sender?.name || "mensagem"}
                        </p>
                        <p className="text-xs text-slate-500 truncate dark:text-zinc-400">
                            {replyingTo.content ||
                                (replyingTo.attachments &&
                                replyingTo.attachments.length > 0
                                    ? "📎 Anexo"
                                    : "")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancelReply}
                        disabled={uploading}
                        className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white transition-colors disabled:opacity-50 p-2 rounded-lg shrink-0"
                        title="Cancelar resposta"
                        aria-label="Cancelar resposta"
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

            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {files.map((file, i) => (
                        <span
                            key={`${file.name}-${i}`}
                            className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg pl-2 pr-1.5 py-1 max-w-48 dark:bg-zinc-800 dark:border-zinc-700"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-emerald-600 dark:text-green-400 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.172 7.586a2 2 0 102.828 2.828l-6.364 6.364a2 2 0 11-2.828-2.828l6.364-6.364a4 4 0 015.657 5.657l-6.364 6.364a4 4 0 01-5.657-5.657l.707-.707"
                                />
                            </svg>
                            <span className="text-xs text-slate-900 truncate dark:text-white">
                                {file.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeFile(i)}
                                disabled={uploading}
                                className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white transition-colors disabled:opacity-50"
                                title="Remover arquivo"
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
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {!isRecording && (
                <div className="flex items-center gap-1 sm:gap-1.5 mb-3">
                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => setEmojiOpen((prev) => !prev)}
                            className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-yellow-600 rounded-full transition-colors dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-yellow-400"
                            title="Emoji"
                            aria-label="Abrir seletor de emojis"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </button>
                        {emojiOpen && (
                            <EmojiPicker
                                onSelect={(emoji) => {
                                    setMessage((prev) => prev + emoji);
                                    setEmojiOpen(false);
                                    handleTyping();
                                }}
                                onClose={() => setEmojiOpen(false)}
                            />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsRecording(true)}
                        disabled={uploading || files.length > 0}
                        className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-red-600 rounded-full transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-red-400"
                        title="Gravar mensagem de voz"
                        aria-label="Gravar mensagem de voz"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8M12 11a2 2 0 002-2V6a2 2 0 10-4 0v3a2 2 0 002 2z"
                            />
                        </svg>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.txt,.json,audio/*"
                        onChange={handleFileChange}
                        disabled={
                            uploading ||
                            files.length >= MAX_FILES ||
                            isRecording
                        }
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || files.length >= MAX_FILES}
                        className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded-full transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-blue-400"
                        title="Anexar arquivo"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.172 7.586a2 2 0 102.828 2.828l-6.364 6.364a2 2 0 11-2.828-2.828l6.364-6.364a4 4 0 015.657 5.657l-6.364 6.364a4 4 0 01-5.657-5.657l.707-.707"
                            />
                        </svg>
                    </button>
                    <div className="flex-1" />
                    {(isNearLimit || isOverLimit) && (
                        <span
                            className={`text-xs ${
                                isOverLimit
                                    ? "text-red-600 font-semibold dark:text-red-400"
                                    : "text-yellow-500 dark:text-yellow-400"
                            }`}
                        >
                            {charCount}/{MAX_LENGTH}
                        </span>
                    )}
                </div>
            )}
            {isRecording ? (
                <AudioRecorder
                    onCancel={() => setIsRecording(false)}
                    onFinish={handleAudioFinish}
                />
            ) : (
                <div className="flex gap-2 items-end">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        aria-label="Escrever mensagem"
                        rows={1}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            setError("");
                            handleTyping();
                        }}
                        onKeyDown={handleTextareaKeyDown}
                        placeholder={
                            isBlocked
                                ? "Você bloqueou este usuário"
                                : uploading
                                  ? "Enviando arquivo..."
                                  : files.length > 0
                                    ? "Adicione uma legenda (opcional)..."
                                    : "Digite sua mensagem..."
                        }
                        disabled={uploading || isBlocked}
                        maxLength={MAX_LENGTH + 100}
                        className="flex-1 min-w-0 px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all resize-none overflow-y-hidden max-h-30 disabled:opacity-50 dark:bg-zinc-800/80 dark:border-zinc-700/60 dark:text-white dark:placeholder-zinc-500 dark:focus:border-green-500/50 dark:focus:ring-green-500/15"
                    />
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        aria-label="Enviar mensagem"
                        className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 transition-colors dark:bg-green-600 dark:hover:bg-green-700 dark:disabled:hover:bg-green-600 dark:text-on-accent"
                    >
                        {uploading ? (
                            <div className="w-5 h-5 border-2 border-on-accent border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5 -rotate-45"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            )}
        </form>
    );
}
