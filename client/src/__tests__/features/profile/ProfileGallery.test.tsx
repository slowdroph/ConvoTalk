import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfileGallery from "../../../features/profile/components/ProfileGallery";
import type { Post } from "../../../types";

function makeImagePost(id: string): Post {
    return {
        _id: id,
        author: {
            _id: "author-1",
            name: "Ana",
            publicId: "ANA1",
            avatar: "",
            status: "",
        },
        profileId: "owner-1",
        content: `Foto ${id}`,
        image: {
            url: `https://example.com/${id}.png`,
            filename: `${id}.png`,
            mimetype: "image/png",
            size: 100,
        },
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
        edited: false,
        createdAt: "2026-01-01T10:00:00.000Z",
    };
}

describe("ProfileGallery", () => {
    it("renderiza as imagens do mural", () => {
        render(
            <ProfileGallery
                images={[makeImagePost("post-1")]}
                loading={false}
                error={null}
            />,
        );

        expect(screen.getByRole("img")).toHaveAttribute(
            "src",
            "https://example.com/post-1.png",
        );
        expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("mostra esqueletos enquanto carrega", () => {
        const { container } = render(
            <ProfileGallery images={[]} loading error={null} />,
        );

        expect(
            container.querySelectorAll(".animate-pulse").length,
        ).toBeGreaterThan(0);
    });

    it("mostra mensagem quando não há fotos", () => {
        render(<ProfileGallery images={[]} loading={false} error={null} />);

        expect(
            screen.getByText("As fotos publicadas no mural aparecerão aqui."),
        ).toBeInTheDocument();
    });

    it("mostra erro de carregamento", () => {
        render(
            <ProfileGallery
                images={[]}
                loading={false}
                error="Erro ao carregar a galeria."
            />,
        );

        expect(screen.getByText("Erro ao carregar a galeria.")).toBeInTheDocument();
    });
});
