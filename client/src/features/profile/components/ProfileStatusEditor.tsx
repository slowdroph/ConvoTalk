import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProfileSectionEditor } from "../hooks/useProfileSectionEditor";
import InlineEditButton from "./inline/InlineEditButton";

const MAX_STATUS = 100;

interface ProfileStatusEditorProps {
    status?: string;
    isSelf: boolean;
    editor: ProfileSectionEditor;
}

function StatusForm({
    status,
    editor,
}: {
    status: string;
    editor: ProfileSectionEditor;
}) {
    const { t } = useTranslation("profile");
    const [draft, setDraft] = useState(status);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        await editor.save({ status: draft.trim() });
    };

    return (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-1">
            <div className="flex items-center gap-1.5">
                <input
                    type="text"
                    aria-label={t("status.aria")}
                    value={draft}
                    onChange={(event) =>
                        setDraft(event.target.value.slice(0, MAX_STATUS))
                    }
                    maxLength={MAX_STATUS}
                    disabled={editor.saving}
                    placeholder={t("status.placeholder")}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 dark:border-noir-border dark:bg-noir-surface-alt/60 dark:text-noir-text-bright dark:placeholder:text-noir-text-muted/70"
                />
                <button
                    type="submit"
                    disabled={editor.saving}
                    aria-label={t("status.save")}
                    className="rounded-lg bg-emerald-600 p-1.5 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {editor.saving ? (
                        <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    )}
                </button>
                <button
                    type="button"
                    onClick={editor.cancel}
                    disabled={editor.saving}
                    aria-label={t("status.cancel")}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-noir-border dark:text-noir-text-muted dark:hover:bg-noir-surface-alt"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
            {editor.error && (
                <p
                    role="alert"
                    className="mt-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-600 dark:text-red-400"
                >
                    {editor.error}
                </p>
            )}
        </form>
    );
}

export default function ProfileStatusEditor({
    status = "",
    isSelf,
    editor,
}: ProfileStatusEditorProps) {
    const { t } = useTranslation("profile");

    if (isSelf && editor.isEditing("status")) {
        return <StatusForm status={status} editor={editor} />;
    }

    if (!status && !isSelf) return null;

    return (
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-noir-text-muted">
            <span
                className={`min-w-0 truncate ${
                    status
                        ? ""
                        : "italic text-slate-400 dark:text-noir-text-muted/80"
                }`}
            >
                {status || t("status.empty")}
            </span>
            {isSelf && (
                <InlineEditButton
                    label={t("status.editLabel")}
                    onClick={() => editor.start("status")}
                />
            )}
        </div>
    );
}
