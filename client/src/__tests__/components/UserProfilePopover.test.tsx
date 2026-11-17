import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserProfilePopover from "../../components/ui/UserProfilePopover";
import api from "../../services/api";

vi.mock("../../services/api", () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: { country: "" } }),
    },
}));

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

function renderPopover() {
    return render(
        <MemoryRouter>
            <UserProfilePopover
                userId="u1"
                name="Ana"
                avatar=""
                publicId="ABCD1234"
                status="em reunião"
                isOnline={true}
            >
                <span>Ana</span>
            </UserProfilePopover>
        </MemoryRouter>,
    );
}

function hover(target: HTMLElement) {
    fireEvent.mouseEnter(target);
    act(() => {
        vi.advanceTimersByTime(400);
    });
}

describe("UserProfilePopover", () => {
    it("renderiza o conteúdo filho normalmente", () => {
        renderPopover();
        expect(screen.getByText("Ana")).toBeInTheDocument();
        expect(screen.queryByText("em reunião")).not.toBeInTheDocument();
    });

    it("abre o popover após o delay de hover", () => {
        renderPopover();
        hover(screen.getByText("Ana"));
        expect(screen.getByText("em reunião")).toBeInTheDocument();
        expect(screen.getByText("Online")).toBeInTheDocument();
    });

    it("linka para a página completa do perfil", () => {
        renderPopover();
        hover(screen.getByText("Ana"));
        expect(
            screen.getByRole("link", { name: "Ver perfil completo" }),
        ).toHaveAttribute("href", "/profile/u1");
    });

    it("não abre popover quando falta userId ou name", () => {
        render(
            <MemoryRouter>
                <UserProfilePopover name="">
                    <span>filho</span>
                </UserProfilePopover>
            </MemoryRouter>,
        );
        expect(screen.getByText("filho")).toBeInTheDocument();
        expect(screen.queryByText("Online")).not.toBeInTheDocument();
    });

    it("mostra status offline quando não online", () => {
        render(
            <MemoryRouter>
                <UserProfilePopover userId="u2" name="Bruno" isOnline={false}>
                    <span>Bruno</span>
                </UserProfilePopover>
            </MemoryRouter>,
        );
        hover(screen.getByText("Bruno"));
        expect(screen.getByText("Offline")).toBeInTheDocument();
    });

    it("exibe o país quando a API retorna country", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({
            data: { country: "BR" },
        });
        renderPopover();
        hover(screen.getByText("Ana"));
        await act(async () => {
            await Promise.resolve();
        });
        expect(screen.getByText("Brasil")).toBeInTheDocument();
    });

    it("não renderiza linha fantasma para country desconhecido", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({
            data: { country: "QQ" },
        });
        const { container } = renderPopover();
        hover(screen.getByText("Ana"));
        await act(async () => {
            await Promise.resolve();
        });
        const paragraphs = [...container.querySelectorAll("p")];
        expect(paragraphs.some((p) => p.textContent === "")).toBe(false);
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
});
