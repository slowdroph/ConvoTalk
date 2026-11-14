import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SharedPostDialog from "../../../features/feed/components/SharedPostDialog";
import {
    getPost,
    likePost,
    unlikePost,
} from "../../../features/feed/services/feedApi";
import type { Post } from "../../../types";

const { showToastMock } = vi.hoisted(() => ({
    showToastMock: vi.fn(),
}));

vi.mock("../../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("../../../hooks/useSocket", () => ({
    useSocket: () => ({ onlineUsers: [] }),
}));

vi.mock("../../../features/feed/services/feedApi", async (importOriginal) => {
    const actual =
        await importOriginal<
            typeof import("../../../features/feed/services/feedApi")
        >();
    return {
        ...actual,
        getPost: vi.fn(),
        likePost: vi.fn(),
        unlikePost: vi.fn(),
    };
});

const getPostMock = vi.mocked(getPost);
const likePostMock = vi.mocked(likePost);
const unlikePostMock = vi.mocked(unlikePost);

const post: Post = {
    _id: "post-1",
    author: {
        _id: "author-1",
        name: "Ana",
        publicId: "ANA1",
        avatar: "",
        status: "",
        country: "",
    },
    content: "Conteúdo do post compartilhado",
    image: null,
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    edited: false,
    createdAt: "2026-01-01T10:00:00.000Z",
};

describe("SharedPostDialog", () => {
    beforeEach(() => {
        showToastMock.mockReset();
        getPostMock.mockReset();
        likePostMock.mockReset();
        unlikePostMock.mockReset();
        getPostMock.mockResolvedValue(post);
    });

    it("carrega e exibe o post do link compartilhado", async () => {
        render(
            <SharedPostDialog
                postId="post-1"
                currentUserId="viewer"
                onClose={vi.fn()}
                onOpenAuthor={vi.fn()}
            />,
        );

        expect(await screen.findByText("Post compartilhado")).toBeInTheDocument();
        expect(
            screen.getByText("Conteúdo do post compartilhado"),
        ).toBeInTheDocument();
        expect(screen.getByText("Ana")).toBeInTheDocument();
        expect(getPostMock).toHaveBeenCalledWith("post-1");
    });

    it("curte o post compartilhado", async () => {
        likePostMock.mockResolvedValue({ likeCount: 1, liked: true });

        render(
            <SharedPostDialog
                postId="post-1"
                currentUserId="viewer"
                onClose={vi.fn()}
                onOpenAuthor={vi.fn()}
            />,
        );

        fireEvent.click(
            await screen.findByRole("button", { name: "Curtir post" }),
        );

        await waitFor(() => expect(likePostMock).toHaveBeenCalledWith("post-1"));
        expect(await screen.findByText("1 curtida")).toBeInTheDocument();
    });

    it("fecha pelo botão de fechar", async () => {
        const onClose = vi.fn();

        render(
            <SharedPostDialog
                postId="post-1"
                currentUserId="viewer"
                onClose={onClose}
                onOpenAuthor={vi.fn()}
            />,
        );

        fireEvent.click(
            await screen.findByRole("button", {
                name: "Fechar post compartilhado",
            }),
        );

        expect(onClose).toHaveBeenCalled();
    });

    it("mostra erro quando o post não pode ser carregado", async () => {
        getPostMock.mockRejectedValue(new Error("fail"));

        render(
            <SharedPostDialog
                postId="post-1"
                currentUserId="viewer"
                onClose={vi.fn()}
                onOpenAuthor={vi.fn()}
            />,
        );

        expect(await screen.findByText("fail")).toBeInTheDocument();
    });
});
