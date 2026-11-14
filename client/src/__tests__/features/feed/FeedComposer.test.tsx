import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FeedComposer from "../../../features/feed/components/FeedComposer";
import { createPost } from "../../../features/feed/services/feedApi";
import type { Post } from "../../../types";

const { showToastMock } = vi.hoisted(() => ({
    showToastMock: vi.fn(),
}));

vi.mock("../../../hooks/useAuth", () => ({
    useAuth: () => ({
        user: { _id: "me", name: "Ana", publicId: "ANA1", avatar: "" },
    }),
}));

vi.mock("../../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("../../../features/feed/services/feedApi", () => ({
    createPost: vi.fn(),
}));

const createPostMock = vi.mocked(createPost);

const createdPost: Post = {
    _id: "post-1",
    author: {
        _id: "me",
        name: "Ana",
        publicId: "ANA1",
        avatar: "",
        status: "",
    },
    content: "Meu post",
    image: null,
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    edited: false,
    createdAt: "2026-01-01T10:00:00.000Z",
};

describe("FeedComposer", () => {
    beforeEach(() => {
        createPostMock.mockReset();
        showToastMock.mockReset();
        vi.stubGlobal("crypto", { randomUUID: () => "client-post-id" });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("publica o conteúdo digitado e limpa o campo", async () => {
        createPostMock.mockResolvedValue(createdPost);
        const onCreated = vi.fn();

        render(<FeedComposer onCreated={onCreated} />);

        const textarea = screen.getByLabelText("Escreva seu post");
        fireEvent.change(textarea, { target: { value: "  Meu post  " } });
        fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

        await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdPost));

        expect(createPostMock).toHaveBeenCalledWith({
            content: "Meu post",
            image: undefined,
            clientPostId: "client-post-id",
        });
        expect(textarea).toHaveValue("");
        expect(showToastMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
        );
    });

    it("desabilita o envio quando não há conteúdo nem imagem", () => {
        render(<FeedComposer onCreated={vi.fn()} />);

        expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
    });

    it("rejeita imagem acima de 5 MB", () => {
        const { container } = render(<FeedComposer onCreated={vi.fn()} />);
        const input = container.querySelector<HTMLInputElement>(
            'input[type="file"]',
        )!;

        const bigFile = new File(["x"], "big.png", { type: "image/png" });
        Object.defineProperty(bigFile, "size", { value: 6 * 1024 * 1024 });

        fireEvent.change(input, { target: { files: [bigFile] } });

        expect(showToastMock).toHaveBeenCalledWith({
            type: "error",
            message: "A imagem deve ter no máximo 5 MB.",
        });
        expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
    });

    it("rejeita arquivo que não é imagem suportada", () => {
        const { container } = render(<FeedComposer onCreated={vi.fn()} />);
        const input = container.querySelector<HTMLInputElement>(
            'input[type="file"]',
        )!;

        const file = new File(["x"], "doc.txt", { type: "text/plain" });

        fireEvent.change(input, { target: { files: [file] } });

        expect(showToastMock).toHaveBeenCalledWith({
            type: "error",
            message: "Formato de imagem não suportado. Use JPEG, PNG, WebP ou GIF.",
        });
    });

    it("publica enquete com as opções informadas", async () => {
        createPostMock.mockResolvedValue(createdPost);
        const onCreated = vi.fn();

        render(<FeedComposer onCreated={onCreated} />);

        fireEvent.change(screen.getByLabelText("Escreva seu post"), {
            target: { value: "Qual a melhor opção?" },
        });
        fireEvent.click(
            screen.getByRole("button", { name: "Adicionar enquete" }),
        );
        fireEvent.change(screen.getByLabelText("Opção 1"), {
            target: { value: "A" },
        });
        fireEvent.change(screen.getByLabelText("Opção 2"), {
            target: { value: "B" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

        await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdPost));
        expect(createPostMock).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "Qual a melhor opção?",
                poll: { options: ["A", "B"] },
            }),
        );
    });

    it("impede enquete com opção em branco", async () => {
        const onCreated = vi.fn();

        render(<FeedComposer onCreated={onCreated} />);

        fireEvent.change(screen.getByLabelText("Escreva seu post"), {
            target: { value: "Qual a melhor opção?" },
        });
        fireEvent.click(
            screen.getByRole("button", { name: "Adicionar enquete" }),
        );
        fireEvent.change(screen.getByLabelText("Opção 1"), {
            target: { value: "A" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Preencha todas as opções da enquete.",
        );
        expect(createPostMock).not.toHaveBeenCalled();
    });

    it("reutiliza o clientPostId quando a publicação falha e é tentada novamente", async () => {
        createPostMock
            .mockRejectedValueOnce(new Error("fail"))
            .mockResolvedValueOnce(createdPost);
        const onCreated = vi.fn();

        render(<FeedComposer onCreated={onCreated} />);

        fireEvent.change(screen.getByLabelText("Escreva seu post"), {
            target: { value: "Meu post" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

        await waitFor(() => expect(createPostMock).toHaveBeenCalledTimes(1));
        await waitFor(() =>
            expect(screen.getByRole("button", { name: "Publicar" })).toBeEnabled(),
        );

        fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

        await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdPost));

        const [first, second] = createPostMock.mock.calls;
        expect(first[0].clientPostId).toBe("client-post-id");
        expect(second[0].clientPostId).toBe("client-post-id");
    });

    it("gera um novo clientPostId depois de publicar", async () => {
        let counter = 0;
        vi.stubGlobal("crypto", {
            randomUUID: () => `client-post-id-${++counter}`,
        });
        createPostMock.mockResolvedValue(createdPost);
        const onCreated = vi.fn();

        render(<FeedComposer onCreated={onCreated} />);

        const textarea = screen.getByLabelText("Escreva seu post");
        fireEvent.change(textarea, { target: { value: "Primeiro" } });
        fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
        await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));

        fireEvent.change(textarea, { target: { value: "Segundo" } });
        fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
        await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(2));

        expect(createPostMock.mock.calls[0][0].clientPostId).toBe(
            "client-post-id-1",
        );
        expect(createPostMock.mock.calls[1][0].clientPostId).toBe(
            "client-post-id-2",
        );
    });
});
