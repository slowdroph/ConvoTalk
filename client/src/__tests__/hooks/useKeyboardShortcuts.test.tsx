import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    useKeyboardShortcuts,
    type ShortcutBinding,
} from "../../hooks/useKeyboardShortcuts";

function Harness({ bindings }: { bindings: ShortcutBinding[] }) {
    useKeyboardShortcuts(bindings);
    return (
        <>
            <input aria-label="campo" />
            <div>area</div>
        </>
    );
}

function fireKey(key: string, modifiers: Partial<KeyboardEvent> = {}) {
    window.dispatchEvent(
        new KeyboardEvent("keydown", {
            key,
            bubbles: true,
            cancelable: true,
            ...modifiers,
        }),
    );
}

describe("useKeyboardShortcuts", () => {
    it("dispara handler quando a tecla corresponde", () => {
        const handler = vi.fn();
        render(<Harness bindings={[{ key: "Escape", handler }]} />);
        fireKey("Escape");
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("não dispara atalho com modificador quando ele não é exigido", () => {
        const handler = vi.fn();
        render(
            <Harness
                bindings={[{ key: "1", ctrl: true, handler }]}
            />,
        );
        fireKey("1");
        expect(handler).not.toHaveBeenCalled();
    });

    it("dispara Ctrl+tecla somente quando ctrl=true", () => {
        const handler = vi.fn();
        render(
            <Harness
                bindings={[{ key: "1", ctrl: true, handler }]}
            />,
        );
        fireKey("1", { ctrlKey: true });
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("ignora atalho quando disabled", () => {
        const handler = vi.fn();
        render(
            <Harness
                bindings={[{ key: "Escape", handler, enabled: false }]}
            />,
        );
        fireKey("Escape");
        expect(handler).not.toHaveBeenCalled();
    });

    it("não dispara tecla simples enquanto digita no input", () => {
        const handler = vi.fn();
        render(<Harness bindings={[{ key: "a", handler }]} />);
        const input = screen.getByLabelText("campo");
        input.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "a",
                bubbles: true,
                cancelable: true,
            }),
        );
        expect(handler).not.toHaveBeenCalled();
    });

    it("dispara atalho com modificador mesmo enquanto digita", async () => {
        const handler = vi.fn();
        const user = userEvent.setup();
        render(
            <Harness bindings={[{ key: "1", ctrl: true, handler }]} />,
        );
        const input = screen.getByLabelText("campo");
        await user.click(input);
        act(() => {
            fireKey("1", { ctrlKey: true });
        });
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("remove o listener ao desmontar", () => {
        const handler = vi.fn();
        const { unmount } = render(
            <Harness bindings={[{ key: "Escape", handler }]} />,
        );
        unmount();
        fireKey("Escape");
        expect(handler).not.toHaveBeenCalled();
    });
});
