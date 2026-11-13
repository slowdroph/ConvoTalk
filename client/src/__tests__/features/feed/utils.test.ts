import { describe, it, expect } from "vitest";
import type { Post } from "../../../types";
import {
    applyFeedEvent,
    applyLikeEvent,
    mergeFeedPosts,
    removeFeedPost,
    upsertFeedPost,
} from "../../../features/feed/utils";

function makePost(overrides: Partial<Post> = {}): Post {
    return {
        _id: "post-1",
        author: {
            _id: "author-1",
            name: "Ana",
            publicId: "ABCD1234",
            avatar: "",
            status: "",
        },
        content: "Olá",
        image: null,
        likeCount: 0,
        likedByMe: false,
        edited: false,
        createdAt: "2026-01-01T10:00:00.000Z",
        ...overrides,
    };
}

describe("feed utils", () => {
    it("mescla páginas mantendo ordem cronológica e sem duplicatas", () => {
        const older = makePost({
            _id: "a",
            createdAt: "2026-01-01T09:00:00.000Z",
        });
        const newer = makePost({
            _id: "b",
            createdAt: "2026-01-01T11:00:00.000Z",
        });

        const merged = mergeFeedPosts([older], [newer, older]);

        expect(merged.map((post) => post._id)).toEqual(["b", "a"]);
    });

    it("insere post novo no topo e substitui existente no upsert", () => {
        const first = makePost({ _id: "a" });
        const second = makePost({ _id: "b" });

        expect(upsertFeedPost([first], second).map((p) => p._id)).toEqual([
            "b",
            "a",
        ]);

        const updated = upsertFeedPost([first], {
            ...first,
            content: "Editado",
        });
        expect(updated).toHaveLength(1);
        expect(updated[0].content).toBe("Editado");
    });

    it("remove o post pelo id", () => {
        const posts = [makePost({ _id: "a" }), makePost({ _id: "b" })];
        expect(removeFeedPost(posts, "a").map((post) => post._id)).toEqual([
            "b",
        ]);
    });

    it("aplica evento de curtida de outro usuário sem alterar likedByMe", () => {
        const posts = [makePost({ _id: "a", likeCount: 1 })];

        const result = applyLikeEvent(
            posts,
            { postId: "a", likeCount: 2, userId: "other", liked: true },
            "me",
        );

        expect(result[0].likeCount).toBe(2);
        expect(result[0].likedByMe).toBe(false);
    });

    it("atualiza likedByMe quando o evento é do próprio usuário", () => {
        const posts = [makePost({ _id: "a", likeCount: 0 })];
        const result = applyLikeEvent(
            posts,
            { postId: "a", likeCount: 1, userId: "me", liked: true },
            "me",
        );

        expect(result[0].likedByMe).toBe(true);
    });

    it("ordena posts com o mesmo createdAt pelo _id de forma determinística", () => {
        const first = makePost({
            _id: "a",
            createdAt: "2026-01-01T10:00:00.000Z",
        });
        const second = makePost({
            _id: "b",
            createdAt: "2026-01-01T10:00:00.000Z",
        });

        const merged = mergeFeedPosts([first], [second]);

        expect(merged.map((post) => post._id)).toEqual(["b", "a"]);
    });

    it("aplica evento de novo post", () => {
        const current = [
            makePost({ _id: "a", createdAt: "2026-01-01T09:00:00.000Z" }),
        ];
        const incoming = makePost({
            _id: "b",
            createdAt: "2026-01-01T11:00:00.000Z",
        });

        const result = applyFeedEvent(
            current,
            { type: "new", post: incoming },
            "me",
        );

        expect(result.map((post) => post._id)).toEqual(["b", "a"]);
    });

    it("ignora evento de novo post já presente no feed", () => {
        const current = [makePost({ _id: "a" })];
        const result = applyFeedEvent(
            current,
            { type: "new", post: makePost({ _id: "a", content: "Outro" }) },
            "me",
        );

        expect(result).toBe(current);
    });

    it("aplica evento de curtida", () => {
        const current = [makePost({ _id: "a", likeCount: 1 })];
        const result = applyFeedEvent(
            current,
            {
                type: "liked",
                event: { postId: "a", likeCount: 2, userId: "me", liked: true },
            },
            "me",
        );

        expect(result[0]).toMatchObject({ likeCount: 2, likedByMe: true });
    });

    it("aplica evento de exclusão", () => {
        const current = [makePost({ _id: "a" }), makePost({ _id: "b" })];
        const result = applyFeedEvent(
            current,
            { type: "deleted", postId: "a" },
            "me",
        );

        expect(result.map((post) => post._id)).toEqual(["b"]);
    });
});
