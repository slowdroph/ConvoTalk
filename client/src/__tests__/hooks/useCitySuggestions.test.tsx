import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCitySuggestions } from "../../hooks/useCitySuggestions";

// Timeout folgado: sob suíte completa o import do chunk JSON pode demorar
// mais que o default de 1s e causar flake.
const WAIT_OPTS = { timeout: 5000 };

describe("useCitySuggestions", () => {
    it("retorna vazio quando país é vazio", () => {
        const { result } = renderHook(() => useCitySuggestions("", "São"));
        expect(result.current).toEqual({ suggestions: [], loading: false });
    });

    it("retorna vazio quando query tem menos de 1 caractere", async () => {
        const { result } = renderHook(() => useCitySuggestions("BR", " "));
        expect(result.current.suggestions).toEqual([]);
    });

    it("sugere cidades por prefixo normalizado", async () => {
        const { result } = renderHook(() => useCitySuggestions("BR", "sao"));
        await waitFor(
            () => expect(result.current.loading).toBe(false),
            WAIT_OPTS,
        );
        expect(result.current.suggestions).toContain("São Paulo");
    });

    it("ignora acentos e caixa na query", async () => {
        const { result } = renderHook(() => useCitySuggestions("BR", "SÃO PAUL"));
        await waitFor(
            () => expect(result.current.loading).toBe(false),
            WAIT_OPTS,
        );
        expect(result.current.suggestions).toContain("São Paulo");
    });

    it("retorna vazio para país sem dataset, sem erro", async () => {
        const { result } = renderHook(() => useCitySuggestions("ZZ", "algu"));
        await waitFor(
            () => expect(result.current.loading).toBe(false),
            WAIT_OPTS,
        );
        expect(result.current.suggestions).toEqual([]);
    });

    it("limpa sugestões ao trocar de país", async () => {
        const { result, rerender } = renderHook(
            ({ c }) => useCitySuggestions(c, "san"),
            { initialProps: { c: "BR" } },
        );
        await waitFor(
            () => expect(result.current.loading).toBe(false),
            WAIT_OPTS,
        );
        expect(result.current.suggestions.length).toBeGreaterThan(0);

        rerender({ c: "AR" });
        await waitFor(
            () => expect(result.current.loading).toBe(false),
            WAIT_OPTS,
        );
        expect(result.current.suggestions).not.toContain("Santos");
    });

    it("limita a 8 sugestões", async () => {
        const { result } = renderHook(() => useCitySuggestions("BR", "s"));
        await waitFor(
            () => expect(result.current.loading).toBe(false),
            WAIT_OPTS,
        );
        expect(result.current.suggestions.length).toBeLessThanOrEqual(8);
    });

    it("reusa cache entre mounts do mesmo país", async () => {
        const first = renderHook(() => useCitySuggestions("BR", "sao"));
        await waitFor(
            () =>
                expect(first.result.current.suggestions).toContain("São Paulo"),
            WAIT_OPTS,
        );

        const second = renderHook(() => useCitySuggestions("BR", "rio"));
        expect(second.result.current.loading).toBe(false);
        expect(second.result.current.suggestions).toContain("Rio de Janeiro");
    });
});
