import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import User from "../models/User";
import Post from "../models/Post";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import { generatePublicId } from "../utils/publicId";
import {
    createPost,
    deletePost,
    searchPosts,
} from "../services/post";
import { postSearchRequestSchema } from "../validations";
import { ValidationError } from "../utils/errors";
import postsRouter from "../routes/posts";

beforeAll(async () => {
    await startTestDb();
}, 180_000);

afterAll(async () => {
    await stopTestDb();
}, 30_000);

beforeEach(async () => {
    await clearTestDb();
});

async function createUser(name: string, email: string) {
    return User.create({
        name,
        email,
        publicId: generatePublicId(),
        password: "password123",
        verified: true,
    });
}

describe("posts: busca", () => {
    it("encontra por trecho sem diferenciar maiúsculas", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        await createPost(alice._id.toString(), {
            content: "Aprendendo TypeScript hoje",
        });
        await createPost(alice._id.toString(), {
            content: "Outro assunto qualquer",
        });

        const result = await searchPosts(alice._id.toString(), {
            q: "TYPESCRIPT",
            limit: 10,
        });

        expect(result.posts).toHaveLength(1);
        expect(result.posts[0].content).toBe("Aprendendo TypeScript hoje");
    });

    it("encontra por hashtag", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        await createPost(alice._id.toString(), {
            content: "Testando #WebRTC na prática",
        });

        const result = await searchPosts(alice._id.toString(), {
            q: "#webrtc",
            limit: 10,
        });

        expect(result.posts).toHaveLength(1);
    });

    it("trata caracteres especiais como texto literal", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        await createPost(alice._id.toString(), { content: "100% pronto (ok)" });
        await createPost(alice._id.toString(), { content: "100 pontos" });

        const result = await searchPosts(alice._id.toString(), {
            q: "100% pronto (ok)",
            limit: 10,
        });

        expect(result.posts).toHaveLength(1);
        expect(result.posts[0].content).toBe("100% pronto (ok)");
    });

    it("respeita bloqueios nas duas direções", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");

        await createPost(alice._id.toString(), { content: "Segredo do feed" });
        await createPost(bob._id.toString(), { content: "Segredo do feed" });
        await createPost(carol._id.toString(), { content: "Segredo do feed" });

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: bob._id } },
        );

        const result = await searchPosts(alice._id.toString(), {
            q: "segredo",
            limit: 10,
        });

        expect(
            result.posts.map((post) => post.author?._id).sort(),
        ).toEqual([alice._id.toString(), carol._id.toString()].sort());
    });

    it("ignora posts excluídos", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Conteúdo apagado",
        });

        await deletePost(alice._id.toString(), post._id);

        const result = await searchPosts(alice._id.toString(), {
            q: "apagado",
            limit: 10,
        });

        expect(result.posts).toHaveLength(0);
    });

    it("aplica o filtro de mídia", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const textPost = await createPost(alice._id.toString(), {
            content: "Busca com imagem",
        });
        const mediaPost = await createPost(alice._id.toString(), {
            content: "Busca com imagem",
        });

        await Post.updateOne(
            { _id: mediaPost._id },
            {
                $set: {
                    image: {
                        url: "https://example.com/a.png",
                        filename: "a.png",
                        mimetype: "image/png",
                        size: 100,
                    },
                },
            },
        );

        const result = await searchPosts(alice._id.toString(), {
            q: "imagem",
            filter: "media",
            limit: 10,
        });

        expect(result.posts.map((post) => post._id)).toEqual([mediaPost._id]);
        expect(result.posts[0]._id).not.toBe(textPost._id);
    });

    it("aplica o filtro de meus posts", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        await createPost(alice._id.toString(), { content: "Post da Alice" });
        await createPost(bob._id.toString(), { content: "Post do Bob" });

        const result = await searchPosts(alice._id.toString(), {
            q: "post",
            filter: "mine",
            limit: 10,
        });

        expect(result.posts).toHaveLength(1);
        expect(result.posts[0].author?._id).toBe(alice._id.toString());
    });

    it("pagina por cursor sem duplicar posts", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        for (let index = 1; index <= 3; index += 1) {
            await createPost(alice._id.toString(), {
                content: `Resultado ${index}`,
            });
        }

        const firstPage = await searchPosts(alice._id.toString(), {
            q: "resultado",
            limit: 2,
        });
        expect(firstPage.posts).toHaveLength(2);
        expect(firstPage.nextCursor).not.toBeNull();

        const cursor = firstPage.nextCursor as { before: string; beforeId: string };
        const secondPage = await searchPosts(alice._id.toString(), {
            q: "resultado",
            limit: 2,
            before: cursor.before,
            beforeId: cursor.beforeId,
        });

        expect(secondPage.posts).toHaveLength(1);
        const ids = new Set([
            ...firstPage.posts.map((post) => post._id),
            ...secondPage.posts.map((post) => post._id),
        ]);
        expect(ids.size).toBe(3);
        expect(secondPage.nextCursor).toBeNull();
    });

    it("pagina na ordenação por populares", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const first = await createPost(alice._id.toString(), {
            content: "Popular um",
        });
        const second = await createPost(alice._id.toString(), {
            content: "Popular dois",
        });

        await Post.updateOne({ _id: first._id }, { $set: { likeCount: 2 } });
        await Post.updateOne({ _id: second._id }, { $set: { likeCount: 5 } });

        const firstPage = await searchPosts(alice._id.toString(), {
            q: "popular",
            sort: "popular",
            limit: 1,
        });
        expect(firstPage.posts.map((post) => post._id)).toEqual([second._id]);

        const cursor = firstPage.nextCursor as {
            beforeLikes: number;
            beforeId: string;
        };
        const secondPage = await searchPosts(alice._id.toString(), {
            q: "popular",
            sort: "popular",
            limit: 1,
            beforeLikes: cursor.beforeLikes,
            beforeId: cursor.beforeId,
        });

        expect(secondPage.posts.map((post) => post._id)).toEqual([first._id]);
        expect(secondPage.nextCursor).toBeNull();
    });

    it("rejeita termo muito curto no service", async () => {
        const alice = await createUser("Alice", "alice@test.com");

        await expect(
            searchPosts(alice._id.toString(), { q: " a ", limit: 10 }),
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("valida os parâmetros de busca", () => {
        expect(
            postSearchRequestSchema.safeParse({ query: { q: "ab" } }).success,
        ).toBe(true);
        expect(
            postSearchRequestSchema.safeParse({ query: { q: "a" } }).success,
        ).toBe(false);
        expect(
            postSearchRequestSchema.safeParse({ query: {} }).success,
        ).toBe(false);
        expect(
            postSearchRequestSchema.safeParse({
                query: { q: "termo", limit: 31 },
            }).success,
        ).toBe(false);
        expect(
            postSearchRequestSchema.safeParse({
                query: { q: "termo", before: "2026-01-01T00:00:00.000Z" },
            }).success,
        ).toBe(false);
    });

    it("registra a rota de busca antes de /:id", () => {
        const stack = (
            postsRouter as unknown as {
                stack: Array<{ route?: { path: string } }>;
            }
        ).stack;
        const paths = stack
            .filter((layer) => layer.route)
            .map((layer) => layer.route!.path);

        expect(paths).toContain("/search");
        expect(paths.indexOf("/search")).toBeLessThan(paths.indexOf("/:id"));
    });
});
