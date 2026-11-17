import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileInterestsCard from "../../../features/profile/components/ProfileInterestsCard";

describe("ProfileInterestsCard", () => {
    it("lista os interesses com emoji e rótulo", () => {
        render(
            <ProfileInterestsCard
                interests={["programming", "coffee"]}
                isSelf={false}
                onEdit={vi.fn()}
            />,
        );

        expect(screen.getByText("Programação & Open Source")).toBeInTheDocument();
        expect(screen.getByText("Café Especial")).toBeInTheDocument();
        expect(screen.getByText("2/12 selecionados")).toBeInTheDocument();
    });

    it("ignora interesses desconhecidos", () => {
        render(
            <ProfileInterestsCard
                interests={["desconhecido", "gaming"]}
                isSelf={false}
                onEdit={vi.fn()}
            />,
        );

        expect(screen.getByText("Games")).toBeInTheDocument();
        expect(screen.getByText("1/12 selecionados")).toBeInTheDocument();
    });

    it("convida o dono a selecionar interesses quando vazio", () => {
        const onEdit = vi.fn();
        render(
            <ProfileInterestsCard
                interests={[]}
                isSelf
                onEdit={onEdit}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Selecionar interesses" }),
        );
        expect(onEdit).toHaveBeenCalled();
    });

    it("não oferece ação de edição para visitantes", () => {
        render(
            <ProfileInterestsCard interests={[]} isSelf={false} onEdit={vi.fn()} />,
        );

        expect(
            screen.getByText("Nenhum interesse selecionado ainda."),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Selecionar interesses" }),
        ).not.toBeInTheDocument();
    });
});
