import { getInterestOption, MAX_INTERESTS } from "@shared/interests";

interface ProfileInterestsCardProps {
    interests?: string[];
    isSelf: boolean;
    onEdit: () => void;
}

export default function ProfileInterestsCard({
    interests = [],
    isSelf,
    onEdit,
}: ProfileInterestsCardProps) {
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
                <span className="text-[11px] text-slate-400 dark:text-noir-text-muted">
                    {options.length}/{MAX_INTERESTS} selecionados
                </span>
            </div>

            {options.length > 0 ? (
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
                            onClick={onEdit}
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
