import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildPostUrl, sharePost } from "../../../features/feed/sharePost";
import type { Post } from "../../../types";

function makePost(overrides: Partial<Post> = {}): Post {
    return {
        _id: "post-1",
        author: {
            _id: "author-1",
            name: "Ana",
            publicId: "ANA1",
            avatar: "",
            status: "",
        },
        content: "Conteúdo do post",
        image: null,
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
        edited: false,
        createdAt: "2026-01-01T10:00:00.000Z",
        ...overrides,
    };
}

const writeText = vi.fn().mockResolvedValue(undefined);

describe("sharePost", () => {
    beforeEach(() => {
        writeText.mockReset();
        writeText.mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText },
            configurable: true,
        });
    });

    afterEach(() => {
        delete (navigator as { share?: unknown }).share;
    });

    it("monta o link do post com o id", () => {
        expect(buildPostUrl("post-1")).toBe(
            `${window.location.origin}/feed?post=post-1`,
        );
    });

    it("copia o link quando a Web Share API não está disponível", async () => {
        await expect(sharePost(makePost())).resolves.toBe("copied");
        expect(writeText).toHaveBeenCalledWith(
            `${window.location.origin}/feed?post=post-1`,
        );
    });

    it("usa a Web Share API quando disponível", async () => {
        const share = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "share", {
            value: share,
            configurable: true,
        });

        await expect(sharePost(makePost())).resolves.toBe("shared");
        expect(share).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Post de Ana no ConvoTalk",
                url: `${window.location.origin}/feed?post=post-1`,
            }),
        );
        expect(writeText).not.toHaveBeenCalled();
    });

    it("não copia o link quando o usuário cancela o compartilhamento", async () => {
        const share = vi
            .fn()
            .mockRejectedValue(
                Object.assign(new Error("cancel"), { name: "AbortError" }),
            );
        Object.defineProperty(navigator, "share", {
            value: share,
            configurable: true,
        });

        await expect(sharePost(makePost())).resolves.toBe("dismissed");
        expect(writeText).not.toHaveBeenCalled();
    });
});
