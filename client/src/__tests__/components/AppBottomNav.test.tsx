import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppBottomNav from "../../components/Navigation/AppBottomNav";

const { useRoomsMock } = vi.hoisted(() => ({
    useRoomsMock: vi.fn(),
}));

vi.mock("../../hooks/useRooms", () => ({
    useRooms: useRoomsMock,
}));

function renderNav(path = "/chat") {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <AppBottomNav />
        </MemoryRouter>,
    );
}

describe("AppBottomNav", () => {
    beforeEach(() => {
        useRoomsMock.mockReturnValue({ totalUnread: 0 });
    });

    it("renderiza os destinos e o atalho de ajustes", () => {
        renderNav();

        ["Chat", "Feed", "Descobrir", "Perfil", "Ajustes"].forEach((label) => {
            expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
        });
        expect(screen.getByRole("link", { name: "Ajustes" })).toHaveAttribute(
            "href",
            "/settings",
        );
    });

    it("marca o chat como ativo inclusive dentro de uma conversa", () => {
        renderNav("/chat/room-1");

        expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute(
            "aria-current",
            "page",
        );
        expect(
            screen.getByRole("link", { name: "Feed" }),
        ).not.toHaveAttribute("aria-current");
    });

    it("mostra o total de não lidas no chat", () => {
        useRoomsMock.mockReturnValue({ totalUnread: 12 });
        renderNav();

        expect(screen.getByText("12")).toBeInTheDocument();
    });
});
