import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DiscoverSearchBar from "../../../features/discover/components/DiscoverSearchBar";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("DiscoverSearchBar", () => {
    it("dispara a busca apenas após o debounce", () => {
        const onSearch = vi.fn();
        render(<DiscoverSearchBar value="" onSearch={onSearch} />);

        fireEvent.change(screen.getByLabelText("Buscar pessoas"), {
            target: { value: "ana" },
        });

        expect(onSearch).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith("ana");
    });

    it("mostra dica para busca curta", () => {
        render(<DiscoverSearchBar value="" onSearch={vi.fn()} />);

        fireEvent.change(screen.getByLabelText("Buscar pessoas"), {
            target: { value: "an" },
        });

        const input = screen.getByLabelText("Buscar pessoas");
        const hint = screen.getByText(
            "Digite pelo menos 3 caracteres para buscar.",
        );

        expect(hint).toBeInTheDocument();
        expect(input).toHaveAttribute("aria-describedby", hint.id);
    });

    it("limpa a busca imediatamente", () => {
        const onSearch = vi.fn();
        render(<DiscoverSearchBar value="ana" onSearch={onSearch} />);

        fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }));

        expect(onSearch).toHaveBeenCalledWith("");
        expect(screen.getByLabelText("Buscar pessoas")).toHaveValue("");
    });
});
