import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileSidebar from "../../../features/profile/components/ProfileSidebar";
import type { Post, PublicProfile } from "../../../types";

const { showToastMock } = vi.hoisted(() => ({
    showToastMock: vi.fn(),
}));

vi.mock("../../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

const profile = {
    _id: "ana",
    name: "Ana",
    publicId: "ANA1",
    avatar: "",
    status: "Dev",
    country: "BR",
    city: "São Paulo",
    bio: "Gosto de café.",
    interests: ["coffee"],
    gender: "woman",
    age: 30,
    languages: ["pt", "en"],
    birthdate: "1995-05-10T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
    lastSeen: null,
} as unknown as PublicProfile;

function makePhoto(id: string): Post {
    return {
        _id: id,
        author: {
            _id: "ana",
            name: "Ana",
            publicId: "ANA1",
            avatar: "",
            status: "",
        },
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

function renderSidebar(
    overrides: Partial<ComponentProps<typeof ProfileSidebar>> = {},
) {
    const props: ComponentProps<typeof ProfileSidebar> = {
        profile,
        online: false,
        isSelf: false,
        starting: false,
        startError: null,
        photos: [],
        blocking: false,
        photoUploading: false,
        onStartConversation: vi.fn(),
        onEditAbout: vi.fn(),
        onOpenGallery: vi.fn(),
        onBlock: vi.fn(),
        onUnblock: vi.fn(),
        onPhotoSelected: vi.fn(),
        onRemovePhoto: vi.fn(),
        ...overrides,
    };

    return { ...render(<ProfileSidebar {...props} />), props };
}

describe("ProfileSidebar", () => {
    beforeEach(() => {
        showToastMock.mockReset();
    });

    it("mostra identidade, status e idiomas", () => {
        renderSidebar({ photos: [makePhoto("p1"), makePhoto("p2")] });

        expect(
            screen.queryByAltText("Foto de perfil de Ana"),
        ).not.toBeInTheDocument();
        expect(screen.getByText("Ana")).toBeInTheDocument();
        expect(screen.getByText("30 anos")).toBeInTheDocument();
        expect(screen.getByText("Mulher")).toBeInTheDocument();
        expect(screen.getByText("Dev")).toBeInTheDocument();
        expect(screen.getByText("São Paulo, Brasil")).toBeInTheDocument();
        expect(screen.getByText("Português")).toBeInTheDocument();
        expect(screen.getByText("Inglês")).toBeInTheDocument();
        expect(screen.getByText("Membro desde")).toBeInTheDocument();
        expect(screen.getByText("Último acesso")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Conversar" }),
        ).toBeInTheDocument();
        fireEvent.click(
            screen.getByRole("button", { name: "Mais ações do perfil" }),
        );
        expect(
            screen.getByRole("menuitem", { name: "Copiar link do perfil" }),
        ).toBeInTheDocument();
    });

    it("mostra a inicial como fallback quando não há foto", () => {
        renderSidebar();

        expect(
            screen.queryByAltText("Foto de perfil de Ana"),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Expandir foto de perfil" }),
        ).not.toBeInTheDocument();
        expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("abre a galeria pelo atalho de fotos restantes", () => {
        const photos = Array.from({ length: 6 }, (_, index) =>
            makePhoto(`p${index + 1}`),
        );
        const { props } = renderSidebar({ photos });

        const more = screen.getByRole("button", {
            name: "Ver as 6 fotos da galeria",
        });
        expect(more).toHaveTextContent("+2");

        fireEvent.click(more);
        expect(props.onOpenGallery).toHaveBeenCalled();
    });

    it("copia o link do perfil", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        });

        renderSidebar();

        fireEvent.click(
            screen.getByRole("button", { name: "Mais ações do perfil" }),
        );
        fireEvent.click(
            screen.getByRole("menuitem", { name: "Copiar link do perfil" }),
        );

        await waitFor(() => expect(writeText).toHaveBeenCalled());
        expect(writeText).toHaveBeenCalledWith(
            `${window.location.origin}/profile/ana`,
        );
        expect(showToastMock).toHaveBeenCalledWith({
            type: "success",
            message: "Link do perfil copiado.",
        });
    });

    it("mostra desbloquear quando o visitante já bloqueou o perfil", () => {
        const onUnblock = vi.fn();
        renderSidebar({
            profile: { ...profile, blockedByMe: true },
            onUnblock,
        });

        expect(
            screen.getByText(/Você bloqueou este usuário/),
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Desbloquear" }),
        );
        expect(onUnblock).toHaveBeenCalled();
    });

    it("pede confirmação antes de bloquear", () => {
        const onBlock = vi.fn();
        renderSidebar({ onBlock });

        fireEvent.click(
            screen.getByRole("button", { name: "Mais ações do perfil" }),
        );
        fireEvent.click(screen.getByRole("menuitem", { name: "Bloquear" }));

        expect(screen.getByText("Bloquear usuário")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Bloquear" }));
        expect(onBlock).toHaveBeenCalled();
    });

    it("mostra a foto do perfil e ações apenas para o dono", () => {
        const onRemovePhoto = vi.fn();
        renderSidebar({
            profile: {
                ...profile,
                avatar: "https://example.com/avatar.png",
            },
            isSelf: true,
            onRemovePhoto,
        });

        expect(screen.getByAltText("Foto de perfil de Ana")).toHaveAttribute(
            "src",
            "https://example.com/avatar.png",
        );
        const expand = screen.getByRole("button", {
            name: "Expandir foto de perfil",
        });
        expect(expand).toBeInTheDocument();

        fireEvent.click(expand);
        expect(
            screen.getByRole("dialog", {
                name: "Imagem Foto de perfil de Ana",
            }),
        ).toBeInTheDocument();
        expect(screen.getByText("Alterar foto")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Remover foto" }));
        expect(onRemovePhoto).toHaveBeenCalled();
    });

    it("não mostra ações de foto para visitantes", () => {
        renderSidebar({
            profile: {
                ...profile,
                avatar: "https://example.com/avatar.png",
            },
        });

        expect(screen.queryByText("Alterar foto")).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Remover foto" }),
        ).not.toBeInTheDocument();
    });
});
