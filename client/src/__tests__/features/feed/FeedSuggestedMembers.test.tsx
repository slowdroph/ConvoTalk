import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FeedSuggestedMembers from "../../../features/feed/components/FeedSuggestedMembers";
import api from "../../../services/api";
import { createDirectRoom } from "../../../services/rooms";
import type { PublicUser } from "../../../types";

const { showToastMock } = vi.hoisted(() => ({
    showToastMock: vi.fn(),
}));

vi.mock("../../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("../../../hooks/useSocket", () => ({
    useSocket: () => ({
        onlineUsers: [{ userId: "u1", name: "Ana" }],
    }),
}));

vi.mock("../../../services/rooms", () => ({
    createDirectRoom: vi.fn(),
}));

vi.mock("../../../services/api", () => ({
    default: { get: vi.fn() },
}));

const getMock = vi.mocked(api.get);
const createDirectRoomMock = vi.mocked(createDirectRoom);

const members: PublicUser[] = [
    {
        _id: "u1",
        name: "Ana",
        publicId: "ANA1",
        avatar: "",
        status: "",
        country: "",
    },
    {
        _id: "u2",
        name: "Bob",
        publicId: "BOB1",
        avatar: "",
        status: "",
        country: "",
    },
];

describe("FeedSuggestedMembers", () => {
    beforeEach(() => {
        showToastMock.mockReset();
        getMock.mockReset();
        createDirectRoomMock.mockReset();
        getMock.mockResolvedValue({ data: members } as never);
    });

    it("mostra a contagem de membros online", async () => {
        render(
            <FeedSuggestedMembers
                onOpenProfile={vi.fn()}
                onConversationCreated={vi.fn()}
            />,
        );

        expect(await screen.findByText("Ana")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("1 online")).toBeInTheDocument();
    });

    it("inicia uma conversa com o membro escolhido", async () => {
        createDirectRoomMock.mockResolvedValue({ _id: "room-1" } as never);
        const onConversationCreated = vi.fn();

        render(
            <FeedSuggestedMembers
                onOpenProfile={vi.fn()}
                onConversationCreated={onConversationCreated}
            />,
        );

        fireEvent.click(
            await screen.findByRole("button", {
                name: "Conversar com Ana",
            }),
        );

        await waitFor(() =>
            expect(createDirectRoomMock).toHaveBeenCalledWith("u1"),
        );
        expect(onConversationCreated).toHaveBeenCalledWith("room-1");
    });

    it("abre o perfil do membro ao clicar no nome", async () => {
        const onOpenProfile = vi.fn();

        render(
            <FeedSuggestedMembers
                onOpenProfile={onOpenProfile}
                onConversationCreated={vi.fn()}
            />,
        );

        fireEvent.click(
            await screen.findByRole("button", {
                name: "Abrir perfil de Bob",
            }),
        );

        expect(onOpenProfile).toHaveBeenCalledWith(members[1]);
    });
});
