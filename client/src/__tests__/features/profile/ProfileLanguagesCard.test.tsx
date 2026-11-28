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
        canEdit: true,
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
        expect(screen.getByText("2/10")).toBeInTheDocument();
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
        expect(screen.getByText("1/10")).toBeInTheDocument();
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
        fireEvent.click(screen.getByLabelText("Nível de Espanhol"));
        fireEvent.click(screen.getByRole("option", { name: "Básico" }));
        fireEvent.click(
            screen.getByRole("button", { name: "Salvar idiomas" }),
        );

        expect(save).toHaveBeenCalledWith({
            languages: ["pt", "es"],
            languageLevels: { pt: "fluent", es: "basic" },
        });
    });

    it("busca idiomas ignorando acentos", () => {
        const editor = makeEditor({
            active: "languages",
            isEditing: (section) => section === "languages",
        });
        render(
            <ProfileLanguagesCard
                languages={[]}
                isSelf
                editor={editor}
            />,
        );

        fireEvent.change(screen.getByLabelText("Buscar idiomas"), {
            target: { value: "tailandes" },
        });

        expect(
            screen.getByRole("button", { name: /Tailandês/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: /Português/ }),
        ).not.toBeInTheDocument();
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

    it("não oferece edição ao dono não verificado", () => {
        render(
            <ProfileLanguagesCard
                languages={["pt"]}
                isSelf
                editor={makeEditor({ canEdit: false })}
            />,
        );

        expect(
            screen.queryByRole("button", { name: "Editar idiomas" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Informar idiomas" }),
        ).not.toBeInTheDocument();
    });
});
