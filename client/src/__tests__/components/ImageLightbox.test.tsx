import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ImageLightbox from "../../components/ui/ImageLightbox";

const image = {
    src: "https://example.com/foto.png",
    alt: "foto.png",
};

function renderLightbox(imageClassName?: string) {
    return render(
        <ImageLightbox
            src={image.src}
            alt={image.alt}
            className="trigger"
            imageClassName={imageClassName}
        />,
    );
}

describe("ImageLightbox", () => {
    it("abre o modal ao clicar na imagem", () => {
        renderLightbox();

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Ampliar imagem foto.png" }),
        );

        const dialog = screen.getByRole("dialog", { name: "Imagem foto.png" });
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(
            screen.getAllByRole("img", { name: "foto.png" }),
        ).toHaveLength(2);
        expect(document.body.style.overflow).toBe("hidden");
    });

    it("fecha pelo botão e restaura o scroll e o foco", () => {
        renderLightbox();
        const trigger = screen.getByRole("button", {
            name: "Ampliar imagem foto.png",
        });

        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole("button", { name: "Fechar imagem" }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(document.body.style.overflow).toBe("");
        expect(trigger).toHaveFocus();
    });

    it("fecha com Escape", () => {
        renderLightbox();
        fireEvent.click(
            screen.getByRole("button", { name: "Ampliar imagem foto.png" }),
        );

        fireEvent.keyDown(document, { key: "Escape" });

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("fecha ao clicar no backdrop", () => {
        renderLightbox();
        fireEvent.click(
            screen.getByRole("button", { name: "Ampliar imagem foto.png" }),
        );

        fireEvent.click(screen.getByRole("dialog"));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("não fecha ao clicar na imagem ampliada", () => {
        renderLightbox();
        fireEvent.click(
            screen.getByRole("button", { name: "Ampliar imagem foto.png" }),
        );

        const images = screen.getAllByRole("img", { name: "foto.png" });
        fireEvent.click(images[1]);

        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("aceita rótulo customizado no trigger", () => {
        render(
            <ImageLightbox
                src={image.src}
                alt={image.alt}
                triggerLabel="Ver foto"
            />,
        );

        expect(
            screen.getByRole("button", { name: "Ver foto" }),
        ).toBeInTheDocument();
    });

    it("aceita um trigger customizado sem renderizar a imagem padrão", () => {
        render(
            <ImageLightbox src={image.src} alt={image.alt} triggerLabel="Ver foto">
                <svg aria-hidden="true" />
            </ImageLightbox>,
        );

        const trigger = screen.getByRole("button", { name: "Ver foto" });
        expect(screen.queryByRole("img")).not.toBeInTheDocument();

        fireEvent.click(trigger);

        expect(
            screen.getByRole("dialog", { name: "Imagem foto.png" }),
        ).toBeInTheDocument();
    });
});
