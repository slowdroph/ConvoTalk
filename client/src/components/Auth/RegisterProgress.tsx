import { useTranslation } from "react-i18next";

interface RegisterProgressProps {
    current: number;
    total: number;
}

export default function RegisterProgress({
    current,
    total,
}: RegisterProgressProps) {
    const { t } = useTranslation("auth");
    const percentage = Math.round((current / total) * 100);
    const stepLabel = t("register.step", { current, total });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                <span>{t("register.progressLabel")}</span>
                <span aria-live="polite">{stepLabel}</span>
            </div>
            <div
                role="progressbar"
                aria-label={t("register.progressAria")}
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={current}
                aria-valuetext={stepLabel}
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
