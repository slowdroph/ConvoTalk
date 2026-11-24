import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SessionManager from "../../components/Settings/SessionManager";
import type { Session } from "../../types";

const { logoutMock, showToastMock, useSessionsMock } = vi.hoisted(() => ({
    logoutMock: vi.fn(),
    showToastMock: vi.fn(),
    useSessionsMock: vi.fn(),
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: () => ({ logout: logoutMock }),
}));

vi.mock("../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("../../hooks/useSessions", () => ({
    useSessions: useSessionsMock,
}));

const sessions: Session[] = [
    {
        _id: "current",
        deviceType: "desktop",
        deviceLabel: "Chrome",
        ip: "127.0.0.1",
        lastActiveAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        current: true,
    },
];

describe("SessionManager", () => {
    beforeEach(() => {
        logoutMock.mockReset();
        showToastMock.mockReset();
        useSessionsMock.mockReturnValue({
            sessions,
            loading: false,
            error: null,
            removeSession: vi.fn(),
            removeAllOtherSessions: vi.fn(),
        });
    });

    it("encerra a sessão atual em um único clique", () => {
        render(<SessionManager />);

        fireEvent.click(
            screen.getByRole("button", { name: "Sair desta conta" }),
        );

        expect(logoutMock).toHaveBeenCalledTimes(1);
    });

    it("mantém as ações das outras sessões", () => {
        useSessionsMock.mockReturnValue({
            sessions: [...sessions, { ...sessions[0], _id: "other", current: false }],
            loading: false,
            error: null,
            removeSession: vi.fn(),
            removeAllOtherSessions: vi.fn(),
        });

        render(<SessionManager />);

        expect(
            screen.getByRole("button", { name: "Encerrar sessão Chrome" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Sair desta conta" }),
        ).toBeInTheDocument();
    });
});
