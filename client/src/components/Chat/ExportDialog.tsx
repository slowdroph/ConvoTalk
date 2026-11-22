import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import Button from "../ui/Button";

interface ExportDialogProps {
    isOpen: boolean;
    roomId: string;
    roomName: string;
    onClose: () => void;
}

function getFilenameFromDisposition(
    disposition: string | undefined,
): string | null {
    if (!disposition) return null;
    const match = disposition.match(/filename="?([^";]+)"?/);
    return match ? match[1] : null;
}

export default function ExportDialog({
    isOpen,
    roomId,
    roomName,
    onClose,
}: ExportDialogProps) {
    const { t } = useTranslation("chat");
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleExport = async () => {
        setExporting(true);
        setError(null);
        try {
            const response = await api.get(`/messages/${roomId}/export`, {
                responseType: "blob",
            });
            const filename =
                getFilenameFromDisposition(
                    response.headers["content-disposition"],
                ) || `${roomName || t("export.fileFallback")}.pdf`;

            const url = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            onClose();
        } catch {
            setError(t("export.error"));
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-noir-base/75 flex items-center justify-center z-50">
            <div className="bg-noir-card border border-noir-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
                <h3 className="text-lg font-semibold text-noir-text-bright mb-2">
                    {t("export.title")}
                </h3>
                <p className="text-noir-text-muted text-sm mb-4">
                    {t("export.description")}
                </p>
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                        disabled={exporting}
                    >
                        {t("export.cancel")}
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        {exporting && (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {exporting
                            ? t("export.exporting")
                            : t("export.export")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
