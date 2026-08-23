import {
    EditIcon,
    PinIcon,
    ReplyIcon,
    SmileIcon,
    ThreadIcon,
    TrashIcon,
} from "./MessageIcons";

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
            className="flex flex-wrap justify-center gap-1 max-w-[calc(100vw-1rem)] bg-white border border-slate-200 rounded-lg p-1.5 shadow-lg dark:bg-zinc-800 dark:border-zinc-700 pointer-events-auto"
        >
            <button
                onClick={onTogglePicker}
                className="p-2 rounded-md hover:bg-slate-100 text-slate-600 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors"
                title="Reagir"
            >
                <SmileIcon />
            </button>
            {onReply && (
                <button
                    onClick={onReply}
                    className="p-2 rounded-md hover:bg-slate-100 text-slate-600 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors"
                    title="Responder"
                >
                    <ReplyIcon />
                </button>
            )}
            {onOpenThread && (
                <button
                    onClick={onOpenThread}
                    className="p-2 rounded-md hover:bg-slate-100 text-slate-600 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors"
                    title="Ver respostas"
                >
                    <ThreadIcon />
                </button>
            )}
            {onTogglePin && (
                <button
                    onClick={onTogglePin}
                    className={`p-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors ${isPinned ? "text-emerald-600 dark:text-green-400" : "text-slate-600 dark:text-zinc-300"}`}
                    title={isPinned ? "Desafixar mensagem" : "Fixar mensagem"}
                >
                    <PinIcon filled={isPinned} />
                </button>
            )}
            {isOwn && (
                <>
                    <button
                        onClick={onEdit}
                        className="p-2 rounded-md hover:bg-slate-100 text-slate-600 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors"
                        title="Editar mensagem"
                    >
                        <EditIcon />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-md hover:bg-slate-100 text-slate-600 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors"
                        title="Excluir mensagem"
                    >
                        <TrashIcon />
                    </button>
                </>
            )}
        </div>
    );
}
