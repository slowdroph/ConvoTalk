import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FeedSearchBar from "../../../features/feed/components/FeedSearchBar";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("FeedSearchBar", () => {
    it("dispara a busca apenas após o debounce", () => {
        const onSearch = vi.fn();
        render(<FeedSearchBar value="" onSearch={onSearch} />);

        const input = screen.getByLabelText("Buscar no feed");
        fireEvent.change(input, { target: { value: "react" } });

        expect(onSearch).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(350);
        });

        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith("react");
    });

    it("não busca novamente quando o valor já está aplicado", () => {
        const onSearch = vi.fn();
        render(<FeedSearchBar value="react" onSearch={onSearch} />);

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(onSearch).not.toHaveBeenCalled();
    });

    it("sincroniza o campo quando o valor externo muda", () => {
        const onSearch = vi.fn();
        const { rerender } = render(
            <FeedSearchBar value="" onSearch={onSearch} />,
        );

        rerender(<FeedSearchBar value="#webrtc" onSearch={onSearch} />);

        expect(screen.getByLabelText("Buscar no feed")).toHaveValue("#webrtc");
    });

    it("limpa a busca imediatamente", () => {
        const onSearch = vi.fn();
        render(<FeedSearchBar value="react" onSearch={onSearch} />);

        fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }));

        expect(onSearch).toHaveBeenCalledWith("");
        expect(screen.getByLabelText("Buscar no feed")).toHaveValue("");
    });

    it("submete a busca imediatamente ao pressionar Enter", () => {
        const onSearch = vi.fn();
        render(<FeedSearchBar value="" onSearch={onSearch} />);

        const input = screen.getByLabelText("Buscar no feed");
        fireEvent.change(input, { target: { value: "webrtc" } });
        fireEvent.submit(screen.getByRole("search"));

        expect(onSearch).toHaveBeenCalledWith("webrtc");
    });
});
