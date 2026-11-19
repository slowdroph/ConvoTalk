import { useState } from "react";
import { getInterestOption, MAX_INTERESTS, INTEREST_OPTIONS } from "@shared/interests";
import type { ProfileSectionEditor } from "../hooks/useProfileSectionEditor";
import InlineEditActions from "./inline/InlineEditActions";
import InlineEditButton from "./inline/InlineEditButton";

interface ProfileInterestsCardProps {
    interests?: string[];
    isSelf: boolean;
    editor: ProfileSectionEditor;
}

const chipClass = (selected: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        selected
            ? "border-emerald-600/40 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500/40 hover:text-emerald-700 dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-muted dark:hover:text-emerald-400"
    }`;

function InterestsEditor({
    interests,
    editor,
}: {
    interests: string[];
    editor: ProfileSectionEditor;
}) {
    const [draft, setDraft] = useState(interests);
    const [localError, setLocalError] = useState<string | null>(null);

    const toggle = (id: string) => {
        if (draft.includes(id)) {
            setLocalError(null);
            setDraft((current) =>
                current.filter((interest) => interest !== id),
            );
            return;
        }

        if (draft.length >= MAX_INTERESTS) {
            setLocalError(
                `Escolha no máximo ${MAX_INTERESTS} interesses.`,
            );
            return;
        }

        setLocalError(null);
        setDraft((current) => [...current, id]);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        await editor.save({ interests: draft });
    };

    return (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-3">
            <div className="mb-2 flex items-center justify-end">
                <span className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                    {draft.length}/{MAX_INTERESTS} selecionados
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => toggle(option.id)}
                        disabled={editor.saving}
                        aria-pressed={draft.includes(option.id)}
                        className={chipClass(draft.includes(option.id))}
                    >
                        <span aria-hidden="true">{option.emoji}</span>
                        {option.label}
                    </button>
                ))}
            </div>

            <InlineEditActions
                saving={editor.saving}
                error={localError ?? editor.error}
                onCancel={editor.cancel}
                submitLabel="Salvar interesses"
            />
        </form>
    );
}

export default function ProfileInterestsCard({
    interests = [],
    isSelf,
    editor,
}: ProfileInterestsCardProps) {
    const editing = editor.isEditing("interests");
    const options = interests
        .map((id) => getInterestOption(id))
        .filter((option): option is NonNullable<typeof option> =>
            Boolean(option),
        );

    return (
        <section
            aria-label="Hobbies e interesses"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-noir-border dark:bg-noir-surface"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                    <h2 className="text-base font-bold text-slate-900 dark:text-noir-text-bright">
                        Hobbies &amp; Interesses
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {!editing && (
                        <span className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                            {options.length}/{MAX_INTERESTS} selecionados
                        </span>
                    )}
                    {isSelf && !editing && (
                        <InlineEditButton
                            label="Editar interesses"
                            onClick={() => editor.start("interests")}
                        />
                    )}
                </div>
            </div>

            {editing ? (
                <InterestsEditor interests={interests} editor={editor} />
            ) : options.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                    {options.map((option) => (
                        <li
                            key={option.id}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-bright"
                        >
                            <span aria-hidden="true" className="text-base">
                                {option.emoji}
                            </span>
                            <span className="font-medium">{option.label}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-center dark:border-noir-border">
                    <p className="text-xs text-slate-500 dark:text-noir-text-muted">
                        {isSelf
                            ? "Escolha até 12 interesses para mostrar no seu perfil."
                            : "Nenhum interesse selecionado ainda."}
                    </p>
                    {isSelf && (
                        <button
                            type="button"
                            onClick={() => editor.start("interests")}
                            className="mt-2 text-xs font-medium text-emerald-700 transition-colors hover:underline dark:text-emerald-400"
                        >
                            Selecionar interesses
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
