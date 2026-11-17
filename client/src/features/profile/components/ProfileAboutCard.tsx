interface ProfileAboutCardProps {
    bio?: string;
    isSelf: boolean;
    onEdit: () => void;
}

export default function ProfileAboutCard({
    bio,
    isSelf,
    onEdit,
}: ProfileAboutCardProps) {
    return (
        <section
            aria-label="Sobre mim"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-noir-border dark:bg-noir-surface"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-noir-text-muted">
                        Bio pública
                    </span>
                </div>
                {isSelf ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="text-xs font-medium text-emerald-700 transition-colors hover:underline dark:text-emerald-400"
                    >
                        Editar
                    </button>
                ) : null}
            </div>

            <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-noir-text-bright">
                Sobre Mim
            </h2>

            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-noir-text-bright/90">
                {bio?.trim() ||
                    (isSelf
                        ? "Você ainda não escreveu sua bio. Conte um pouco sobre você!"
                        : "Este usuário ainda não escreveu uma bio.")}
            </p>
        </section>
    );
}
