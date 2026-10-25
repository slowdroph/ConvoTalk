import type { AiSummaryPayload } from "@shared/types";
import type { AssistantLoading } from "../hooks/useAssistant";
import SummaryCard from "./SummaryCard";

interface AssistantPanelProps {
    summary: AiSummaryPayload | null;
    loading: AssistantLoading;
    error: string | null;
    onRefresh: () => void;
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
    loading,
    error,
    onRefresh,
    onClose,
}: AssistantPanelProps) {
    return (
        <div className="fixed inset-0 z-40 w-full md:relative md:w-80 md:z-auto flex flex-col border-t md:border-t-0 md:border-l border-noir-border bg-noir-surface md:max-h-full">
            <div className="px-4 py-3 border-b border-noir-border flex items-center justify-between shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-noir-text-bright flex items-center gap-2">
                    <span className="text-emerald-500">✦</span>
                    Resumo da conversa
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onRefresh}
                        disabled={loading === "summarize"}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50 dark:text-noir-text-muted dark:hover:text-noir-text-bright dark:hover:bg-noir-surface-alt"
                        title="Gerar novo resumo"
                        aria-label="Gerar novo resumo"
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
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
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
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                {loading === "summarize" && <Spinner />}

                {loading !== "summarize" && error && (
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                        {error}
                    </div>
                )}

                {loading !== "summarize" && !error && summary && (
                    <SummaryCard summary={summary} />
                )}

                {loading !== "summarize" && !error && !summary && (
                    <p className="text-xs text-slate-500 dark:text-noir-text-muted py-6 text-center">
                        Nenhum resumo gerado ainda. Use o botão de atualizar
                        para analisar esta conversa.
                    </p>
                )}
            </div>
        </div>
    );
}
