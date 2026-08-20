import { memo, useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useGesture } from "../../hooks/useGesture";
import { useSocket } from "../../hooks/useSocket";
import type { Message, ParentMessage } from "../../types";
import Avatar from "../ui/Avatar";
import ConfirmDialog from "../ui/ConfirmDialog";
import UserProfilePopover from "../ui/UserProfilePopover";
import LinkPreviewCard from "./LinkPreviewCard";
import MessageActions from "./MessageActions";
import TouchActions from "./TouchActions";

interface MessageBubbleProps {
    message: Message;
    onDelete: (messageId: string, forMe?: boolean) => void;
    onEdit: (messageId: string, content: string) => void;
    onToggleReaction: (messageId: string, emoji: string) => void;
    onReply?: (message: Message) => void;
    onOpenThread?: (message: Message) => void;
    onTogglePin?: (message: Message) => void;
    isPinned?: boolean;
    searchQuery?: string;
    highlighted?: boolean;
    roomType: "group" | "direct";
    currentUserId: string;
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
    if (!query || query.trim() === "") return <>{text}</>;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <span key={i} className="bg-yellow-500/40 rounded px-0.5">
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                ),
            )}
        </>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function firstUrl(content: string): string | null {
    const match = content.match(/https?:\/\/[^\s<>"']+/i);
    if (!match) return null;
    try {
        const url = new URL(match[0]);
        return url.href;
    } catch {
        return null;
    }
}

function MessageAttachments({
    attachments,
}: {
    attachments: NonNullable<Message["attachments"]>;
}) {
    return (
        <>
            {attachments.map((att, i) =>
                att.mimetype.startsWith("audio/") ? (
                    <div
                        key={i}
                        className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 dark:bg-zinc-800/80 dark:border-zinc-700"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-emerald-600 dark:text-green-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.536 8.464a5 5 0 010 7.072M12 12h.01M17.196 5.803a8.001 8.001 0 010 12.393M9 9l-5 3m5 0v6m0-6l5-3m-5 3a3 3 0 11-6 0 3 3 0 016 0z"
                                transform="scale(0.8) translate(3 3)"
                            />
                        </svg>
                        <audio
                            controls
                            src={att.url}
                            preload="metadata"
                            className="h-9 max-w-48"
                        />
                    </div>
                ) : att.mimetype.startsWith("image/") ? (
                    <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-1 rounded-lg overflow-hidden"
                    >
                        <img
                            src={att.url}
                            alt={att.filename}
                            className="max-w-64 max-h-64 object-cover rounded-lg"
                            loading="lazy"
                        />
                    </a>
                ) : (
                    <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={att.filename}
                        className="mt-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors dark:bg-zinc-800/80 dark:border-zinc-700 dark:hover:bg-zinc-700/80"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-emerald-600 dark:text-green-400 shrink-0"
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
                        <div className="min-w-0">
                            <p className="text-sm text-slate-900 truncate max-w-48 dark:text-white">
                                {att.filename}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-500">
                                {formatFileSize(att.size)}
                            </p>
                        </div>
                    </a>
                ),
            )}
        </>
    );
}

function ReplyPreview({ parent }: { parent: ParentMessage }) {
    return (
        <div className="flex items-start gap-2 mb-1.5 px-2 py-1.5 bg-slate-100 border-l-2 border-emerald-500/60 rounded-r-md dark:bg-zinc-900/60 dark:border-green-500/60">
            <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-600 truncate dark:text-green-400">
                    {parent.sender?.name || "Mensagem"}
                </p>
                <p className="text-xs text-slate-500 truncate dark:text-zinc-400">
                    {parent.content ||
                        (parent.attachments && parent.attachments.length > 0
                            ? "📎 Anexo"
                            : "")}
                </p>
            </div>
        </div>
    );
}

function MessageBubbleComponent({
    message,
    onDelete,
    onEdit,
    onToggleReaction,
    onReply,
    onOpenThread,
    onTogglePin,
    isPinned = false,
    searchQuery,
    highlighted,
    roomType,
    currentUserId,
}: MessageBubbleProps) {
    const { user } = useAuth();
    const { onlineUsers } = useSocket();
    const senderOnline = onlineUsers.some(
        (u) => u.userId === message.sender?._id,
    );

    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [showPicker, setShowPicker] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const gesture = useGesture({
        onLongPress: () => setShowActions(true),
        onSwipeLeft: () => setShowActions(true),
        onSwipeRight: () => setShowActions(true),
        disabled: editing,
    });

    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [editing]);

    useEffect(() => {
        if (!showPicker) return;
        const handleClickOutside = (e: PointerEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(e.target as Node)
            ) {
                setShowPicker(false);
            }
        };
        document.addEventListener("pointerdown", handleClickOutside);
        return () =>
            document.removeEventListener("pointerdown", handleClickOutside);
    }, [showPicker]);

    useEffect(() => {
        if (!showActions) return;
        const handle = (e: PointerEvent) => {
            if (
                actionsRef.current &&
                actionsRef.current.contains(e.target as Node)
            ) {
                return;
            }
            setShowActions(false);
        };
        document.addEventListener("pointerdown", handle, true);
        return () => {
            document.removeEventListener("pointerdown", handle, true);
        };
    }, [showActions]);

    if (message.type === "system") {
        return (
            <div className="flex justify-center mb-3">
                <p className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 text-center max-w-[80%] dark:bg-zinc-800/70 dark:border-zinc-700/50 dark:text-zinc-400">
                    {message.content}
                </p>
            </div>
        );
    }

    if (!message.sender) return null;

    const isOwn = message.sender._id === user?._id;
    const time = new Date(message.createdAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const handleSaveEdit = () => {
        const trimmed = editContent.trim();
        if (trimmed && trimmed !== message.content) {
            onEdit(message._id, trimmed);
        }
        setEditing(false);
    };

    const handleCancelEdit = () => {
        setEditContent(message.content);
        setEditing(false);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === "Escape") {
            handleCancelEdit();
        }
    };

    const reactions = message.reactions || {};
    const hasReactions = Object.keys(reactions).length > 0;
    const previewUrl = message.content ? firstUrl(message.content) : null;

    const readBy = message.readBy || [];
    const senderId = message.sender._id;
    const isRead = isOwn
        ? roomType === "direct"
            ? readBy.length > 0
            : readBy.some((id) => id !== currentUserId) &&
              readBy.some((id) => id !== senderId)
        : false;

    if (message.deleted) {
        return (
            <div
                className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}
            >
                <div
                    className={`max-w-[70%] px-3 py-2 rounded-lg ${
                        isOwn
                            ? "bg-emerald-100 text-slate-900 rounded-br-none dark:bg-green-700/30 dark:text-white"
                            : "bg-white text-slate-900 border border-slate-200/80 rounded-bl-none dark:bg-zinc-700 dark:text-zinc-100 dark:border-transparent"
                    }`}
                >
                    {!isOwn && (
                        <div className="flex items-center gap-2 mb-1">
                            <UserProfilePopover
                                userId={message.sender._id}
                                name={message.sender.name}
                                avatar={message.sender.avatar}
                                status={message.sender.status}
                                isOnline={senderOnline}
                            >
                                <Avatar
                                    src={message.sender.avatar}
                                    name={message.sender.name}
                                    size="xs"
                                />
                                <p className="text-xs font-semibold text-emerald-600 dark:text-green-400">
                                    {message.sender.name}
                                </p>
                            </UserProfilePopover>
                        </div>
                    )}
                    <p className="text-sm italic text-slate-400 dark:text-zinc-400">
                        {isOwn
                            ? "Você excluiu esta mensagem"
                            : `${message.sender.name} excluiu esta mensagem`}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                {...gesture.handlers}
                className={`flex items-end ${isOwn ? "justify-end" : "justify-start"} ${"mb-3"} group ${highlighted ? "relative" : ""} [touch-action:pan-y]`}
            >
                <div
                    className={`relative max-w-[85%] sm:max-w-[70%] ${
                        highlighted ? "ring-2 ring-yellow-500 rounded-xl" : ""
                    }`}
                    style={{
                        transform: `translateX(${gesture.offset}px)`,
                        transition: gesture.dragging
                            ? "none"
                            : "transform 0.2s ease",
                    }}
                >
                    {highlighted && (
                        <span className="absolute -top-2 -left-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                            #
                        </span>
                    )}
                    <div
                        className={`px-3 py-2 rounded-lg shadow-sm shadow-black/20 ${
                            isOwn
                                ? "bg-emerald-100 text-slate-900 rounded-br-none dark:bg-green-700/30 dark:text-white"
                                : "bg-white text-slate-900 border border-slate-200/80 rounded-bl-none dark:bg-zinc-700 dark:text-zinc-100 dark:border-transparent"
                        }`}
                    >
                        {!isOwn && (
                            <div className="flex items-center gap-2 mb-1">
                                <UserProfilePopover
                                    userId={message.sender._id}
                                    name={message.sender.name}
                                    avatar={message.sender.avatar}
                                    status={message.sender.status}
                                    isOnline={senderOnline}
                                >
                                    <Avatar
                                        src={message.sender.avatar}
                                        name={message.sender.name}
                                        size="xs"
                                    />
                                    <p className="text-xs font-semibold text-emerald-600 dark:text-green-400">
                                        {message.sender.name}
                                    </p>
                                </UserProfilePopover>
                            </div>
                        )}
                        {message.parentMessage && !editing && (
                            <ReplyPreview parent={message.parentMessage} />
                        )}
                        {editing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={editContent}
                                    onChange={(e) =>
                                        setEditContent(e.target.value)
                                    }
                                    onKeyDown={handleEditKeyDown}
                                    maxLength={2000}
                                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-slate-900 text-base focus:outline-none focus:border-emerald-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white dark:focus:border-green-500"
                                />
                                <button
                                    onClick={handleSaveEdit}
                                    className="text-emerald-600 hover:text-emerald-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                    title="Salvar"
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
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors"
                                    title="Cancelar"
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
                        ) : (
                            <>
                                {message.attachments &&
                                    message.attachments.length > 0 && (
                                        <MessageAttachments
                                            attachments={message.attachments}
                                        />
                                    )}
                                {message.content && (
                                    <p className="text-sm wrap-break-word">
                                        <HighlightedText
                                            text={message.content}
                                            query={searchQuery}
                                        />
                                    </p>
                                )}
                                {previewUrl && (
                                    <LinkPreviewCard
                                        key={previewUrl}
                                        url={previewUrl}
                                    />
                                )}
                            </>
                        )}
                        <p
                            className={`text-[10px] mt-1 ${isOwn ? "text-emerald-700/70 dark:text-green-300/60" : "text-slate-400 dark:text-zinc-500"} text-right`}
                        >
                            {time}
                            {isPinned && " 📌"}
                            {message.edited && !editing && " (editado)"}
                            {isRead && isOwn && ` · Lido`}
                        </p>
                    </div>

                    {/* Reaction chips */}
                    {hasReactions && !editing && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(reactions).map(
                                ([emoji, userIds]) => {
                                    const hasReacted =
                                        user?._id && userIds.includes(user._id);
                                    return (
                                        <button
                                            key={emoji}
                                            onClick={() =>
                                                onToggleReaction(
                                                    message._id,
                                                    emoji,
                                                )
                                            }
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                                                hasReacted
                                                    ? "bg-green-700/40 border border-green-500/50 text-green-300 dark:bg-emerald-100 dark:text-emerald-800"
                                                    : "bg-slate-100 border border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                                            }`}
                                        >
                                            <span>{emoji}</span>
                                            <span>{userIds.length}</span>
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    )}

                    {/* Action buttons */}
                    {!editing && (
                        <MessageActions
                            isOwn={isOwn}
                            isPinned={isPinned}
                            showPicker={showPicker}
                            onTogglePicker={() =>
                                setShowPicker((prev) => !prev)
                            }
                            onReact={(emoji) =>
                                onToggleReaction(message._id, emoji)
                            }
                            onReply={
                                onReply ? () => onReply(message) : undefined
                            }
                            onOpenThread={
                                onOpenThread
                                    ? () => onOpenThread(message)
                                    : undefined
                            }
                            onTogglePin={
                                onTogglePin
                                    ? () => onTogglePin(message)
                                    : undefined
                            }
                            onEdit={() => setEditing(true)}
                            onDelete={() => setConfirmDelete(true)}
                            pickerRef={pickerRef}
                        />
                    )}

                    {/* Touch action popover */}
                    {showActions && !editing && (
                        <TouchActions
                            isOwn={isOwn}
                            isPinned={isPinned}
                            onTogglePicker={() =>
                                setShowPicker((prev) => !prev)
                            }
                            onReply={
                                onReply
                                    ? () => {
                                          onReply(message);
                                          setShowActions(false);
                                      }
                                    : undefined
                            }
                            onOpenThread={
                                onOpenThread
                                    ? () => {
                                          onOpenThread(message);
                                          setShowActions(false);
                                      }
                                    : undefined
                            }
                            onTogglePin={
                                onTogglePin
                                    ? () => {
                                          onTogglePin(message);
                                          setShowActions(false);
                                      }
                                    : undefined
                            }
                            onEdit={() => {
                                setEditing(true);
                                setShowActions(false);
                            }}
                            onDelete={() => setConfirmDelete(true)}
                            actionsRef={actionsRef}
                        />
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmDelete}
                title="Excluir mensagem"
                message="Como deseja excluir esta mensagem?"
                cancelLabel="Cancelar"
                confirmLabel="Para todos"
                danger
                onConfirm={() => {
                    setConfirmDelete(false);
                    onDelete(message._id, false);
                }}
                onCancel={() => setConfirmDelete(false)}
                extraButton={{
                    label: "Só pra mim",
                    onExtra: () => {
                        setConfirmDelete(false);
                        onDelete(message._id, true);
                    },
                }}
            />
        </>
    );
}

const MessageBubble = memo(MessageBubbleComponent);
export default MessageBubble;