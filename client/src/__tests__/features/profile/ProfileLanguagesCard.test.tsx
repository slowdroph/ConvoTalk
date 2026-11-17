import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileLanguagesCard from "../../../features/profile/components/ProfileLanguagesCard";

describe("ProfileLanguagesCard", () => {
    it("lista os idiomas com emoji e rótulo", () => {
        render(
            <ProfileLanguagesCard
                languages={["pt", "en"]}
                isSelf={false}
                onEdit={vi.fn()}
            />,
        );

        expect(screen.getByText("Português")).toBeInTheDocument();
        expect(screen.getByText("Inglês")).toBeInTheDocument();
        expect(screen.getByText("2/8")).toBeInTheDocument();
    });

    it("mostra o nível de cada idioma", () => {
        render(
            <ProfileLanguagesCard
                languages={["pt", "en"]}
                languageLevels={{ pt: "fluent", en: "basic" }}
                isSelf={false}
                onEdit={vi.fn()}
            />,
        );

        expect(screen.getByText("Fluente")).toBeInTheDocument();
        expect(screen.getByText("Básico")).toBeInTheDocument();
        expect(
            screen.getByRole("img", { name: "Português: Fluente" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("img", { name: "Inglês: Básico" }),
        ).toBeInTheDocument();
    });

    it("usa nível intermediário quando não informado", () => {
        render(
            <ProfileLanguagesCard
                languages={["pt"]}
                isSelf={false}
                onEdit={vi.fn()}
            />,
        );

        expect(
            screen.getByRole("img", { name: "Português: Intermediário" }),
        ).toBeInTheDocument();
    });

    it("ignora idiomas desconhecidos", () => {
        render(
            <ProfileLanguagesCard
                languages={["klingon", "es"]}
                isSelf={false}
                onEdit={vi.fn()}
            />,
        );

        expect(screen.getByText("Espanhol")).toBeInTheDocument();
        expect(screen.getByText("1/8")).toBeInTheDocument();
    });

    it("convida o dono a informar idiomas quando vazio", () => {
        const onEdit = vi.fn();
        render(
            <ProfileLanguagesCard languages={[]} isSelf onEdit={onEdit} />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Informar idiomas" }),
        );
        expect(onEdit).toHaveBeenCalled();
    });

    it("não oferece ação de edição para visitantes", () => {
        render(
            <ProfileLanguagesCard
                languages={[]}
                isSelf={false}
                onEdit={vi.fn()}
            />,
        );

        expect(
            screen.getByText("Nenhum idioma informado ainda."),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Informar idiomas" }),
        ).not.toBeInTheDocument();
    });
});
