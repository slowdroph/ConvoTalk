import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { RoomsProvider } from "../../providers/RoomsProvider";
import { useRooms } from "../../hooks/useRooms";
import api from "../../services/api";
import type { Message, Room } from "../../types";

const handlers: Record<string, (...args: unknown[]) => void> = {};

const socket = {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        handlers[event] = handler;
    }),
    off: vi.fn(),
};

vi.mock("../../services/api", () => ({
    default: { get: vi.fn() },
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: () => ({ user: { _id: "me", name: "Eu" } }),
}));

vi.mock("../../hooks/useSocket", () => ({
    useSocket: () => ({ socket, connected: true }),
}));

const apiGetMock = api.get as unknown as ReturnType<typeof vi.fn>;

const roomA = {
    _id: "r1",
    name: "Ana",
    description: "",
    type: "direct",
    participants: [],
    unreadCount: 2,
} as unknown as Room;

function Probe() {
    const { rooms, totalUnread, activeRoom, setActiveRoom, markRoomRead } =
        useRooms();

    return (
        <div>
            <span data-testid="total">{totalUnread}</span>
            <span data-testid="rooms">{rooms.length}</span>
            <span data-testid="active">{activeRoom ?? "none"}</span>
            <button type="button" onClick={() => setActiveRoom("r1")}>
                open-r1
            </button>
            <button type="button" onClick={() => markRoomRead("r1")}>
                read-r1
            </button>
        </div>
    );
}

function renderProvider() {
    return render(
        <RoomsProvider>
            <Probe />
        </RoomsProvider>,
    );
}

describe("RoomsProvider", () => {
    beforeEach(() => {
        for (const key of Object.keys(handlers)) delete handlers[key];
        socket.on.mockClear();
        socket.off.mockClear();
        apiGetMock.mockReset();
        apiGetMock.mockResolvedValue({ data: [roomA] });
    });

    it("carrega as salas e soma as não lidas", async () => {
        renderProvider();

        await waitFor(() =>
            expect(screen.getByTestId("total")).toHaveTextContent("2"),
        );
        expect(screen.getByTestId("rooms")).toHaveTextContent("1");
    });

    it("incrementa a contagem ao receber mensagem de outra sala", async () => {
        renderProvider();
        await waitFor(() =>
            expect(screen.getByTestId("total")).toHaveTextContent("2"),
        );

        act(() => {
            handlers.message({
                room: "r2",
                type: "text",
                sender: { _id: "outro" },
            } as unknown as Message);
        });

        expect(screen.getByTestId("total")).toHaveTextContent("3");
    });

    it("ignora mensagens da sala ativa", async () => {
        renderProvider();
        await waitFor(() =>
            expect(screen.getByTestId("rooms")).toHaveTextContent("1"),
        );

        act(() => {
            screen.getByRole("button", { name: "open-r1" }).click();
        });

        act(() => {
            handlers.message({
                room: "r1",
                type: "text",
                sender: { _id: "outro" },
            } as unknown as Message);
        });

        expect(screen.getByTestId("total")).toHaveTextContent("2");
    });

    it("zera a contagem ao marcar a sala como lida", async () => {
        renderProvider();
        await waitFor(() =>
            expect(screen.getByTestId("total")).toHaveTextContent("2"),
        );

        act(() => {
            screen.getByRole("button", { name: "read-r1" }).click();
        });

        expect(screen.getByTestId("total")).toHaveTextContent("0");
    });

    it("remove a sala ao receber room_deleted", async () => {
        renderProvider();
        await waitFor(() =>
            expect(screen.getByTestId("rooms")).toHaveTextContent("1"),
        );

        act(() => {
            handlers.room_deleted("r1");
        });

        expect(screen.getByTestId("rooms")).toHaveTextContent("0");
        expect(screen.getByTestId("total")).toHaveTextContent("0");
    });
});
