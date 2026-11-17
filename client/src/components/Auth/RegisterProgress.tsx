interface RegisterProgressProps {
    current: number;
    total: number;
}

export default function RegisterProgress({
    current,
    total,
}: RegisterProgressProps) {
    const percentage = Math.round((current / total) * 100);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                <span>Criação de conta</span>
                <span aria-live="polite">Etapa {current} de {total}</span>
            </div>
            <div
                role="progressbar"
                aria-label="Progresso do cadastro"
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={current}
                aria-valuetext={`Etapa ${current} de ${total}`}
                className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
            >
                <span
                    aria-hidden="true"
                    className="block h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
