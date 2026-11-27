import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProfileSectionEditor } from "../hooks/useProfileSectionEditor";
import InlineEditActions from "./inline/InlineEditActions";
import InlineEditButton from "./inline/InlineEditButton";

const MAX_BIO = 1000;

interface ProfileAboutCardProps {
    bio?: string;
    isSelf: boolean;
    editor: ProfileSectionEditor;
}

function BioEditor({
    bio,
    editor,
}: {
    bio: string;
    editor: ProfileSectionEditor;
}) {
    const { t } = useTranslation("profile");
    const [draft, setDraft] = useState(bio);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        await editor.save({ bio: draft.trim() });
    };

    return (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-3">
            <div className="mb-1.5 flex items-center justify-end">
                <span
                    className={`text-[11px] ${
                        draft.length >= MAX_BIO
                            ? "text-red-500"
                            : "text-slate-400 dark:text-noir-text-muted"
                    }`}
                >
                    {draft.length}/{MAX_BIO}
                </span>
            </div>
            <textarea
                aria-label={t("about.textareaAria")}
                value={draft}
                onChange={(event) =>
                    setDraft(event.target.value.slice(0, MAX_BIO))
                }
                rows={5}
                maxLength={MAX_BIO}
                disabled={editor.saving}
                placeholder={t("about.placeholder")}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 dark:border-noir-border dark:bg-noir-surface-alt/60 dark:text-noir-text-bright dark:placeholder:text-noir-text-muted/70"
            />
            <InlineEditActions
                saving={editor.saving}
                error={editor.error}
                onCancel={editor.cancel}
                submitLabel={t("about.submit")}
            />
        </form>
    );
}

export default function ProfileAboutCard({
    bio = "",
    isSelf,
    editor,
}: ProfileAboutCardProps) {
    const { t } = useTranslation("profile");
    const editing = editor.isEditing("bio");

    return (
        <section
            aria-label={t("about.aria")}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-noir-border dark:bg-noir-surface"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-noir-text-muted">
                        {t("about.badge")}
                    </span>
                </div>
                {isSelf && !editing ? (
                    <InlineEditButton
                        label={t("about.editLabel")}
                        onClick={() => editor.start("bio")}
                    />
                ) : null}
            </div>

            <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-noir-text-bright">
                {t("about.title")}
            </h2>

            {editing ? (
                <BioEditor bio={bio} editor={editor} />
            ) : (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-noir-text-bright/90">
                    {bio.trim() ||
                        (isSelf
                            ? t("about.emptySelf")
                            : t("about.emptyOther"))}
                </p>
            )}
        </section>
    );
}
