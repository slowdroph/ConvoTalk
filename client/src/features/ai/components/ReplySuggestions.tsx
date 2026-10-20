import type { AiReplySuggestion, AiTone } from "@shared/types";

const TONE_LABELS: Record<AiTone, string> = {
    short: "Curta",
    friendly: "Amigável",
    formal: "Formal",
};

interface ReplySuggestionsProps {
    suggestions: AiReplySuggestion[];
    onUse: (text: string) => void;
}

export default function ReplySuggestions({
    suggestions,
    onUse,
}: ReplySuggestionsProps) {
    return (
        <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
                <button
                    key={`${index}-${suggestion.text.slice(0, 12)}`}
                    type="button"
                    onClick={() => onUse(suggestion.text)}
                    className="w-full text-left rounded-xl border border-noir-border bg-noir-base/60 p-3 hover:border-emerald-500/60 hover:bg-emerald-600/10 transition-colors"
                    title="Usar esta resposta"
                >
                    <span className="text-[10px] uppercase tracking-wide text-emerald-500">
                        {TONE_LABELS[suggestion.tone]}
                    </span>
                    <p className="mt-1 text-sm text-slate-800 dark:text-noir-text-bright">
                        {suggestion.text}
                    </p>
                </button>
            ))}
        </div>
    );
}
