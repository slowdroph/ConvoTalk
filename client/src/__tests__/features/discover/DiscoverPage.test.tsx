import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DiscoverPage from "../../../pages/DiscoverPage";
import { getDiscoverUsers } from "../../../features/discover/services/discoverApi";
import { createDirectRoom } from "../../../services/rooms";
import type { DiscoverPage as DiscoverPagePayload } from "../../../types";

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

vi.mock("../../../features/discover/services/discoverApi", () => ({
    getDiscoverUsers: vi.fn(),
}));

const getDiscoverUsersMock = vi.mocked(getDiscoverUsers);
const createDirectRoomMock = vi.mocked(createDirectRoom);

const users: DiscoverPagePayload["users"] = [
    {
        _id: "u1",
        name: "Ana Souza",
        publicId: "ANA12345",
        avatar: "",
        status: "Olá",
        country: "BR",
        city: "São Paulo",
        bio: "Frontend e café.",
        interests: ["programming"],
        languages: ["pt", "en"],
        languageLevels: { pt: "native" },
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    },
    {
        _id: "u2",
        name: "Bob Lima",
        publicId: "BOB12345",
        avatar: "",
        status: "",
        country: "PT",
        city: "Lisboa",
        bio: "",
        interests: [],
        languages: ["pt"],
        languageLevels: {},
        lastSeen: null,
        createdAt: new Date().toISOString(),
    },
];

const suggestedPage: DiscoverPagePayload = {
    mode: "suggested",
    page: 1,
    hasMore: false,
    users,
};

function renderPage() {
    return render(
        <MemoryRouter initialEntries={["/discover"]}>
            <Routes>
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/chat/:roomId" element={<p>Chat aberto</p>} />
                <Route path="/profile/:userId" element={<p>Perfil aberto</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe("DiscoverPage", () => {
    beforeEach(() => {
        showToastMock.mockReset();
        getDiscoverUsersMock.mockReset();
        createDirectRoomMock.mockReset();
        getDiscoverUsersMock.mockResolvedValue(suggestedPage);
    });

    it("carrega sugestões ao abrir a página", async () => {
        renderPage();

        expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
        expect(screen.getByText("Sugestões para você")).toBeInTheDocument();
        expect(screen.getByText("#ANA12345")).toBeInTheDocument();
        expect(getDiscoverUsersMock).toHaveBeenCalledWith(
            expect.objectContaining({ page: 1, sort: "active" }),
            expect.any(AbortSignal),
        );
    });

    it("marca como online apenas usuários presentes no socket", async () => {
        renderPage();

        expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
        expect(
            screen.getByRole("status", { name: "Online" }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole("status", { name: "Online" })).toHaveLength(
            1,
        );
    });

    it("inicia uma conversa e navega para o chat", async () => {
        createDirectRoomMock.mockResolvedValue({ _id: "room-1" } as never);
        renderPage();

        const card = (await screen.findByText("Ana Souza")).closest("article");
        expect(card).not.toBeNull();
        fireEvent.click(
            within(card as HTMLElement).getByRole("button", {
                name: "Conversar",
            }),
        );

        await waitFor(() =>
            expect(createDirectRoomMock).toHaveBeenCalledWith("u1"),
        );
        expect(await screen.findByText("Chat aberto")).toBeInTheDocument();
    });

    it("abre o perfil do usuário", async () => {
        renderPage();

        fireEvent.click(
            await screen.findByRole("button", {
                name: "Ver perfil de Bob Lima",
            }),
        );

        expect(await screen.findByText("Perfil aberto")).toBeInTheDocument();
    });

    it("envia a busca após o debounce", async () => {
        renderPage();
        await screen.findByText("Ana Souza");

        fireEvent.change(screen.getByLabelText("Buscar pessoas"), {
            target: { value: "ana" },
        });

        await waitFor(
            () =>
                expect(getDiscoverUsersMock).toHaveBeenLastCalledWith(
                    expect.objectContaining({ q: "ana", page: 1 }),
                    expect.any(AbortSignal),
                ),
            { timeout: 3000 },
        );
    });

    it("envia os filtros aplicados", async () => {
        renderPage();
        await screen.findByText("Ana Souza");

        fireEvent.change(screen.getByLabelText("País"), {
            target: { value: "PT" },
        });

        await waitFor(
            () =>
                expect(getDiscoverUsersMock).toHaveBeenLastCalledWith(
                    expect.objectContaining({ country: "PT", page: 1 }),
                    expect.any(AbortSignal),
                ),
            { timeout: 3000 },
        );
    });

    it("mostra erro e permite tentar novamente", async () => {
        getDiscoverUsersMock.mockRejectedValueOnce(new Error("falhou"));
        renderPage();

        expect(await screen.findByText("falhou")).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Tentar novamente" }),
        );

        expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
    });
});
