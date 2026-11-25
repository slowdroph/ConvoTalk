import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DiscoverUserCard from "../../../features/discover/components/DiscoverUserCard";
import type { DiscoverUser } from "../../../types";

const user: DiscoverUser = {
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
    languageLevels: { pt: "native", en: "advanced" },
    lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
};

function renderCard(
    props: Partial<{
        user: DiscoverUser;
        online: boolean;
        busy: boolean;
        starting: boolean;
        onStartConversation: (user: DiscoverUser) => void;
    }> = {},
) {
    const onStartConversation = props.onStartConversation ?? vi.fn();

    render(
        <MemoryRouter>
            <DiscoverUserCard
                user={props.user ?? user}
                online={props.online ?? false}
                busy={props.busy ?? false}
                starting={props.starting ?? false}
                onStartConversation={onStartConversation}
            />
        </MemoryRouter>,
    );

    return { onStartConversation };
}

describe("DiscoverUserCard", () => {
    it("mostra os dados públicos do usuário", () => {
        renderCard();

        expect(screen.getByText("Ana Souza")).toBeInTheDocument();
        expect(screen.getByText("#ANA12345")).toBeInTheDocument();
        expect(screen.getByText("São Paulo, Brasil")).toBeInTheDocument();
        expect(screen.getByText("Frontend e café.")).toBeInTheDocument();
        expect(screen.getByText("Programação & Open Source")).toBeInTheDocument();
        expect(screen.getByText("Português · Inglês")).toBeInTheDocument();
    });

    it("mostra presença somente quando online", () => {
        renderCard({ online: true });
        expect(screen.getByRole("status", { name: "Online" })).toBeInTheDocument();
    });

    it("mostra o último acesso quando offline", () => {
        renderCard({ online: false });
        expect(screen.getByText("Visto há 5 min")).toBeInTheDocument();
        expect(
            screen.queryByRole("status", { name: "Online" }),
        ).not.toBeInTheDocument();
    });

    it("usa data absoluta com rótulo para acessos antigos", () => {
        renderCard({
            user: {
                ...user,
                lastSeen: new Date(
                    Date.now() - 10 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
        });

        expect(
            screen.getByText(/Visto por último em \d{2}\/\d{2}\/\d{4}/),
        ).toBeInTheDocument();
    });

    it("abre o perfil pelo link do card", () => {
        renderCard();

        const link = screen.getByRole("link", {
            name: "Ver perfil de Ana Souza",
        });
        expect(link).toHaveAttribute("href", "/profile/u1");
    });

    it("expõe apenas dois pontos de foco", () => {
        renderCard();

        expect(screen.getAllByRole("link")).toHaveLength(1);
        expect(screen.getAllByRole("button")).toHaveLength(1);
    });

    it("inicia conversa ao clicar no botão", () => {
        const { onStartConversation } = renderCard();

        fireEvent.click(screen.getByRole("button", { name: "Conversar" }));

        expect(onStartConversation).toHaveBeenCalledWith(user);
    });

    it("desabilita o botão enquanto abre a conversa", () => {
        renderCard({ busy: true, starting: true });

        expect(
            screen.getByRole("button", { name: /Abrindo conversa/ }),
        ).toBeDisabled();
    });

    it("desabilita os demais cards enquanto uma conversa abre", () => {
        renderCard({ busy: true, starting: false });

        const button = screen.getByRole("button", { name: "Conversar" });
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute("aria-busy", "false");
    });
});
