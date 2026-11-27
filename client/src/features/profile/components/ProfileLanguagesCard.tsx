import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    DEFAULT_LANGUAGE_LEVEL,
    LANGUAGE_LEVEL_OPTIONS,
    LANGUAGE_OPTIONS,
    LANGUAGE_REGIONS,
    MAX_LANGUAGES,
    getLanguageLevelOption,
    getLanguageOption,
    normalizeLanguageLevels,
} from "@shared/profile";
import {
    languageLevelLabel,
    languageRegionLabel,
    spokenLanguageLabel,
} from "../../../i18n/catalogs";
import type { ProfileSectionEditor } from "../hooks/useProfileSectionEditor";
import { filterOptions } from "../../../utils/options";
import OptionSearch from "../../../components/ui/OptionSearch";
import Select from "../../../components/ui/Select";
import InlineEditActions from "./inline/InlineEditActions";
import InlineEditButton from "./inline/InlineEditButton";

interface ProfileLanguagesCardProps {
    languages?: string[];
    languageLevels?: Record<string, string>;
    isSelf: boolean;
    editor: ProfileSectionEditor;
    className?: string;
}

const chipClass = (selected: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        selected
            ? "border-emerald-600/40 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500/40 hover:text-emerald-700 dark:border-noir-border dark:bg-noir-surface-alt dark:text-noir-text-muted dark:hover:text-emerald-400"
    }`;

function LanguagesEditor({
    languages,
    languageLevels,
    editor,
}: {
    languages: string[];
    languageLevels?: Record<string, string>;
    editor: ProfileSectionEditor;
}) {
    const { t } = useTranslation("profile");
    const [draft, setDraft] = useState(languages);
    const [levels, setLevels] = useState<Record<string, string>>(() =>
        normalizeLanguageLevels(languages, languageLevels),
    );
    const [query, setQuery] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);

    const toggle = (id: string) => {
        if (draft.includes(id)) {
            setLocalError(null);
            setDraft((current) => current.filter((code) => code !== id));
            setLevels((current) => {
                const next = { ...current };
                delete next[id];
                return next;
            });
            return;
        }

        if (draft.length >= MAX_LANGUAGES) {
            setLocalError(t("languagesCard.maxError", { max: MAX_LANGUAGES }));
            return;
        }

        setLocalError(null);
        setDraft((current) => [...current, id]);
        setLevels((current) => ({
            ...current,
            [id]: current[id] ?? DEFAULT_LANGUAGE_LEVEL,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (draft.length === 0) {
            setLocalError(t("languagesCard.minError"));
            return;
        }
        await editor.save({ languages: draft, languageLevels: levels });
    };

    const available = filterOptions(LANGUAGE_OPTIONS, query).filter(
        (option) => !draft.includes(option.id),
    );
    const groups = LANGUAGE_REGIONS.map((region) => ({
        region,
        options: available.filter((option) => option.region === region),
    })).filter((group) => group.options.length > 0);

    return (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-3">
            <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    <OptionSearch
                        value={query}
                        onChange={setQuery}
                        placeholder={t("languagesCard.searchPlaceholder")}
                        label={t("languagesCard.searchLabel")}
                    />
                </div>
                <span className="shrink-0 text-[11px] text-slate-400 dark:text-noir-text-muted">
                    {draft.length}/{MAX_LANGUAGES}
                </span>
            </div>

            {draft.length > 0 && (
                <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-400/80">
                        {t("languagesCard.selected")}
                    </p>
                    {draft.map((code) => {
                        const option = getLanguageOption(code);
                        if (!option) return null;
                        return (
                            <div
                                key={code}
                                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-noir-border dark:bg-noir-surface-alt/60"
                            >
                                <span className="min-w-0 truncate text-xs text-slate-700 dark:text-noir-text-bright">
                                    <span aria-hidden="true">
                                        {option.emoji}
                                    </span>{" "}
                                    {spokenLanguageLabel(option.id)}
                                </span>
                                <div className="flex shrink-0 items-center gap-1">
                                    <Select
                                        size="sm"
                                        fullWidth={false}
                                        ariaLabel={t("languagesCard.levelAria", {
                                            language: spokenLanguageLabel(
                                                option.id,
                                            ),
                                        })}
                                        value={
                                            levels[code] ??
                                            DEFAULT_LANGUAGE_LEVEL
                                        }
                                        onChange={(value) =>
                                            setLevels((current) => ({
                                                ...current,
                                                [code]: value,
                                            }))
                                        }
                                        disabled={editor.saving}
                                        options={LANGUAGE_LEVEL_OPTIONS.map(
                                            (level) => ({
                                                value: level.id,
                                                label: languageLevelLabel(
                                                    level.id,
                                                ),
                                            }),
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggle(code)}
                                        disabled={editor.saving}
                                        aria-label={t("languagesCard.removeAria", {
                                            language: spokenLanguageLabel(
                                                option.id,
                                            ),
                                        })}
                                        className="rounded p-1 text-slate-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-3 w-3"
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
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {groups.map((group) => (
                    <div key={group.region}>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-noir-text-muted">
                            {languageRegionLabel(group.region)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {group.options.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => toggle(option.id)}
                                    disabled={editor.saving}
                                    aria-pressed={false}
                                    className={chipClass(false)}
                                >
                                    <span aria-hidden="true">
                                        {option.emoji}
                                    </span>
                                    {spokenLanguageLabel(option.id)}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {groups.length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500 dark:border-noir-border dark:text-noir-text-muted">
                        {t("languagesCard.emptySearch", { query })}
                    </p>
                )}
            </div>

            <InlineEditActions
                saving={editor.saving}
                error={localError ?? editor.error}
                onCancel={editor.cancel}
                submitLabel={t("languagesCard.save")}
            />
        </form>
    );
}

export default function ProfileLanguagesCard({
    languages = [],
    languageLevels,
    isSelf,
    editor,
    className = "",
}: ProfileLanguagesCardProps) {
    const { t } = useTranslation("profile");
    const editing = editor.isEditing("languages");
    const levels = normalizeLanguageLevels(languages, languageLevels);
    const options = languages
        .map((id) => getLanguageOption(id))
        .filter((option): option is NonNullable<typeof option> =>
            Boolean(option),
        );

    return (
        <section
            aria-label={t("languagesCard.aria")}
            className={`px-5 py-4 ${className}`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                        />
                    </svg>
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-noir-text-muted">
                        {t("languagesCard.title")}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {!editing && (
                        <span className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                            {options.length}/{MAX_LANGUAGES}
                        </span>
                    )}
                    {isSelf && !editing && (
                        <InlineEditButton
                            label={t("languagesCard.editLabel")}
                            onClick={() => editor.start("languages")}
                        />
                    )}
                </div>
            </div>

            {editing ? (
                <LanguagesEditor
                    languages={languages}
                    languageLevels={languageLevels}
                    editor={editor}
                />
            ) : options.length > 0 ? (
                <ul className="mt-3 space-y-3">
                    {options.map((option) => {
                        const level = getLanguageLevelOption(
                            levels[option.id] ?? "",
                        );
                        const value = level?.value ?? 2;
                        return (
                            <li
                                key={option.id}
                                className="text-sm text-slate-700 dark:text-noir-text-bright"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            aria-hidden="true"
                                            className="text-base"
                                        >
                                            {option.emoji}
                                        </span>
                                        <span className="font-medium">
                                            {spokenLanguageLabel(option.id)}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                                        {level
                                            ? languageLevelLabel(level.id)
                                            : t("languagesCard.defaultLevel")}
                                    </span>
                                </div>
                                <div
                                    className="mt-1.5 flex gap-1"
                                    role="img"
                                    aria-label={t("languagesCard.levelSummary", {
                                        language: spokenLanguageLabel(
                                            option.id,
                                        ),
                                        level: level
                                            ? languageLevelLabel(level.id)
                                            : t("languagesCard.defaultLevel"),
                                    })}
                                >
                                    {[1, 2, 3, 4].map((step) => (
                                        <span
                                            key={step}
                                            className={`h-1 flex-1 rounded-full ${
                                                step <= value
                                                    ? "bg-emerald-500"
                                                    : "bg-slate-200 dark:bg-noir-border"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-3 text-center dark:border-noir-border">
                    <p className="text-xs text-slate-500 dark:text-noir-text-muted">
                        {isSelf
                            ? t("languagesCard.emptySelf")
                            : t("languagesCard.emptyOther")}
                    </p>
                    {isSelf && (
                        <button
                            type="button"
                            onClick={() => editor.start("languages")}
                            className="mt-1.5 text-xs font-medium text-emerald-700 transition-colors hover:underline dark:text-emerald-400"
                        >
                            {t("languagesCard.select")}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
