import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAssistant } from "../../../features/ai/hooks/useAssistant";
import { summarizeRoom, suggestReplies } from "../../../features/ai/services/ai";

vi.mock("../../../features/ai/services/ai", () => ({
    summarizeRoom: vi.fn(),
    suggestReplies: vi.fn(),
}));

const summarizeMock = vi.mocked(summarizeRoom);
const suggestMock = vi.mocked(suggestReplies);

describe("useAssistant", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("carrega o resumo da conversa", async () => {
        summarizeMock.mockResolvedValue({
            summary: "Resumo da conversa",
            keyPoints: ["ponto 1"],
            messageCount: 5,
            model: "test-model",
            generatedAt: new Date().toISOString(),
        });

        const { result } = renderHook(() => useAssistant("room-1"));

        await act(async () => {
            await result.current.summarize();
        });

        expect(result.current.summary?.summary).toBe("Resumo da conversa");
        expect(result.current.loading).toBeNull();
        expect(summarizeMock).toHaveBeenCalledWith("room-1", {
            regenerate: false,
        });
    });

    it("carrega sugestões de resposta", async () => {
        suggestMock.mockResolvedValue({
            suggestions: [{ tone: "friendly", text: "Combinado!" }],
            model: "test-model",
            generatedAt: new Date().toISOString(),
        });

        const { result } = renderHook(() => useAssistant("room-2"));

        await act(async () => {
            await result.current.suggest();
        });

        expect(result.current.suggestions).toHaveLength(1);
        expect(result.current.suggestions[0].text).toBe("Combinado!");
    });

    it("encaminha regenerate ao pedir novas sugestões", async () => {
        suggestMock.mockResolvedValue({
            suggestions: [{ tone: "short", text: "Outra resposta" }],
            model: "test-model",
            generatedAt: new Date().toISOString(),
        });

        const { result } = renderHook(() => useAssistant("room-4"));

        await act(async () => {
            await result.current.suggest({ regenerate: true });
        });

        expect(suggestMock).toHaveBeenCalledWith("room-4", {
            regenerate: true,
        });
    });

    it("expõe erro amigável quando a API falha", async () => {
        summarizeMock.mockRejectedValue("boom");

        const { result } = renderHook(() => useAssistant("room-3"));

        await act(async () => {
            await result.current.summarize();
        });

        await waitFor(() => {
            expect(result.current.error?.message).toBe(
                "Não foi possível gerar o resumo.",
            );
        });
        expect(result.current.error?.action).toBe("summarize");
        expect(result.current.summary).toBeNull();
    });
});
