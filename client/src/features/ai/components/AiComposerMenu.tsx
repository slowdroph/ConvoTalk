import { useEffect, useRef, useState } from "react";
import type { AiReplySuggestion } from "@shared/types";
import type { AssistantLoading } from "../hooks/useAssistant";
import { AI_ACTIONS, type AiActionId } from "../actions";
import ReplySuggestions from "./ReplySuggestions";

interface AiComposerMenuProps {
    loading: AssistantLoading;
    error: string | null;
    suggestions: AiReplySuggestion[];
    disabled?: boolean;
    onSuggest: (regenerate?: boolean) => void;
    onSummarize: () => void;
    onUseSuggestion: (text: string) => void;
    onClearError: () => void;
}

type MenuView = "menu" | "suggest";

function Spinner({ className = "" }: { className?: string }) {
    return (
        <span
            data-testid="ai-spinner"
            className={`inline-block rounded-full border-2 border-emerald-500 border-t-transparent animate-spin ${className}`}
            aria-hidden="true"
        />
    );
}

export default function AiComposerMenu({
    loading,
    error,
    suggestions,
    disabled = false,
    onSuggest,
    onSummarize,
    onUseSuggestion,
    onClearError,
}: AiComposerMenuProps) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<MenuView>("menu");
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (e: PointerEvent) => {
            if (
                wrapRef.current &&
                !wrapRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
                setView("menu");
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.stopPropagation();
            if (view === "suggest") {
                setView("menu");
                return;
            }
            setOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown, true);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [open, view]);

    const close = () => {
        setOpen(false);
        setView("menu");
    };

    const toggle = () => {
        if (open) {
            close();
            return;
        }
        setOpen(true);
        setView("menu");
        onClearError();
    };

    const runAction = (id: AiActionId) => {
        const action = AI_ACTIONS.find((item) => item.id === id);
        if (!action) return;

        onClearError();

        if (action.surface === "panel") {
            close();
            onSummarize();
            return;
        }

        setView("suggest");
        onSuggest();
    };

    const handleUseSuggestion = (text: string) => {
        onUseSuggestion(text);
        close();
    };

    return (
        <div ref={wrapRef} className="relative shrink-0">
            <button
                type="button"
                onClick={toggle}
                disabled={disabled}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Assistente de IA"
                title="Assistente de IA"
                className={`p-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    open
                        ? "text-emerald-600 bg-emerald-600/10 dark:text-emerald-400"
                        : "text-slate-500 hover:text-emerald-600 hover:bg-slate-200 dark:text-noir-text-muted dark:hover:text-emerald-400 dark:hover:bg-noir-card"
                }`}
            >
                {loading ? (
                    <Spinner className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                    <span className="block text-base sm:text-lg leading-none">
                        ✦
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute bottom-full mb-2 left-0 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-noir-surface-alt/95 backdrop-blur-md border border-noir-border shadow-2xl text-slate-900 dark:text-noir-text-bright"
                    role={view === "menu" ? "menu" : "dialog"}
                    aria-label="Assistente de IA"
                >
                    {view === "menu" ? (
                        <div className="p-1.5">
                            <p className="flex items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-noir-text-muted">
                                <span className="text-emerald-500">✦</span>
                                Assistente de IA
                            </p>
                            <div className="space-y-0.5">
                                {AI_ACTIONS.map((action) => (
                                    <button
                                        key={action.id}
                                        type="button"
                                        role="menuitem"
                                        onClick={() => runAction(action.id)}
                                        disabled={loading !== null}
                                        className="group w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors hover:bg-emerald-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg
                                            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-emerald-500 dark:text-noir-text-muted dark:group-hover:text-emerald-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.8}
                                                d={action.iconPath}
                                            />
                                        </svg>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-xs font-medium text-slate-800 dark:text-noir-text-bright">
                                                {action.label}
                                            </span>
                                            <span className="block text-[11px] text-slate-500 dark:text-noir-text-muted">
                                                {action.description}
                                            </span>
                                        </span>
                                        {loading === action.id && (
                                            <Spinner className="mt-1 h-3.5 w-3.5 shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-1 px-2 py-2 border-b border-noir-border">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setView("menu");
                                        onClearError();
                                    }}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors dark:text-noir-text-muted dark:hover:bg-noir-card dark:hover:text-noir-text-bright"
                                    aria-label="Voltar para as ações de IA"
                                    title="Voltar"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>
                                <p className="flex-1 text-xs font-semibold">
                                    Sugestões de resposta
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClearError();
                                        onSuggest(true);
                                    }}
                                    disabled={loading === "suggest"}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors disabled:opacity-50 dark:text-noir-text-muted dark:hover:bg-noir-card dark:hover:text-noir-text-bright"
                                    aria-label="Gerar outras sugestões"
                                    title="Gerar outras"
                                >
                                    {loading === "suggest" ? (
                                        <Spinner className="h-4 w-4" />
                                    ) : (
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={close}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors dark:text-noir-text-muted dark:hover:bg-noir-card dark:hover:text-noir-text-bright"
                                    aria-label="Fechar assistente"
                                    title="Fechar"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
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

                            <div className="max-h-[45vh] overflow-y-auto custom-scrollbar p-2">
                                {loading === "suggest" && (
                                    <div className="flex items-center justify-center py-8">
                                        <Spinner className="h-6 w-6" />
                                    </div>
                                )}

                                {loading !== "suggest" && error && (
                                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                                        {error}
                                    </div>
                                )}

                                {loading !== "suggest" &&
                                    !error &&
                                    suggestions.length > 0 && (
                                        <ReplySuggestions
                                            suggestions={suggestions}
                                            onUse={handleUseSuggestion}
                                        />
                                    )}

                                {loading !== "suggest" &&
                                    !error &&
                                    suggestions.length === 0 && (
                                        <p className="py-6 text-center text-xs text-slate-500 dark:text-noir-text-muted">
                                            Nenhuma sugestão gerada ainda.
                                        </p>
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
