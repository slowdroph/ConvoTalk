import { useCallback, useState } from "react";
import type { AiReplySuggestion, AiSummaryPayload } from "@shared/types";
import { getErrorMessage } from "../../../utils/errors";
import { suggestReplies, summarizeRoom } from "../services/ai";

export type AssistantLoading = "summary" | "suggestions" | null;

export function useAssistant(roomId: string) {
    const [summary, setSummary] = useState<AiSummaryPayload | null>(null);
    const [suggestions, setSuggestions] = useState<AiReplySuggestion[]>([]);
    const [loading, setLoading] = useState<AssistantLoading>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState(roomId);

    if (currentRoomId !== roomId) {
        setCurrentRoomId(roomId);
        setSummary(null);
        setSuggestions([]);
        setLoading(null);
        setError(null);
    }

    const summarize = useCallback(async () => {
        setLoading("summary");
        setError(null);
        try {
            setSummary(await summarizeRoom(roomId));
        } catch (err) {
            setError(getErrorMessage(err, "Não foi possível gerar o resumo."));
        } finally {
            setLoading(null);
        }
    }, [roomId]);

    const suggest = useCallback(
        async (messageId?: string) => {
            setLoading("suggestions");
            setError(null);
            try {
                const result = await suggestReplies(
                    roomId,
                    messageId ? { messageId } : {},
                );
                setSuggestions(result.suggestions);
            } catch (err) {
                setError(
                    getErrorMessage(err, "Não foi possível sugerir respostas."),
                );
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
