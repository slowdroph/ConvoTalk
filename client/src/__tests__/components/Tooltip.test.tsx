import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import Tooltip from "../../components/ui/Tooltip";

function renderTooltip(props?: {
    content?: string;
    delay?: number;
    disabled?: boolean;
}) {
    return render(
        <Tooltip content="Dica" {...props}>
            <button type="button">Ação</button>
        </Tooltip>,
    );
}

afterEach(() => {
    vi.useRealTimers();
});

describe("Tooltip", () => {
    it("exibe após o delay configurado no hover", () => {
        vi.useFakeTimers();
        renderTooltip();

        const button = screen.getByRole("button", { name: "Ação" });
        fireEvent.mouseOver(button);

        act(() => {
            vi.advanceTimersByTime(299);
        });
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(screen.getByRole("tooltip")).toHaveTextContent("Dica");
    });

    it("oculta ao sair do hover", () => {
        vi.useFakeTimers();
        renderTooltip({ delay: 0 });

        const button = screen.getByRole("button", { name: "Ação" });
        fireEvent.mouseOver(button);
        act(() => {
            vi.advanceTimersByTime(0);
        });
        expect(screen.getByRole("tooltip")).toBeInTheDocument();

        fireEvent.mouseOut(button);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("exibe imediatamente ao focar pelo teclado e associa o aria-describedby", () => {
        renderTooltip();

        const button = screen.getByRole("button", { name: "Ação" });
        act(() => {
            button.focus();
        });

        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toHaveTextContent("Dica");
        expect(button).toHaveAttribute("aria-describedby", tooltip.id);
    });

    it("fecha com Escape", () => {
        vi.useFakeTimers();
        renderTooltip({ delay: 0 });

        const button = screen.getByRole("button", { name: "Ação" });
        fireEvent.mouseOver(button);
        act(() => {
            vi.advanceTimersByTime(0);
        });
        expect(screen.getByRole("tooltip")).toBeInTheDocument();

        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("não exibe quando desabilitado", () => {
        vi.useFakeTimers();
        renderTooltip({ disabled: true });

        fireEvent.mouseOver(screen.getByRole("button", { name: "Ação" }));
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("não exibe quando o conteúdo está vazio", () => {
        vi.useFakeTimers();
        renderTooltip({ content: "" });

        fireEvent.mouseOver(screen.getByRole("button", { name: "Ação" }));
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("preserva o clique do elemento filho", () => {
        const onClick = vi.fn();
        render(
            <Tooltip content="Dica">
                <button type="button" onClick={onClick}>
                    Ação
                </button>
            </Tooltip>,
        );

        fireEvent.click(screen.getByRole("button", { name: "Ação" }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
