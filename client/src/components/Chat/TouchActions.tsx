import {
    EditIcon,
    PinIcon,
    ReplyIcon,
    SmileIcon,
    ThreadIcon,
    TrashIcon,
} from "./MessageIcons";
import Tooltip from "../ui/Tooltip";

interface TouchActionsProps {
    isOwn: boolean;
    isPinned: boolean;
    onTogglePicker: () => void;
    onReply?: () => void;
    onOpenThread?: () => void;
    onTogglePin?: () => void;
    onEdit: () => void;
    onDelete: () => void;
    actionsRef: React.RefObject<HTMLDivElement | null>;
    position?: { top: number; left: number } | null;
}

export default function TouchActions({
    isOwn,
    isPinned,
    onTogglePicker,
    onReply,
    onOpenThread,
    onTogglePin,
    onEdit,
    onDelete,
    actionsRef,
    position,
}: TouchActionsProps) {
    if (!position) return null;

    return (
        <div
            ref={actionsRef}
            style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                transform: "translateX(-50%)",
                zIndex: 50,
            }}
            className="flex flex-wrap justify-center gap-1 max-w-[calc(100vw-1rem)] bg-white border border-slate-200 rounded-lg p-1.5 shadow-lg dark:bg-noir-card dark:border-noir-border pointer-events-auto"
        >
            <Tooltip content="Reagir">
                <button
                    onClick={onTogglePicker}
                    className="p-2 rounded-md hover:bg-slate-100 text-slate-600 dark:hover:bg-noir-surface-alt dark:text-noir-text-muted transition-colors"
                >
                    <SmileIcon />
                </button>
            </Tooltip>
            {onReply && (
                <Tooltip content="Responder">
                    <button
                        onClick={onReply}
                        className="p-2 rounded-md hover:bg-slate-100 text-slate-600 dark:hover:bg-noir-surface-alt dark:text-noir-text-muted transition-colors"
                    >
                        <ReplyIcon />
                    </button>
                </Tooltip>
            )}
            {onOpenThread && (
                <Tooltip content="Ver respostas">
                    <button
                        onClick={onOpenThread}
                        className="p-2 rounded-md hover:bg-slate-100 text-slate-600 dark:hover:bg-noir-surface-alt dark:text-noir-text-muted transition-colors"
                    >
                        <ThreadIcon />
                    </button>
                </Tooltip>
            )}
            {onTogglePin && (
                <Tooltip
                    content={
                        isPinned ? "Desafixar mensagem" : "Fixar mensagem"
                    }
                >
                    <button
                        onClick={onTogglePin}
                        className={`p-2 rounded-md hover:bg-slate-100 dark:hover:bg-noir-surface-alt transition-colors ${isPinned ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-noir-text-muted"}`}
                    >
                        <PinIcon filled={isPinned} />
                    </button>
                </Tooltip>
            )}
            {isOwn && (
                <>
                    <Tooltip content="Editar mensagem">
                        <button
                            onClick={onEdit}
                            className="p-2 rounded-md hover:bg-slate-100 text-slate-600 dark:hover:bg-noir-surface-alt dark:text-noir-text-muted transition-colors"
                        >
                            <EditIcon />
                        </button>
                    </Tooltip>
                    <Tooltip content="Excluir mensagem">
                        <button
                            onClick={onDelete}
                            className="p-2 rounded-md hover:bg-slate-100 text-slate-600 dark:hover:bg-noir-surface-alt dark:text-noir-text-muted transition-colors"
                        >
                            <TrashIcon />
                        </button>
                    </Tooltip>
                </>
            )}
        </div>
    );
}
