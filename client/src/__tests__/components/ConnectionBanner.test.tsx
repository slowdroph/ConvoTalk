import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConnectionBanner from "../../components/Chat/ConnectionBanner";
import { SocketContext } from "../../contexts/SocketContext";

function renderBanner(overrides?: {
    connected?: boolean;
    reconnecting?: boolean;
    reconnectAttempt?: number;
    hasConnectedOnce?: boolean;
}) {
    const value = {
        socket: null,
        onlineUsers: [],
        connected: overrides?.connected ?? false,
        reconnecting: overrides?.reconnecting ?? false,
        reconnectAttempt: overrides?.reconnectAttempt ?? 0,
        hasConnectedOnce: overrides?.hasConnectedOnce ?? true,
    };
    return render(
        <SocketContext.Provider value={value}>
            <ConnectionBanner />
        </SocketContext.Provider>,
    );
}

describe("ConnectionBanner", () => {
    it("não renderiza nada quando conectado", () => {
        renderBanner({ connected: true });
        expect(
            screen.queryByText(/Conex.*perdida/i),
        ).not.toBeInTheDocument();
    });

    it("não mostra nada no primeiro carregamento antes de conectar", () => {
        renderBanner({ hasConnectedOnce: false, reconnecting: false });
        expect(
            screen.queryByText(/Sem conex.o/i),
        ).not.toBeInTheDocument();
    });

    it("mostra tentativa de reconexão quando reconectando", () => {
        renderBanner({ reconnecting: true, reconnectAttempt: 3 });
        expect(
            screen.getByText(/Tentando reconectar \(3\/20\)/i),
        ).toBeInTheDocument();
    });

    it("mostra mensagem de sem conexão e botão quando falhou", () => {
        renderBanner({ reconnecting: false, reconnectAttempt: 0 });
        expect(
            screen.getByText(/Sem conex.o/i),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Reconectar/i }),
        ).toBeInTheDocument();
    });

    it("recarrega a página ao clicar em reconectar", async () => {
        const originalLocation = window.location;
        const reloadSpy = vi.fn();
        Object.defineProperty(window, "location", {
            writable: true,
            value: { ...window.location, reload: reloadSpy },
        });

        try {
            const user = userEvent.setup();
            renderBanner({ reconnecting: false });
            await user.click(
                screen.getByRole("button", { name: /Reconectar/i }),
            );
            expect(reloadSpy).toHaveBeenCalled();
        } finally {
            Object.defineProperty(window, "location", {
                writable: true,
                value: originalLocation,
            });
        }
    });
});