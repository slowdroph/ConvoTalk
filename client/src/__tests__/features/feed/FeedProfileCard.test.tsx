import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FeedProfileCard from "../../../features/feed/components/FeedProfileCard";
import type { User } from "../../../types";

const { showToastMock } = vi.hoisted(() => ({
    showToastMock: vi.fn(),
}));

vi.mock("../../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

const user: User = {
    _id: "me",
    name: "Ana",
    publicId: "ABC123",
    email: "ana@test.com",
    avatar: "",
    status: "",
    country: "",
};

const writeText = vi.fn().mockResolvedValue(undefined);

describe("FeedProfileCard", () => {
    beforeEach(() => {
        showToastMock.mockReset();
        writeText.mockReset();
        writeText.mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText },
            configurable: true,
        });
    });

    it("mostra estatísticas do perfil e status de presença", () => {
        render(
            <FeedProfileCard
                user={user}
                online
                stats={{ postCount: 12, totalLikes: 148 }}
            />,
        );

        expect(screen.getByText("Ana")).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();
        expect(screen.getByText("148")).toBeInTheDocument();
        expect(screen.getByText("Publicações")).toBeInTheDocument();
        expect(screen.getByText("Curtidas")).toBeInTheDocument();
        expect(screen.getByText(/Disponível/)).toBeInTheDocument();
    });

    it("copia o ID público ao clicar", async () => {
        render(
            <FeedProfileCard
                user={user}
                online
                stats={{ postCount: 0, totalLikes: 0 }}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Copiar ID" }));

        await waitFor(() => expect(writeText).toHaveBeenCalledWith("#ABC123"));
        expect(showToastMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
        );
    });

    it("mostra offline quando o usuário não está conectado", () => {
        render(
            <FeedProfileCard
                user={user}
                online={false}
                stats={{ postCount: 0, totalLikes: 0 }}
            />,
        );

        expect(screen.getByText(/Offline/)).toBeInTheDocument();
    });
});
