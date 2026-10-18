import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserProfileModal from "../../components/ui/UserProfileModal";
import api from "../../services/api";
import { createDirectRoom } from "../../services/rooms";

vi.mock("../../services/api", () => ({
    default: { get: vi.fn() },
}));

vi.mock("../../services/rooms", () => ({
    createDirectRoom: vi.fn(),
}));

vi.mock("../../hooks/useSocket", () => ({
    useSocket: () => ({ onlineUsers: [] }),
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: () => ({ user: { _id: "me" } }),
}));

const profile = {
    _id: "u1",
    name: "Ana",
    publicId: "ABCD1234",
    avatar: "",
    status: "em reunião",
    country: "BR",
    city: "São Paulo",
    lastSeen: "2020-01-01T00:00:00.000Z",
    createdAt: "2024-05-15T12:00:00.000Z",
};

beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(createDirectRoom).mockReset();
});

describe("UserProfileModal", () => {
    it("não renderiza nada quando fechado", () => {
        render(
            <UserProfileModal
                isOpen={false}
                userId="u1"
                onClose={() => {}}
                onConversationCreated={() => {}}
            />,
        );
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renderiza os dados do perfil carregado", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: profile });
        render(
            <UserProfileModal
                isOpen
                userId="u1"
                onClose={() => {}}
                onConversationCreated={() => {}}
            />,
        );

        expect(await screen.findByText("Ana")).toBeInTheDocument();
        expect(screen.getByText("#ABCD1234")).toBeInTheDocument();
        expect(screen.getByText("em reunião")).toBeInTheDocument();
        expect(screen.getByText("São Paulo, Brasil")).toBeInTheDocument();
        expect(screen.getByText("maio de 2024")).toBeInTheDocument();
    });

    it("inicia conversa e notifica com o id da sala", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: profile });
        vi.mocked(createDirectRoom).mockResolvedValueOnce({ _id: "r1" } as never);
        const onConversationCreated = vi.fn();
        const onClose = vi.fn();

        render(
            <UserProfileModal
                isOpen
                userId="u1"
                onClose={onClose}
                onConversationCreated={onConversationCreated}
            />,
        );

        fireEvent.click(
            await screen.findByRole("button", { name: /iniciar conversa/i }),
        );

        await waitFor(() =>
            expect(onConversationCreated).toHaveBeenCalledWith("r1"),
        );
        expect(createDirectRoom).toHaveBeenCalledWith("u1");
    });

    it("mostra indisponível e desabilita o botão em 404", async () => {
        vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 404 } });
        render(
            <UserProfileModal
                isOpen
                userId="u1"
                onClose={() => {}}
                onConversationCreated={() => {}}
            />,
        );

        expect(
            await screen.findByText("Perfil indisponível."),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /iniciar conversa/i }),
        ).toBeDisabled();
    });
});
