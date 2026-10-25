import { useCallback, useState } from "react";
import type {
    AiReplySuggestion,
    AiSuggestRepliesRequest,
    AiSummaryPayload,
} from "@shared/types";
import { getErrorMessage } from "../../../utils/errors";
import { suggestReplies, summarizeRoom } from "../services/ai";

export type AssistantAction = "suggest" | "summarize";

export type AssistantLoading = AssistantAction | null;

export interface AssistantError {
    action: AssistantAction;
    message: string;
}

export function useAssistant(roomId: string) {
    const [summary, setSummary] = useState<AiSummaryPayload | null>(null);
    const [suggestions, setSuggestions] = useState<AiReplySuggestion[]>([]);
    const [loading, setLoading] = useState<AssistantLoading>(null);
    const [error, setError] = useState<AssistantError | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState(roomId);

    if (currentRoomId !== roomId) {
        setCurrentRoomId(roomId);
        setSummary(null);
        setSuggestions([]);
        setLoading(null);
        setError(null);
    }

    const summarize = useCallback(
        async (regenerate = false) => {
            setLoading("summarize");
            setError(null);
            try {
                setSummary(await summarizeRoom(roomId, { regenerate }));
            } catch (err) {
                setError({
                    action: "summarize",
                    message: getErrorMessage(
                        err,
                        "Não foi possível gerar o resumo.",
                    ),
                });
            } finally {
                setLoading(null);
            }
        },
        [roomId],
    );

    const suggest = useCallback(
        async (options: AiSuggestRepliesRequest = {}) => {
            setLoading("suggest");
            setError(null);
            try {
                const result = await suggestReplies(roomId, options);
                setSuggestions(result.suggestions);
            } catch (err) {
                setError({
                    action: "suggest",
                    message: getErrorMessage(
                        err,
                        "Não foi possível sugerir respostas.",
                    ),
                });
            } finally {
                setLoading(null);
            }
        },
        [roomId],
    );

    const clearError = useCallback(() => setError(null), []);

    return {
        summary,
        suggestions,
        loading,
        error,
        summarize,
        suggest,
        clearError,
    };
}
