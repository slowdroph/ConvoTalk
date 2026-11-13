import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import User from "../models/User";
import Post from "../models/Post";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import { generatePublicId } from "../utils/publicId";
import {
    createPost,
    getFeed,
    getPost,
    getUserPosts,
    deletePost,
    setPostLike,
} from "../services/post";
import {
    createPostSchema,
    postsQuerySchema,
    postsByUserQuerySchema,
    postParamsSchema,
} from "../validations";
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/errors";

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

describe("posts: criação", () => {
    it("cria post de texto com autor e curtidas zeradas", async () => {
        const user = await createUser("Alice", "alice@test.com");

        const post = await createPost(user._id.toString(), {
            content: "  Meu primeiro post  ",
        });

        expect(post.content).toBe("Meu primeiro post");
        expect(post.author?.name).toBe("Alice");
        expect(post.likeCount).toBe(0);
        expect(post.likedByMe).toBe(false);
        expect(post.image).toBeNull();

        const stored = await Post.findById(post._id).lean();
        expect(stored?.deleted).toBe(false);
    });

    it("rejeita post vazio sem imagem", async () => {
        const user = await createUser("Alice", "alice@test.com");

        await expect(
            createPost(user._id.toString(), { content: "   " }),
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("é idempotente com o mesmo clientPostId", async () => {
        const user = await createUser("Alice", "alice@test.com");

        const first = await createPost(user._id.toString(), {
            content: "Post único",
            clientPostId: "client-post-1",
        });
        const second = await createPost(user._id.toString(), {
            content: "Post único",
            clientPostId: "client-post-1",
        });

        expect(second._id).toBe(first._id);
        expect(await Post.countDocuments()).toBe(1);
    });

    it("é idempotente em envios concorrentes com o mesmo clientPostId", async () => {
        const user = await createUser("Alice", "alice@test.com");

        const [first, second] = await Promise.all([
            createPost(user._id.toString(), {
                content: "Post concorrente",
                clientPostId: "client-post-concurrent",
            }),
            createPost(user._id.toString(), {
                content: "Post concorrente",
                clientPostId: "client-post-concurrent",
            }),
        ]);

        expect(second._id).toBe(first._id);
        expect(await Post.countDocuments()).toBe(1);
    });

    it("aceita o mesmo clientPostId para autores diferentes", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const first = await createPost(alice._id.toString(), {
            content: "Post da Alice",
            clientPostId: "shared-id",
        });
        const second = await createPost(bob._id.toString(), {
            content: "Post do Bob",
            clientPostId: "shared-id",
        });

        expect(second._id).not.toBe(first._id);
        expect(await Post.countDocuments()).toBe(2);
    });
});

describe("posts: feed e paginação", () => {
    it("lista posts mais recentes primeiro", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const first = await createPost(alice._id.toString(), {
            content: "Primeiro",
        });
        await new Promise((resolve) => setTimeout(resolve, 10));
        const second = await createPost(bob._id.toString(), {
            content: "Segundo",
        });

        const feed = await getFeed(alice._id.toString(), { limit: 20 });

        expect(feed.posts.map((post) => post._id)).toEqual([
            second._id,
            first._id,
        ]);
        expect(feed.nextCursor).toBeNull();
    });

    it("pagina por cursor sem duplicar posts", async () => {
        const alice = await createUser("Alice", "alice@test.com");

        const created: string[] = [];
        for (let i = 0; i < 3; i++) {
            const post = await createPost(alice._id.toString(), {
                content: `Post ${i}`,
            });
            created.push(post._id);
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        const firstPage = await getFeed(alice._id.toString(), { limit: 2 });
        expect(firstPage.posts).toHaveLength(2);
        expect(firstPage.nextCursor).not.toBeNull();

        const secondPage = await getFeed(alice._id.toString(), {
            limit: 2,
            before: firstPage.nextCursor!.before,
            beforeId: firstPage.nextCursor!.beforeId,
        });

        expect(secondPage.posts).toHaveLength(1);
        expect(secondPage.nextCursor).toBeNull();

        const ids = [
            ...firstPage.posts.map((post) => post._id),
            ...secondPage.posts.map((post) => post._id),
        ];
        expect(new Set(ids).size).toBe(3);
        expect(ids).toEqual([...created].reverse());
    });

    it("exclui posts de usuários bloqueados nas duas direções", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        await createPost(alice._id.toString(), { content: "Post da Alice" });
        await createPost(bob._id.toString(), { content: "Post do Bob" });

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: bob._id } },
        );

        const aliceFeed = await getFeed(alice._id.toString(), { limit: 20 });
        expect(aliceFeed.posts.map((post) => post.author?.name)).toEqual([
            "Alice",
        ]);

        const bobFeed = await getFeed(bob._id.toString(), { limit: 20 });
        expect(bobFeed.posts.map((post) => post.author?.name)).toEqual([
            "Bob",
        ]);
    });

    it("lista apenas os posts do usuário solicitado", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const alicePost = await createPost(alice._id.toString(), {
            content: "Só da Alice",
        });
        await createPost(bob._id.toString(), { content: "Só do Bob" });

        const posts = await getUserPosts(
            alice._id.toString(),
            alice._id.toString(),
            { limit: 20 },
        );

        expect(posts.posts).toHaveLength(1);
        expect(posts.posts[0]._id).toBe(alicePost._id);
    });

    it("bloqueia acesso aos posts de usuário bloqueado", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        await User.updateOne(
            { _id: bob._id },
            { $addToSet: { blockedUsers: alice._id } },
        );

        await expect(
            getUserPosts(alice._id.toString(), bob._id.toString(), {
                limit: 20,
            }),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("permite visualizar o próprio post mesmo com bloqueios registrados", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: bob._id } },
        );

        const post = await createPost(alice._id.toString(), {
            content: "Post próprio",
        });

        await expect(
            getPost(alice._id.toString(), post._id),
        ).resolves.toMatchObject({ _id: post._id });
    });
});

describe("posts: exclusão e curtidas", () => {
    it("permite excluir apenas o próprio post", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const post = await createPost(alice._id.toString(), {
            content: "Post da Alice",
        });

        await expect(
            deletePost(bob._id.toString(), post._id),
        ).rejects.toBeInstanceOf(ForbiddenError);

        await deletePost(alice._id.toString(), post._id);

        await expect(
            getPost(alice._id.toString(), post._id),
        ).rejects.toBeInstanceOf(NotFoundError);

        const feed = await getFeed(alice._id.toString(), { limit: 20 });
        expect(feed.posts).toHaveLength(0);
    });

    it("curtir e descurtir é idempotente", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const post = await createPost(alice._id.toString(), {
            content: "Post curtível",
        });

        const firstLike = await setPostLike(bob._id.toString(), post._id, true);
        expect(firstLike).toEqual({ likeCount: 1, liked: true });

        const secondLike = await setPostLike(bob._id.toString(), post._id, true);
        expect(secondLike).toEqual({ likeCount: 1, liked: true });

        const viewed = await getPost(bob._id.toString(), post._id);
        expect(viewed.likeCount).toBe(1);
        expect(viewed.likedByMe).toBe(true);

        const unlike = await setPostLike(bob._id.toString(), post._id, false);
        expect(unlike).toEqual({ likeCount: 0, liked: false });

        const viewedAfter = await getPost(bob._id.toString(), post._id);
        expect(viewedAfter.likedByMe).toBe(false);
    });

    it("bloqueia curtida entre usuários com bloqueio em qualquer direção", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const carol = await createUser("Carol", "carol@test.com");

        await User.updateOne(
            { _id: carol._id },
            { $addToSet: { blockedUsers: alice._id } },
        );

        const post = await createPost(alice._id.toString(), {
            content: "Post bloqueado",
        });

        await expect(
            setPostLike(carol._id.toString(), post._id, true),
        ).rejects.toBeInstanceOf(ForbiddenError);

        const stored = await Post.findById(post._id).select("likes").lean();
        expect(stored?.likes).toHaveLength(0);
    });

    it("permite curtir o próprio post mesmo com bloqueios registrados", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: bob._id } },
        );

        const post = await createPost(alice._id.toString(), {
            content: "Post da Alice",
        });

        await expect(
            setPostLike(alice._id.toString(), post._id, true),
        ).resolves.toEqual({ likeCount: 1, liked: true });
    });

    it("bloqueia visualização de post de usuário bloqueado", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const post = await createPost(alice._id.toString(), {
            content: "Post da Alice",
        });

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: bob._id } },
        );

        await expect(
            getPost(bob._id.toString(), post._id),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("bloqueia curtidas de usuário bloqueado pelo autor", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const post = await createPost(alice._id.toString(), {
            content: "Post da Alice",
        });

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: bob._id } },
        );

        await expect(
            setPostLike(bob._id.toString(), post._id, true),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });
});

describe("posts: validações", () => {
    it("aceita conteúdo e clientPostId válidos", () => {
        const result = createPostSchema.safeParse({
            body: { content: "Olá", clientPostId: "abc-123" },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita conteúdo acima de 2000 caracteres", () => {
        const result = createPostSchema.safeParse({
            body: { content: "a".repeat(2001) },
        });
        expect(result.success).toBe(false);
    });

    it("exige beforeId quando before é informado", () => {
        const result = postsQuerySchema.safeParse({
            query: { before: new Date().toISOString() },
        });
        expect(result.success).toBe(false);
    });

    it("exige before quando beforeId é informado", () => {
        const result = postsQuerySchema.safeParse({
            query: { beforeId: "507f1f77bcf86cd799439011" },
        });
        expect(result.success).toBe(false);
    });

    it("aceita cursor completo", () => {
        const result = postsQuerySchema.safeParse({
            query: {
                before: new Date().toISOString(),
                beforeId: "507f1f77bcf86cd799439011",
            },
        });
        expect(result.success).toBe(true);
    });

    it("valida parâmetros de usuário e de post", () => {
        expect(
            postsByUserQuerySchema.safeParse({
                params: { userId: "507f1f77bcf86cd799439011" },
                query: {},
            }).success,
        ).toBe(true);
        expect(
            postParamsSchema.safeParse({
                params: { id: "inválido" },
            }).success,
        ).toBe(false);
    });
});
