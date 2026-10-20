import type { AiReplySuggestion, AiSummaryPayload } from "@shared/types";
import type { AssistantLoading } from "../hooks/useAssistant";
import SummaryCard from "./SummaryCard";
import ReplySuggestions from "./ReplySuggestions";

interface AssistantPanelProps {
    summary: AiSummaryPayload | null;
    suggestions: AiReplySuggestion[];
    loading: AssistantLoading;
    error: string | null;
    onSummarize: () => void;
    onSuggest: () => void;
    onUseReply: (text: string) => void;
    onClose: () => void;
}

function Spinner() {
    return (
        <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export default function AssistantPanel({
    summary,
    suggestions,
    loading,
    error,
    onSummarize,
    onSuggest,
    onUseReply,
    onClose,
}: AssistantPanelProps) {
    return (
        <div className="fixed inset-0 z-40 w-full md:relative md:w-80 md:z-auto flex flex-col border-t md:border-t-0 md:border-l border-noir-border bg-noir-surface md:max-h-full">
            <div className="px-4 py-3 border-b border-noir-border flex items-center justify-between shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-noir-text-bright flex items-center gap-2">
                    <span className="text-emerald-500">✦</span>
                    Assistente de IA
                </h3>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors dark:text-noir-text-muted dark:hover:text-noir-text-bright dark:hover:bg-noir-surface-alt"
                    title="Fechar assistente"
                    aria-label="Fechar assistente"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <div className="px-3 py-3 border-b border-noir-border flex gap-2 shrink-0">
                <button
                    type="button"
                    onClick={onSummarize}
                    disabled={loading !== null}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600/15 text-emerald-600 border border-emerald-600/30 hover:bg-emerald-600/25 transition-colors disabled:opacity-50 dark:text-emerald-400"
                >
                    Resumir conversa
                </button>
                <button
                    type="button"
                    onClick={onSuggest}
                    disabled={loading !== null}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-noir-base/60 text-slate-700 border border-noir-border hover:bg-noir-surface-alt transition-colors disabled:opacity-50 dark:text-noir-text-bright"
                >
                    Sugerir respostas
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                {error && (
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                        {error}
                    </div>
                )}

                {loading === "summary" && <Spinner />}
                {loading !== "summary" && summary && (
                    <SummaryCard summary={summary} />
                )}

                {loading === "suggestions" && <Spinner />}
                {loading !== "suggestions" && suggestions.length > 0 && (
                    <div>
                        <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-400 dark:text-noir-text-muted">
                            Sugestões de resposta
                        </p>
                        <ReplySuggestions
                            suggestions={suggestions}
                            onUse={onUseReply}
                        />
                    </div>
                )}

                {!error &&
                    loading === null &&
                    !summary &&
                    suggestions.length === 0 && (
                        <p className="text-xs text-slate-500 dark:text-noir-text-muted py-6 text-center">
                            Escolha uma ação acima para analisar esta conversa
                            com o assistente.
                        </p>
                    )}
            </div>
        </div>
    );
}
