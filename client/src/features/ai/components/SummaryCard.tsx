import type { AiSummaryPayload } from "@shared/types";

interface SummaryCardProps {
    summary: AiSummaryPayload;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
    return (
        <div className="rounded-xl border border-noir-border bg-noir-base/60 p-3">
            <p className="text-sm leading-relaxed text-slate-800 dark:text-noir-text-bright whitespace-pre-wrap">
                {summary.summary}
            </p>
            {summary.keyPoints.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                    {summary.keyPoints.map((point, index) => (
                        <li
                            key={`${index}-${point.slice(0, 12)}`}
                            className="flex gap-2 text-xs text-slate-600 dark:text-noir-text-muted"
                        >
                            <span className="text-emerald-500 shrink-0">•</span>
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
            )}
            <p className="mt-3 text-[10px] text-slate-400 dark:text-noir-text-muted/70">
                {summary.messageCount} mensagens analisadas
            </p>
        </div>
    );
}
