import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageInput from "../../components/Chat/MessageInput";
import { queuePendingMessage } from "../../lib/offlineStorage";

const { authState } = vi.hoisted(() => ({
    authState: {
        current: {
            _id: "u1",
            name: "Teste",
            avatar: "",
            status: "",
            verified: true,
            messageQuota: null,
        } as {
            _id: string;
            name: string;
            avatar: string;
            status: string;
            verified: boolean;
            messageQuota: {
                limit: number;
                used: number;
                remaining: number;
                resetAt: string;
            } | null;
        },
    },
}));

vi.mock("../../hooks/useSocket", () => ({
    useSocket: () => ({ socket: null, connected: false }),
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: () => ({ user: authState.current }),
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

const exhaustedQuota = {
    limit: 20,
    used: 20,
    remaining: 0,
    resetAt: "2026-11-29T00:00:00.000Z",
};

describe("MessageInput", () => {
    beforeEach(() => {
        authState.current = {
            _id: "u1",
            name: "Teste",
            avatar: "",
            status: "",
            verified: true,
            messageQuota: null,
        };
        vi.mocked(queuePendingMessage).mockClear();
    });
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

    it("bloqueia o envio quando a cota diária acabou", async () => {
        authState.current = {
            ...authState.current,
            verified: false,
            messageQuota: exhaustedQuota,
        };
        const user = userEvent.setup();
        render(<MessageInput roomId="room-1" />);

        const textbox = screen.getByRole("textbox", {
            name: "Escrever mensagem",
        });
        expect(textbox).toHaveAttribute(
            "placeholder",
            "Limite diário de mensagens atingido",
        );

        await user.type(textbox, "Olá");
        await user.keyboard("{Enter}");

        await waitFor(() =>
            expect(
                screen.getByText(
                    "Você atingiu o limite diário de mensagens. Confirme seu email para continuar conversando.",
                ),
            ).toBeInTheDocument(),
        );
        expect(queuePendingMessage).not.toHaveBeenCalled();
    });

    it("permite escrever normalmente enquanto há cota disponível", async () => {
        authState.current = {
            ...authState.current,
            verified: false,
            messageQuota: { ...exhaustedQuota, used: 19, remaining: 1 },
        };
        render(<MessageInput roomId="room-1" />);

        expect(
            screen.getByRole("textbox", { name: "Escrever mensagem" }),
        ).toHaveAttribute("placeholder", "Digite sua mensagem...");
    });
});
