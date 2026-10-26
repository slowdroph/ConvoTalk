import {
    EditIcon,
    PinIcon,
    ReplyIcon,
    SmileIcon,
    ThreadIcon,
    TrashIcon,
} from "./MessageIcons";
import Tooltip from "../ui/Tooltip";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "👎"];

interface MessageActionsProps {
    isOwn: boolean;
    isPinned: boolean;
    showPicker: boolean;
    onTogglePicker: () => void;
    onReact: (emoji: string) => void;
    onReply?: () => void;
    onOpenThread?: () => void;
    onTogglePin?: () => void;
    onEdit: () => void;
    onDelete: () => void;
    pickerRef: React.RefObject<HTMLDivElement | null>;
}

export default function MessageActions({
    isOwn,
    isPinned,
    showPicker,
    onTogglePicker,
    onReact,
    onReply,
    onOpenThread,
    onTogglePin,
    onEdit,
    onDelete,
    pickerRef,
}: MessageActionsProps) {
    return (
        <div
            aria-hidden="true"
            className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg px-1.5 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity dark:bg-noir-card/90 dark:border-noir-border ${isOwn ? "right-full mr-1.5" : "left-full ml-1.5"}`}
        >
            {/* Emoji picker button */}
            <div className="relative flex items-center">
                <Tooltip content="Reagir">
                    <button
                        onClick={onTogglePicker}
                        className="text-slate-500 hover:text-emerald-600 dark:text-noir-text-muted dark:hover:text-emerald-400 transition-colors"
                    >
                        <SmileIcon />
                    </button>
                </Tooltip>
                {showPicker && (
                    <div
                        ref={pickerRef}
                        className={`absolute z-50 bg-white border border-slate-200 rounded-lg p-2 flex gap-1 shadow-lg dark:bg-noir-card dark:border-noir-border ${isOwn ? "right-0" : "left-0"}`}
                        style={{
                            bottom: "100%",
                            marginBottom: "4px",
                        }}
                    >
                        {EMOJI_OPTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => {
                                    onReact(emoji);
                                    onTogglePicker();
                                }}
                                className="text-lg hover:bg-slate-100 dark:hover:bg-noir-surface-alt rounded p-1 transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {/* Reply button */}
            {onReply && (
                <Tooltip content="Responder">
                    <button
                        onClick={onReply}
                        className="text-slate-500 hover:text-emerald-600 dark:text-noir-text-muted dark:hover:text-emerald-400 transition-colors"
                    >
                        <ReplyIcon />
                    </button>
                </Tooltip>
            )}
            {/* Thread button */}
            {onOpenThread && (
                <Tooltip content="Ver respostas">
                    <button
                        onClick={onOpenThread}
                        className="text-slate-500 hover:text-emerald-600 dark:text-noir-text-muted dark:hover:text-emerald-400 transition-colors"
                    >
                        <ThreadIcon />
                    </button>
                </Tooltip>
            )}
            {/* Pin button */}
            {onTogglePin && (
                <Tooltip
                    content={
                        isPinned ? "Desafixar mensagem" : "Fixar mensagem"
                    }
                >
                    <button
                        onClick={onTogglePin}
                        className={`transition-colors ${isPinned ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 hover:text-emerald-600 dark:text-noir-text-muted dark:hover:text-emerald-400"}`}
                    >
                        <PinIcon filled={isPinned} />
                    </button>
                </Tooltip>
            )}
            {/* Edit and delete buttons (only for own messages) */}
            {isOwn && (
                <>
                    <Tooltip content="Editar mensagem">
                        <button
                            onClick={onEdit}
                            className="text-slate-500 hover:text-emerald-600 dark:text-noir-text-muted dark:hover:text-emerald-400 transition-colors"
                        >
                            <EditIcon />
                        </button>
                    </Tooltip>
                    <Tooltip content="Excluir mensagem">
                        <button
                            onClick={onDelete}
                            className="text-slate-500 hover:text-red-600 dark:text-noir-text-muted dark:hover:text-red-400 transition-colors"
                        >
                            <TrashIcon />
                        </button>
                    </Tooltip>
                </>
            )}
        </div>
    );
}
