import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileTabs from "../../../features/profile/components/ProfileTabs";

describe("ProfileTabs", () => {
    it("destaca a aba ativa e mostra os contadores", () => {
        render(
            <ProfileTabs
                active="about"
                onChange={vi.fn()}
                postCount={3}
                authoredCount={2}
                photoCount={5}
            />,
        );

        expect(
            screen.getByRole("tab", { name: /Sobre & Interesses/ }),
        ).toHaveAttribute("aria-selected", "true");
        expect(
            screen.getByRole("tab", { name: /Publicações/ }),
        ).toHaveTextContent("2");
        expect(
            screen.getByRole("tab", { name: /Galeria de Fotos/ }),
        ).toHaveTextContent("5");
    });

    it("notifica a troca ao clicar em outra aba", () => {
        const onChange = vi.fn();
        render(
            <ProfileTabs
                active="about"
                onChange={onChange}
                postCount={3}
                authoredCount={2}
                photoCount={5}
            />,
        );

        fireEvent.click(screen.getByRole("tab", { name: /Publicações/ }));
        expect(onChange).toHaveBeenCalledWith("publications");
    });

    it("navega entre abas com as setas do teclado", () => {
        const onChange = vi.fn();
        render(
            <ProfileTabs
                active="about"
                onChange={onChange}
                postCount={0}
                authoredCount={0}
                photoCount={0}
            />,
        );

        fireEvent.keyDown(
            screen.getByRole("tab", { name: /Sobre & Interesses/ }),
            { key: "ArrowRight" },
        );
        expect(onChange).toHaveBeenCalledWith("publications");
    });

    it("mostra traços enquanto as estatísticas carregam", () => {
        render(
            <ProfileTabs
                active="about"
                onChange={vi.fn()}
                postCount={0}
                authoredCount={0}
                photoCount={0}
                loading
            />,
        );

        expect(
            screen.getByRole("tab", { name: /Publicações/ }),
        ).toHaveTextContent("—");
    });
});
