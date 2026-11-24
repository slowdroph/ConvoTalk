import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageInput from "../../components/Chat/MessageInput";

vi.mock("../../hooks/useSocket", () => ({
    useSocket: () => ({ socket: null, connected: false }),
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: () => ({
        user: { _id: "u1", name: "Teste", avatar: "", status: "" },
    }),
}));

vi.mock("../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("../../services/api", () => ({
    default: { post: vi.fn() },
}));

vi.mock("../../lib/offlineStorage", () => ({
    queuePendingMessage: vi.fn(),
}));

function getActionsButton() {
    return screen.getByRole("button", { name: "Ações da mensagem" });
}

describe("MessageInput", () => {
    it("mantém as ações recolhidas até o usuário abrir o menu", async () => {
        const user = userEvent.setup();
        render(<MessageInput roomId="room-1" />);

        const trigger = getActionsButton();
        expect(trigger).toHaveAttribute("aria-expanded", "false");

        await user.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "true");

        await user.keyboard("{Escape}");
        expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("fecha o menu de ações ao tocar fora dele", async () => {
        const user = userEvent.setup();
        render(<MessageInput roomId="room-1" />);

        const trigger = getActionsButton();
        await user.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "true");

        await user.click(
            screen.getByRole("textbox", { name: "Escrever mensagem" }),
        );
        expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("mantém as ações acessíveis no desktop", () => {
        render(<MessageInput roomId="room-1" />);

        expect(getActionsButton()).toHaveAttribute(
            "aria-controls",
            "composer-actions",
        );
        expect(
            screen.getByRole("group", { name: "Ações da mensagem" }),
        ).toBeInTheDocument();
    });
});
