import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DropdownMenu from "../../components/ui/DropdownMenu";

function setup({
    align = "right",
    onClose = vi.fn(),
    onSelect = vi.fn(),
}: {
    align?: "left" | "right";
    onClose?: () => void;
    onSelect?: () => void;
} = {}) {
    render(
        <DropdownMenu
            align={align}
            onClose={onClose}
            trigger={({ onClick, ...ariaProps }) => (
                <button type="button" onClick={onClick} {...ariaProps}>
                    Open menu
                </button>
            )}
        >
            <button type="button" role="menuitem" onClick={onSelect}>
                First item
            </button>
        </DropdownMenu>,
    );

    return {
        trigger: screen.getByRole("button", { name: "Open menu" }),
        onClose,
        onSelect,
    };
}

describe("DropdownMenu", () => {
    it("renders the panel in a portal outside the trigger tree", () => {
        const { trigger } = setup();

        expect(trigger).toHaveAttribute("aria-expanded", "false");

        fireEvent.click(trigger);

        const menu = screen.getByRole("menu");

        expect(menu.parentElement).toBe(document.body);
        expect(trigger).toHaveAttribute("aria-expanded", "true");
        expect(trigger).toHaveAttribute("aria-controls", menu.id);
        expect(menu).toHaveClass("fixed");
        expect(menu.style.visibility).toBe("visible");
    });

    it("closes after selecting an item and calls onClose", () => {
        const onSelect = vi.fn();
        const onClose = vi.fn();
        const { trigger } = setup({ onSelect, onClose });

        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole("menuitem", { name: "First item" }));

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("closes on Escape", () => {
        const { trigger } = setup();

        fireEvent.click(trigger);
        expect(screen.getByRole("menu")).toBeInTheDocument();

        fireEvent.keyDown(document, { key: "Escape" });

        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("closes on outside pointer down but stays open inside", () => {
        const { trigger } = setup();

        fireEvent.click(trigger);
        const menu = screen.getByRole("menu");

        fireEvent.pointerDown(menu);
        expect(screen.getByRole("menu")).toBeInTheDocument();

        fireEvent.pointerDown(document.body);
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("positions the panel below the trigger with a viewport margin", () => {
        const { trigger } = setup();

        fireEvent.click(trigger);
        const menu = screen.getByRole("menu");

        expect(menu.style.top).toBe("12px");
        expect(menu.style.left).toBe("12px");
    });

    it("closes when the trigger is clicked again", () => {
        const { trigger } = setup();

        fireEvent.click(trigger);
        fireEvent.click(trigger);

        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
});
