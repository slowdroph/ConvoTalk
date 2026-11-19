interface InlineEditActionsProps {
    saving: boolean;
    error: string | null;
    onCancel: () => void;
    submitLabel?: string;
}

export default function InlineEditActions({
    saving,
    error,
    onCancel,
    submitLabel = "Salvar",
}: InlineEditActionsProps) {
    return (
        <div className="mt-3">
            {error && (
                <p
                    role="alert"
                    className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400"
                >
                    {error}
                </p>
            )}
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-noir-border dark:text-noir-text-muted dark:hover:bg-noir-surface-alt"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {submitLabel}
                </button>
            </div>
        </div>
    );
}
