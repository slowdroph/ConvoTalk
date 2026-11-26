import { useTranslation } from "react-i18next";
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
    confirmLabel,
    cancelLabel,
    danger = false,
    extraButton,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const { t } = useTranslation("common");
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-noir-base/75 flex items-center justify-center z-50 animate-messageEnter">
            <div className="bg-noir-card border border-noir-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-popIn">
                <h3
                    className={`text-lg font-semibold mb-2 ${
                        danger ? "text-red-400" : "text-noir-text-bright"
                    }`}
                >
                    {title}
                </h3>
                <p className="text-noir-text-muted text-sm mb-4">{message}</p>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={onCancel}
                    >
                        {cancelLabel ?? t("actions.cancel")}
                    </Button>
                    {extraButton && (
                        <Button
                            variant="secondary"
                            className="flex-1 border border-noir-border-light text-noir-text-bright"
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
                        {confirmLabel ?? t("actions.confirm")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
