import {
    MAX_LANGUAGES,
    getLanguageLevelOption,
    getLanguageOption,
    normalizeLanguageLevels,
} from "@shared/profile";

interface ProfileLanguagesCardProps {
    languages?: string[];
    languageLevels?: Record<string, string>;
    isSelf: boolean;
    onEdit: () => void;
    className?: string;
}

export default function ProfileLanguagesCard({
    languages = [],
    languageLevels,
    isSelf,
    onEdit,
    className = "",
}: ProfileLanguagesCardProps) {
    const levels = normalizeLanguageLevels(languages, languageLevels);
    const options = languages
        .map((id) => getLanguageOption(id))
        .filter((option): option is NonNullable<typeof option> =>
            Boolean(option),
        );

    return (
        <section
            aria-label="Idiomas falados"
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
                        Idiomas que falo
                    </h2>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                    {options.length}/{MAX_LANGUAGES}
                </span>
            </div>

            {options.length > 0 ? (
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
                                            {option.label}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                                        {level?.label ?? "Intermediário"}
                                    </span>
                                </div>
                                <div
                                    className="mt-1.5 flex gap-1"
                                    role="img"
                                    aria-label={`${option.label}: ${level?.label ?? "Intermediário"}`}
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
                            ? "Informe os idiomas que você fala para aparecerem no seu perfil."
                            : "Nenhum idioma informado ainda."}
                    </p>
                    {isSelf && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="mt-1.5 text-xs font-medium text-emerald-700 transition-colors hover:underline dark:text-emerald-400"
                        >
                            Informar idiomas
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
