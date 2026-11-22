import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    getInterestOption,
    INTEREST_CATEGORIES,
    INTEREST_OPTIONS,
    MAX_INTERESTS,
} from "@shared/interests";
import { interestCategoryLabel, interestLabel } from "../../../i18n/catalogs";
import type { ProfileSectionEditor } from "../hooks/useProfileSectionEditor";
import { filterOptions } from "../../../utils/options";
import OptionSearch from "../../../components/ui/OptionSearch";
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

function InterestChip({
    id,
    selected,
    disabled,
    onToggle,
}: {
    id: string;
    selected: boolean;
    disabled: boolean;
    onToggle: () => void;
}) {
    const option = getInterestOption(id);
    if (!option) return null;

    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            aria-pressed={selected}
            className={chipClass(selected)}
        >
            <span aria-hidden="true">{option.emoji}</span>
            {interestLabel(option.id)}
        </button>
    );
}

function InterestsEditor({
    interests,
    editor,
}: {
    interests: string[];
    editor: ProfileSectionEditor;
}) {
    const { t } = useTranslation("profile");
    const [draft, setDraft] = useState(interests);
    const [query, setQuery] = useState("");
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
            setLocalError(t("interestsCard.maxError", { max: MAX_INTERESTS }));
            return;
        }

        setLocalError(null);
        setDraft((current) => [...current, id]);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        await editor.save({ interests: draft });
    };

    const available = filterOptions(INTEREST_OPTIONS, query).filter(
        (option) => !draft.includes(option.id),
    );
    const groups = INTEREST_CATEGORIES.map((category) => ({
        category,
        options: available.filter((option) => option.category === category),
    })).filter((group) => group.options.length > 0);

    return (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-3">
            <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    <OptionSearch
                        value={query}
                        onChange={setQuery}
                        placeholder={t("interestsCard.searchPlaceholder")}
                        label={t("interestsCard.searchLabel")}
                    />
                </div>
                <span className="shrink-0 text-[11px] text-slate-400 dark:text-noir-text-muted">
                    {draft.length}/{MAX_INTERESTS}
                </span>
            </div>

            {draft.length > 0 && (
                <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-400/80">
                        {t("interestsCard.selected")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {draft.map((id) => (
                            <InterestChip
                                key={id}
                                id={id}
                                selected
                                disabled={editor.saving}
                                onToggle={() => toggle(id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {groups.map((group) => (
                    <div key={group.category}>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-noir-text-muted">
                            {interestCategoryLabel(group.category)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {group.options.map((option) => (
                                <InterestChip
                                    key={option.id}
                                    id={option.id}
                                    selected={false}
                                    disabled={editor.saving}
                                    onToggle={() => toggle(option.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {groups.length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500 dark:border-noir-border dark:text-noir-text-muted">
                        {t("interestsCard.emptySearch", { query })}
                    </p>
                )}
            </div>

            <InlineEditActions
                saving={editor.saving}
                error={localError ?? editor.error}
                onCancel={editor.cancel}
                submitLabel={t("interestsCard.save")}
            />
        </form>
    );
}

export default function ProfileInterestsCard({
    interests = [],
    isSelf,
    editor,
}: ProfileInterestsCardProps) {
    const { t } = useTranslation("profile");
    const editing = editor.isEditing("interests");
    const options = interests
        .map((id) => getInterestOption(id))
        .filter((option): option is NonNullable<typeof option> =>
            Boolean(option),
        );

    return (
        <section
            aria-label={t("interestsCard.aria")}
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
                        {t("interestsCard.title")}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {!editing && (
                        <span className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                            {t("interestsCard.count", {
                                count: options.length,
                                max: MAX_INTERESTS,
                            })}
                        </span>
                    )}
                    {isSelf && !editing && (
                        <InlineEditButton
                            label={t("interestsCard.editLabel")}
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
                            <span className="font-medium">
                                {interestLabel(option.id)}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-center dark:border-noir-border">
                    <p className="text-xs text-slate-500 dark:text-noir-text-muted">
                        {isSelf
                            ? t("interestsCard.emptySelf", {
                                  max: MAX_INTERESTS,
                              })
                            : t("interestsCard.emptyOther")}
                    </p>
                    {isSelf && (
                        <button
                            type="button"
                            onClick={() => editor.start("interests")}
                            className="mt-2 text-xs font-medium text-emerald-700 transition-colors hover:underline dark:text-emerald-400"
                        >
                            {t("interestsCard.select")}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
