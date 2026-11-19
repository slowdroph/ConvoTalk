import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppRail from "../../components/Navigation/AppRail";

const { logoutMock, useRoomsMock } = vi.hoisted(() => ({
    logoutMock: vi.fn(),
    useRoomsMock: vi.fn(),
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: () => ({
        user: { _id: "me", name: "Ana", avatar: "" },
        logout: logoutMock,
    }),
}));

vi.mock("../../hooks/useRooms", () => ({
    useRooms: useRoomsMock,
}));

function renderRail(path = "/chat") {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <AppRail />
        </MemoryRouter>,
    );
}

describe("AppRail", () => {
    beforeEach(() => {
        logoutMock.mockReset();
        useRoomsMock.mockReturnValue({ totalUnread: 0 });
    });

    it("renderiza os destinos principais e as configurações", () => {
        renderRail();

        expect(screen.getByRole("link", { name: /Chat/ })).toHaveAttribute(
            "href",
            "/chat",
        );
        expect(screen.getByRole("link", { name: /Feed/ })).toHaveAttribute(
            "href",
            "/feed",
        );
        expect(screen.getByRole("link", { name: /Perfil/ })).toHaveAttribute(
            "href",
            "/profile",
        );
        expect(
            screen.getByRole("link", { name: /Ajustes/ }),
        ).toHaveAttribute("href", "/settings");
    });

    it("marca apenas o destino atual como ativo", () => {
        renderRail("/feed");

        expect(screen.getByRole("link", { name: /Feed/ })).toHaveAttribute(
            "aria-current",
            "page",
        );
        expect(
            screen.getByRole("link", { name: /Chat/ }),
        ).not.toHaveAttribute("aria-current");
    });

    it("mostra o total de não lidas no chat", () => {
        useRoomsMock.mockReturnValue({ totalUnread: 3 });
        renderRail();

        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("sai da conta ao clicar em sair", () => {
        renderRail();

        screen.getByRole("button", { name: "Sair da conta" }).click();

        expect(logoutMock).toHaveBeenCalled();
    });
});
