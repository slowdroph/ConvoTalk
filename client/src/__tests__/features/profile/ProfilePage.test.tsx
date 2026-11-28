import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProfilePage from "../../../pages/ProfilePage";
import type { Post, PublicProfile } from "../../../types";

const {
    showToastMock,
    useProfileMock,
    useProfilePostsMock,
    updateUserMock,
    updateAboutMock,
    authUser,
} = vi.hoisted(() => ({
    showToastMock: vi.fn(),
    useProfileMock: vi.fn(),
    useProfilePostsMock: vi.fn(),
    updateUserMock: vi.fn(),
    updateAboutMock: vi.fn(),
    authUser: {
        current: {
            _id: "me",
            name: "Eu",
            publicId: "ME1",
            avatar: "",
            verified: true,
        } as { _id: string; name: string; publicId: string; avatar: string; verified: boolean },
    },
}));

vi.mock("../../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("../../../hooks/useAuth", () => ({
    useAuth: () => ({
        user: authUser.current,
        updateUser: updateUserMock,
    }),
}));

vi.mock("../../../features/profile/services/profileApi", () => ({
    updateAbout: updateAboutMock,
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    updateAvatar: vi.fn(),
    removeAvatar: vi.fn(),
}));

vi.mock("../../../hooks/useSocket", () => ({
    useSocket: () => ({ onlineUsers: [] }),
}));

vi.mock("../../../services/rooms", () => ({
    createDirectRoom: vi.fn().mockResolvedValue({ _id: "room-1" }),
}));

vi.mock("../../../features/profile/hooks/useProfile", () => ({
    useProfile: useProfileMock,
    useProfileGallery: () => ({
        images: [],
        loading: false,
        error: null,
    }),
}));

vi.mock("../../../features/profile/hooks/useProfilePosts", () => ({
    useProfilePosts: useProfilePostsMock,
}));

vi.mock("../../../features/feed/sharePost", () => ({
    sharePost: vi.fn(),
}));

vi.mock("../../../features/feed/services/commentsApi", () => ({
    getComments: vi.fn().mockResolvedValue({ comments: [], nextCursor: null }),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
}));

const anaProfile = {
    _id: "ana",
    name: "Ana",
    publicId: "ANA1",
    avatar: "",
    status: "Dev",
    country: "BR",
    city: "São Paulo",
    bio: "Gosto de café e código.",
    interests: ["coffee", "programming"],
    gender: "woman",
    age: 30,
    languages: ["pt", "en"],
    birthdate: "1995-05-10T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
    lastSeen: null,
} as unknown as PublicProfile;

const wallPost: Post = {
    _id: "wall-1",
    author: {
        _id: "me",
        name: "Eu",
        publicId: "ME1",
        avatar: "",
        status: "",
    },
    profileId: "ana",
    content: "Recado no mural",
    image: null,
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    edited: false,
    createdAt: "2026-01-01T10:00:00.000Z",
};

function mockPosts(posts: Post[] = []) {
    useProfilePostsMock.mockReturnValue({
        posts,
        loading: false,
        loadingMore: false,
        error: null,
        hasMore: false,
        load: vi.fn(),
        loadMore: vi.fn(),
        addPost: vi.fn(),
        deletePostById: vi.fn().mockResolvedValue(undefined),
        toggleLike: vi.fn(),
        toggleSave: vi.fn(),
        votePoll: vi.fn(),
        setCommentCount: vi.fn(),
    });
}

function mockProfile(overrides: Record<string, unknown> = {}) {
    useProfileMock.mockReturnValue({
        profile: anaProfile,
        stats: {
            postCount: 3,
            totalLikes: 4,
            photoCount: 1,
            authoredCount: 2,
        },
        loading: false,
        statsLoading: false,
        error: null,
        notFound: false,
        refreshStats: vi.fn(),
        reload: vi.fn(),
        ...overrides,
    });
}

function renderPage(userId?: string) {
    const path = userId ? `/profile/${userId}` : "/profile";
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe("ProfilePage", () => {
    beforeEach(() => {
        showToastMock.mockReset();
        useProfileMock.mockReset();
        useProfilePostsMock.mockReset();
        updateUserMock.mockReset();
        updateAboutMock.mockReset();
        authUser.current = {
            _id: "me",
            name: "Eu",
            publicId: "ME1",
            avatar: "",
            verified: true,
        };
        mockPosts();
    });

    it("renderiza o perfil de outro usuário com mural", () => {
        mockProfile();
        mockPosts([wallPost]);
        renderPage("ana");

        expect(screen.getAllByText("Ana").length).toBeGreaterThan(0);
        expect(screen.getByText("Gosto de café e código.")).toBeInTheDocument();
        expect(screen.getByText("Café Especial")).toBeInTheDocument();
        expect(screen.getByText("30 anos")).toBeInTheDocument();
        expect(screen.getByText("Mulher")).toBeInTheDocument();
        expect(screen.getByText("Português")).toBeInTheDocument();
        expect(screen.getByText("Inglês")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Conversar" }),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText("Escrever algo no mural de Ana..."),
        ).toBeInTheDocument();
        expect(screen.getByText("Recado no mural")).toBeInTheDocument();
        expect(screen.getByText("escreveu no mural")).toBeInTheDocument();
    });

    it("permite ao dono excluir posts no próprio mural", () => {
        mockProfile({
            profile: { ...anaProfile, _id: "me" } as PublicProfile,
        });
        mockPosts([wallPost]);
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Excluir post" }));
        expect(screen.getByText("Excluir post")).toBeInTheDocument();
    });

    it("mostra ações de edição apenas no próprio perfil", () => {
        mockProfile({
            profile: { ...anaProfile, _id: "me" } as unknown as PublicProfile,
        });
        renderPage();

        expect(
            screen.getByRole("button", { name: "Editar bio" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Editar detalhes do perfil" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Conversar" }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByPlaceholderText("Escrever algo no seu mural..."),
        ).toBeInTheDocument();
    });

    it("abre a edição inline da bio", () => {
        mockProfile({
            profile: { ...anaProfile, _id: "me" } as unknown as PublicProfile,
        });
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Editar bio" }));

        expect(screen.getByLabelText("Bio")).toHaveValue(
            "Gosto de café e código.",
        );
        expect(
            screen.getByRole("button", { name: "Salvar bio" }),
        ).toBeInTheDocument();
    });

    it("salva a bio inline com o restante do perfil preservado", async () => {
        mockProfile({
            profile: { ...anaProfile, _id: "me" } as unknown as PublicProfile,
        });
        updateAboutMock.mockResolvedValue({ _id: "me", name: "Eu" });
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: "Editar bio" }));
        fireEvent.change(screen.getByLabelText("Bio"), {
            target: { value: "  Nova bio  " },
        });
        fireEvent.click(screen.getByRole("button", { name: "Salvar bio" }));

        await waitFor(() =>
            expect(updateAboutMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    bio: "Nova bio",
                    interests: ["coffee", "programming"],
                    status: "Dev",
                    gender: "woman",
                    city: "São Paulo",
                    country: "BR",
                    languages: ["pt", "en"],
                }),
            ),
        );
        expect(updateUserMock).toHaveBeenCalled();
        expect(showToastMock).toHaveBeenCalledWith({
            type: "success",
            message: "Perfil atualizado!",
        });
    });

    it("não mostra editores inline para visitantes", () => {
        mockProfile();
        renderPage("ana");

        expect(
            screen.queryByRole("button", { name: "Editar bio" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Editar detalhes do perfil" }),
        ).not.toBeInTheDocument();
    });

    it("não mostra editores inline para o dono não verificado", () => {
        authUser.current = { ...authUser.current, verified: false };
        mockProfile({
            profile: { ...anaProfile, _id: "me" } as unknown as PublicProfile,
        });
        renderPage();

        expect(
            screen.queryByRole("button", { name: "Editar bio" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Editar detalhes do perfil" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Alterar foto" }),
        ).not.toBeInTheDocument();
    });

    it("mostra estado de perfil não encontrado", () => {
        mockProfile({ profile: null, notFound: true, stats: null });
        renderPage("desconhecido");

        expect(screen.getByText("Perfil não encontrado.")).toBeInTheDocument();
    });

    it("mostra o estado vazio do mural", () => {
        mockProfile();
        mockPosts([]);
        renderPage("ana");

        expect(screen.getByText("Mural vazio")).toBeInTheDocument();
        expect(
            screen.getByText("Seja a primeira pessoa a escrever no mural de Ana."),
        ).toBeInTheDocument();
    });

    it("troca para a aba de publicações e busca apenas posts autorais", () => {
        mockProfile();
        mockPosts([]);
        renderPage("ana");

        fireEvent.click(screen.getByRole("tab", { name: /Publicações/ }));

        expect(useProfilePostsMock).toHaveBeenLastCalledWith("ana", {
            authored: true,
        });
        expect(screen.getByText("Nenhuma publicação")).toBeInTheDocument();
        expect(
            screen.getByText("Ana ainda não publicou no feed."),
        ).toBeInTheDocument();
    });

    it("troca para a aba da galeria", () => {
        mockProfile();
        renderPage("ana");

        fireEvent.click(screen.getByRole("tab", { name: /Galeria de Fotos/ }));

        expect(
            screen.getByText("As fotos publicadas no mural aparecerão aqui."),
        ).toBeInTheDocument();
    });
});
