import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileAboutCard from "../../../features/profile/components/ProfileAboutCard";
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

describe("ProfileAboutCard", () => {
    it("mostra a bio e não oferece edição para visitantes", () => {
        render(
            <ProfileAboutCard
                bio="Gosto de café."
                isSelf={false}
                editor={makeEditor()}
            />,
        );

        expect(screen.getByText("Gosto de café.")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Editar bio" }),
        ).not.toBeInTheDocument();
    });

    it("abre a edição da bio para o dono", () => {
        const editor = makeEditor();
        render(<ProfileAboutCard bio="Bio" isSelf editor={editor} />);

        fireEvent.click(screen.getByRole("button", { name: "Editar bio" }));

        expect(editor.start).toHaveBeenCalledWith("bio");
    });

    it("salva a bio com espaços removidos", () => {
        const save = vi.fn().mockResolvedValue(true);
        const editor = makeEditor({
            active: "bio",
            isEditing: (section) => section === "bio",
            save,
        });
        render(<ProfileAboutCard bio="Bio antiga" isSelf editor={editor} />);

        fireEvent.change(screen.getByLabelText("Bio"), {
            target: { value: "  Nova bio  " },
        });
        fireEvent.click(screen.getByRole("button", { name: "Salvar bio" }));

        expect(save).toHaveBeenCalledWith({ bio: "Nova bio" });
    });

    it("cancela a edição", () => {
        const cancel = vi.fn();
        const editor = makeEditor({
            active: "bio",
            isEditing: (section) => section === "bio",
            cancel,
        });
        render(<ProfileAboutCard bio="Bio" isSelf editor={editor} />);

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(cancel).toHaveBeenCalled();
    });

    it("não oferece edição ao dono não verificado", () => {
        render(
            <ProfileAboutCard
                bio="Bio"
                isSelf
                editor={makeEditor({ canEdit: false })}
            />,
        );

        expect(
            screen.queryByRole("button", { name: "Editar bio" }),
        ).not.toBeInTheDocument();
    });
});
