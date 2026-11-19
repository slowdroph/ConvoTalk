import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileLanguagesCard from "../../../features/profile/components/ProfileLanguagesCard";
import type { ProfileSectionEditor } from "../../../features/profile/hooks/useProfileSectionEditor";

function makeEditor(
    overrides: Partial<ProfileSectionEditor> = {},
): ProfileSectionEditor {
    return {
        active: null,
        saving: false,
        error: null,
        start: vi.fn(),
        cancel: vi.fn(),
        save: vi.fn().mockResolvedValue(true),
        isEditing: () => false,
        ...overrides,
    };
}

describe("ProfileLanguagesCard", () => {
    it("lista os idiomas com emoji e rótulo", () => {
        render(
            <ProfileLanguagesCard
                languages={["pt", "en"]}
                isSelf={false}
                editor={makeEditor()}
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
                editor={makeEditor()}
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
                editor={makeEditor()}
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
                editor={makeEditor()}
            />,
        );

        expect(screen.getByText("Espanhol")).toBeInTheDocument();
        expect(screen.getByText("1/8")).toBeInTheDocument();
    });

    it("inicia a edição para o dono", () => {
        const editor = makeEditor();
        render(
            <ProfileLanguagesCard
                languages={[]}
                isSelf
                editor={editor}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Informar idiomas" }),
        );
        expect(editor.start).toHaveBeenCalledWith("languages");
    });

    it("permite editar idiomas e níveis", () => {
        const save = vi.fn().mockResolvedValue(true);
        const editor = makeEditor({
            active: "languages",
            isEditing: (section) => section === "languages",
            save,
        });
        render(
            <ProfileLanguagesCard
                languages={["pt"]}
                languageLevels={{ pt: "fluent" }}
                isSelf
                editor={editor}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /Espanhol/ }));
        fireEvent.change(screen.getByLabelText("Nível de Espanhol"), {
            target: { value: "basic" },
        });
        fireEvent.click(
            screen.getByRole("button", { name: "Salvar idiomas" }),
        );

        expect(save).toHaveBeenCalledWith({
            languages: ["pt", "es"],
            languageLevels: { pt: "fluent", es: "basic" },
        });
    });

    it("não oferece ação de edição para visitantes", () => {
        render(
            <ProfileLanguagesCard
                languages={[]}
                isSelf={false}
                editor={makeEditor()}
            />,
        );

        expect(
            screen.getByText("Nenhum idioma informado ainda."),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Informar idiomas" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Editar idiomas" }),
        ).not.toBeInTheDocument();
    });
});
