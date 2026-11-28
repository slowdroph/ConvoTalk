import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileInterestsCard from "../../../features/profile/components/ProfileInterestsCard";
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

describe("ProfileInterestsCard", () => {
    it("lista os interesses com emoji e rótulo", () => {
        render(
            <ProfileInterestsCard
                interests={["programming", "coffee"]}
                isSelf={false}
                editor={makeEditor()}
            />,
        );

        expect(screen.getByText("Programação & Open Source")).toBeInTheDocument();
        expect(screen.getByText("Café Especial")).toBeInTheDocument();
        expect(screen.getByText("2/20 selecionados")).toBeInTheDocument();
    });

    it("ignora interesses desconhecidos", () => {
        render(
            <ProfileInterestsCard
                interests={["desconhecido", "gaming"]}
                isSelf={false}
                editor={makeEditor()}
            />,
        );

        expect(screen.getByText("Games")).toBeInTheDocument();
        expect(screen.getByText("1/20 selecionados")).toBeInTheDocument();
    });

    it("inicia a edição para o dono", () => {
        const editor = makeEditor();
        render(
            <ProfileInterestsCard
                interests={[]}
                isSelf
                editor={editor}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Selecionar interesses" }),
        );
        expect(editor.start).toHaveBeenCalledWith("interests");
    });

    it("permite editar e salvar os interesses", () => {
        const save = vi.fn().mockResolvedValue(true);
        const editor = makeEditor({
            active: "interests",
            isEditing: (section) => section === "interests",
            save,
        });
        render(
            <ProfileInterestsCard
                interests={["programming"]}
                isSelf
                editor={editor}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /Café Especial/ }));
        fireEvent.click(screen.getByRole("button", { name: "Salvar interesses" }));

        expect(save).toHaveBeenCalledWith({
            interests: ["programming", "coffee"],
        });
    });

    it("busca interesses ignorando acentos", () => {
        const editor = makeEditor({
            active: "interests",
            isEditing: (section) => section === "interests",
        });
        render(
            <ProfileInterestsCard
                interests={[]}
                isSelf
                editor={editor}
            />,
        );

        fireEvent.change(screen.getByLabelText("Buscar interesses"), {
            target: { value: "programacao" },
        });

        expect(
            screen.getByRole("button", { name: /Programação & Open Source/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: /Café Especial/ }),
        ).not.toBeInTheDocument();
    });

    it("não oferece ação de edição para visitantes", () => {
        render(
            <ProfileInterestsCard
                interests={[]}
                isSelf={false}
                editor={makeEditor()}
            />,
        );

        expect(
            screen.getByText("Nenhum interesse selecionado ainda."),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Selecionar interesses" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Editar interesses" }),
        ).not.toBeInTheDocument();
    });

    it("não oferece edição ao dono não verificado", () => {
        render(
            <ProfileInterestsCard
                interests={["gaming"]}
                isSelf
                editor={makeEditor({ canEdit: false })}
            />,
        );

        expect(
            screen.queryByRole("button", { name: "Editar interesses" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Selecionar interesses" }),
        ).not.toBeInTheDocument();
    });
});
