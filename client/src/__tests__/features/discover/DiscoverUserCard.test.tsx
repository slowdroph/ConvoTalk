import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
        online: boolean;
        busy: boolean;
        onStartConversation: (user: DiscoverUser) => void;
        onViewProfile: (user: DiscoverUser) => void;
    }> = {},
) {
    const onStartConversation = props.onStartConversation ?? vi.fn();
    const onViewProfile = props.onViewProfile ?? vi.fn();

    render(
        <DiscoverUserCard
            user={user}
            online={props.online ?? false}
            busy={props.busy ?? false}
            onStartConversation={onStartConversation}
            onViewProfile={onViewProfile}
        />,
    );

    return { onStartConversation, onViewProfile };
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
        expect(screen.getByText(/Há 5 min/)).toBeInTheDocument();
        expect(
            screen.queryByRole("status", { name: "Online" }),
        ).not.toBeInTheDocument();
    });

    it("abre o perfil ao clicar no nome", () => {
        const { onViewProfile } = renderCard();

        fireEvent.click(
            screen.getByRole("button", { name: "Ver perfil de Ana Souza" }),
        );

        expect(onViewProfile).toHaveBeenCalledWith(user);
    });

    it("inicia conversa ao clicar no botão", () => {
        const { onStartConversation } = renderCard();

        fireEvent.click(screen.getByRole("button", { name: "Conversar" }));

        expect(onStartConversation).toHaveBeenCalledWith(user);
    });

    it("desabilita o botão enquanto abre a conversa", () => {
        renderCard({ busy: true });

        expect(
            screen.getByRole("button", { name: /Abrindo conversa/ }),
        ).toBeDisabled();
    });
});
