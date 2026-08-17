import Button from "./Button";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    extraButton?: {
        label: string;
        onExtra: () => void;
    };
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    danger = false,
    extraButton,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm mx-4">
                <h3
                    className={`text-lg font-semibold mb-2 ${
                        danger ? "text-red-400" : "text-white"
                    }`}
                >
                    {title}
                </h3>
                <p className="text-zinc-400 text-sm mb-4">{message}</p>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </Button>
                    {extraButton && (
                        <Button
                            variant="secondary"
                            className="flex-1 border border-zinc-600 text-zinc-200"
                            onClick={extraButton.onExtra}
                        >
                            {extraButton.label}
                        </Button>
                    )}
                    <Button
                        variant={danger ? "danger" : "primary"}
                        className="flex-1"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
