import api from "../../../services/api";
import type {
    AiSuggestRepliesPayload,
    AiSuggestRepliesRequest,
    AiSummaryPayload,
    AiSummarizeRequest,
} from "@shared/types";

export async function summarizeRoom(
    roomId: string,
    options: AiSummarizeRequest = {},
): Promise<AiSummaryPayload> {
    const { data } = await api.post<AiSummaryPayload>(
        `/ai/rooms/${roomId}/summarize`,
        options,
    );
    return data;
}

export async function suggestReplies(
    roomId: string,
    options: AiSuggestRepliesRequest = {},
): Promise<AiSuggestRepliesPayload> {
    const { data } = await api.post<AiSuggestRepliesPayload>(
        `/ai/rooms/${roomId}/suggest-replies`,
        options,
    );
    return data;
}
