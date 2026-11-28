import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VerificationBanner from "../../components/Auth/VerificationBanner";

const { authState, refreshUserMock, showToastMock, postMock } = vi.hoisted(() => ({
    authState: {
        current: null as null | {
            _id: string;
            name: string;
            email: string;
            publicId: string;
            avatar: string;
            verified: boolean;
            messageQuota: {
                limit: number;
                used: number;
                remaining: number;
                resetAt: string;
            } | null;
        },
    },
    refreshUserMock: vi.fn(),
    showToastMock: vi.fn(),
    postMock: vi.fn(),
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: () => ({
        user: authState.current,
        refreshUser: refreshUserMock,
    }),
}));

vi.mock("../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("../../services/api", () => ({
    default: { post: postMock },
}));

function makeUser(overrides: Record<string, unknown> = {}) {
    return {
        _id: "u1",
        name: "Teste",
        email: "teste@test.com",
        publicId: "TESTE123",
        avatar: "",
        verified: false,
        messageQuota: {
            limit: 20,
            used: 0,
            remaining: 20,
            resetAt: "2026-11-29T00:00:00.000Z",
        },
        ...overrides,
    };
}

function renderBanner() {
    return render(
        <MemoryRouter>
            <VerificationBanner />
        </MemoryRouter>,
    );
}

describe("VerificationBanner", () => {
    beforeEach(() => {
        authState.current = makeUser();
        refreshUserMock.mockReset();
        showToastMock.mockReset();
        postMock.mockReset();
        postMock.mockResolvedValue({ data: {} });
    });

    it("não aparece para usuário verificado", () => {
        authState.current = makeUser({ verified: true, messageQuota: null });
        renderBanner();

        expect(
            screen.queryByText("Seu email ainda não foi confirmado"),
        ).not.toBeInTheDocument();
    });

    it("mostra a cota restante para usuário não verificado", () => {
        authState.current = makeUser({
            messageQuota: {
                limit: 20,
                used: 7,
                remaining: 13,
                resetAt: "2026-11-29T00:00:00.000Z",
            },
        });
        renderBanner();

        expect(
            screen.getByText("Seu email ainda não foi confirmado"),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Você pode usar o ConvoTalk com limites: a edição do perfil está bloqueada e você tem 20 mensagens por dia.",
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText("13 de 20 mensagens restantes hoje"),
        ).toBeInTheDocument();
    });

    it("avisa quando o limite diário foi atingido", () => {
        authState.current = makeUser({
            messageQuota: {
                limit: 20,
                used: 20,
                remaining: 0,
                resetAt: "2026-11-29T00:00:00.000Z",
            },
        });
        renderBanner();

        expect(
            screen.getByText(
                "Limite diário de mensagens atingido. Confirme seu email para continuar conversando.",
            ),
        ).toBeInTheDocument();
    });

    it("reenvia o email de confirmação", async () => {
        renderBanner();

        fireEvent.click(screen.getByRole("button", { name: "Reenviar email" }));

        await waitFor(() =>
            expect(postMock).toHaveBeenCalledWith(
                "/auth/resend-verification",
                { email: "teste@test.com" },
            ),
        );
        expect(showToastMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
        );
    });

    it("verifica novamente ao clicar em já confirmei", async () => {
        renderBanner();

        fireEvent.click(
            screen.getByRole("button", { name: "Já confirmei" }),
        );

        await waitFor(() => expect(refreshUserMock).toHaveBeenCalled());
    });
});
