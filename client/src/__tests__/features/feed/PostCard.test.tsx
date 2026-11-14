import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PostCard from "../../../features/feed/components/PostCard";
import { sharePost } from "../../../features/feed/sharePost";
import {
    createComment,
    deleteComment,
    getComments,
} from "../../../features/feed/services/commentsApi";
import type { Post } from "../../../types";

const { showToastMock } = vi.hoisted(() => ({
    showToastMock: vi.fn(),
}));

const getCommentsMock = vi.mocked(getComments);
const createCommentMock = vi.mocked(createComment);
const deleteCommentMock = vi.mocked(deleteComment);

vi.mock("../../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("../../../hooks/useSocket", () => ({
    useSocket: () => ({ onlineUsers: [] }),
}));

vi.mock("../../../hooks/useAuth", () => ({
    useAuth: () => ({ user: undefined }),
}));

vi.mock("../../../features/feed/sharePost", () => ({
    sharePost: vi.fn(),
}));

vi.mock("../../../features/feed/services/commentsApi", () => ({
    getComments: vi.fn(),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
}));

function makePost(overrides: Partial<Post> = {}): Post {
    return {
        _id: "post-1",
        author: {
            _id: "author-1",
            name: "Ana",
            publicId: "ANA123",
            avatar: "",
            status: "",
        },
        content: "Conteúdo do post",
        image: null,
        likeCount: 2,
        commentCount: 0,
        likedByMe: false,
        edited: false,
        createdAt: new Date().toISOString(),
        ...overrides,
    };
}

type PostCardTestProps = {
    post: Post;
    currentUserId?: string;
    onLike: (post: Post) => Promise<void>;
    onSave: (post: Post) => Promise<void>;
    onDelete: (postId: string) => Promise<void>;
    onOpenAuthor: (author: NonNullable<Post["author"]>) => void;
};

function setup(
    post: Post,
    overrides: Partial<PostCardTestProps> = {},
) {
    const props: PostCardTestProps = {
        post,
        currentUserId: "viewer",
        onLike: vi.fn().mockResolvedValue(undefined),
        onSave: vi.fn().mockResolvedValue(undefined),
        onDelete: vi.fn().mockResolvedValue(undefined),
        onOpenAuthor: vi.fn(),
        ...overrides,
    };

    render(<PostCard {...props} />);
    return props;
}

describe("PostCard", () => {
    const sharePostMock = vi.mocked(sharePost);

    beforeEach(() => {
        showToastMock.mockReset();
        sharePostMock.mockReset();
        sharePostMock.mockResolvedValue("copied");
        getCommentsMock.mockReset();
        getCommentsMock.mockResolvedValue({
            comments: [],
            nextCursor: null,
        });
        createCommentMock.mockReset();
        deleteCommentMock.mockReset();
    });

    it("renderiza autor, conteúdo e contagem de curtidas", () => {
        setup(makePost());

        expect(screen.getByText("Ana")).toBeInTheDocument();
        expect(screen.getByText("Conteúdo do post")).toBeInTheDocument();
        expect(screen.getByText("2 curtidas")).toBeInTheDocument();
    });

    it("curte o post ao clicar no botão", async () => {
        const props = setup(makePost());

        fireEvent.click(
            screen.getByRole("button", { name: "Curtir post" }),
        );

        await waitFor(() =>
            expect(props.onLike).toHaveBeenCalledWith(props.post),
        );
    });

    it("mostra erro quando a curtida falha", async () => {
        const props = setup(makePost(), {
            onLike: vi.fn().mockRejectedValue(new Error("fail")),
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Curtir post" }),
        );

        await waitFor(() =>
            expect(showToastMock).toHaveBeenCalledWith(
                expect.objectContaining({ type: "error" }),
            ),
        );
        expect(props.onLike).toHaveBeenCalled();
    });

    it("salva o post ao clicar no botão", async () => {
        const props = setup(makePost());

        fireEvent.click(screen.getByRole("button", { name: "Salvar post" }));

        await waitFor(() =>
            expect(props.onSave).toHaveBeenCalledWith(props.post),
        );
    });

    it("mostra erro quando o salvamento falha", async () => {
        setup(makePost(), {
            onSave: vi.fn().mockRejectedValue(new Error("fail")),
        });

        fireEvent.click(screen.getByRole("button", { name: "Salvar post" }));

        await waitFor(() =>
            expect(showToastMock).toHaveBeenCalledWith(
                expect.objectContaining({ type: "error" }),
            ),
        );
    });

    it("exibe o post como salvo quando savedByMe é verdadeiro", () => {
        setup(makePost({ savedByMe: true }));

        expect(
            screen.getByRole("button", { name: "Remover dos salvos" }),
        ).toHaveAttribute("aria-pressed", "true");
    });

    it("exibe botão de excluir apenas para o autor", () => {
        setup(makePost(), { currentUserId: "author-1" });
        expect(
            screen.getByRole("button", { name: "Excluir post" }),
        ).toBeInTheDocument();
    });

    it("não exibe botão de excluir para outros usuários", () => {
        setup(makePost(), { currentUserId: "viewer" });
        expect(
            screen.queryByRole("button", { name: "Excluir post" }),
        ).not.toBeInTheDocument();
    });

    it("confirma a exclusão do próprio post", async () => {
        const props = setup(makePost(), { currentUserId: "author-1" });

        fireEvent.click(screen.getByRole("button", { name: "Excluir post" }));
        expect(screen.getByText("Excluir post")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

        await waitFor(() =>
            expect(props.onDelete).toHaveBeenCalledWith("post-1"),
        );
    });

    it("abre o perfil do autor ao clicar no nome", () => {
        const props = setup(makePost());
        fireEvent.click(screen.getByText("Ana"));
        expect(props.onOpenAuthor).toHaveBeenCalledWith(props.post.author);
    });

    it("compartilha o post e avisa quando o link é copiado", async () => {
        const props = setup(makePost());

        fireEvent.click(
            screen.getByRole("button", { name: "Compartilhar post" }),
        );

        await waitFor(() => expect(sharePostMock).toHaveBeenCalledWith(props.post));
        expect(showToastMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "success",
                message: "Link do post copiado.",
            }),
        );
    });

    it("exibe botão de comentários e abre o painel", async () => {
        setup(makePost());
        expect(
            screen.getByRole("button", { name: /coment/i }),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /coment/i }));

        await screen.findByPlaceholderText("Escreva um comentário...");
    });

    it("não exibe painel de comentários antes de abrir", () => {
        setup(makePost());
        expect(
            screen.queryByPlaceholderText("Escrever um comentário..."),
        ).not.toBeInTheDocument();
    });
});
