import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import User from "../models/User";
import Post from "../models/Post";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import { generatePublicId } from "../utils/publicId";
import {
    createPost,
    getFeed,
    getPost,
    getPostStats,
    getTrendingTopics,
    getUserPosts,
    backfillPostLikeCounts,
    deletePost,
    setPostLike,
} from "../services/post";
import {
    createPostSchema,
    postsQuerySchema,
    postsByUserQuerySchema,
    postParamsSchema,
    trendingTopicsQuerySchema,
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

        const cursor = firstPage.nextCursor!;
        if (!("before" in cursor)) {
            throw new Error("cursor recente esperado");
        }

        const secondPage = await getFeed(alice._id.toString(), {
            limit: 2,
            before: cursor.before,
            beforeId: cursor.beforeId,
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

describe("posts: filtros, estatísticas e tendências", () => {
    it("filtra posts com imagem", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const withImage = await Post.create({
            author: alice._id,
            content: "Com imagem",
            image: {
                url: "https://example.com/image.png",
                filename: "image.png",
                mimetype: "image/png",
                size: 100,
            },
        });
        await Post.create({ author: bob._id, content: "Sem imagem" });

        const feed = await getFeed(alice._id.toString(), {
            limit: 20,
            filter: "media",
        });

        expect(feed.posts.map((post) => post._id)).toEqual([
            withImage._id.toString(),
        ]);
        expect(feed.posts[0].image).not.toBeNull();
    });

    it("filtra apenas os posts do usuário autenticado", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const alicePost = await createPost(alice._id.toString(), {
            content: "Post da Alice",
        });
        await createPost(bob._id.toString(), { content: "Post do Bob" });

        const feed = await getFeed(alice._id.toString(), {
            limit: 20,
            filter: "mine",
        });

        expect(feed.posts.map((post) => post._id)).toEqual([alicePost._id]);
    });

    it("ordena por curtidas com paginação por beforeLikes", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");
        const dave = await createUser("Dave", "dave@test.com");

        const first = await createPost(alice._id.toString(), {
            content: "Sem curtidas",
        });
        const second = await createPost(alice._id.toString(), {
            content: "Duas curtidas",
        });
        const third = await createPost(alice._id.toString(), {
            content: "Uma curtida",
        });

        await setPostLike(bob._id.toString(), second._id, true);
        await setPostLike(carol._id.toString(), second._id, true);
        await setPostLike(dave._id.toString(), third._id, true);

        const firstPage = await getFeed(alice._id.toString(), {
            limit: 2,
            sort: "popular",
        });

        expect(firstPage.posts.map((post) => post._id)).toEqual([
            second._id,
            third._id,
        ]);
        expect(firstPage.nextCursor).not.toBeNull();

        const cursor = firstPage.nextCursor!;
        if (!("beforeLikes" in cursor)) {
            throw new Error("cursor popular esperado");
        }
        expect(cursor.beforeLikes).toBe(1);

        const secondPage = await getFeed(alice._id.toString(), {
            limit: 2,
            sort: "popular",
            beforeLikes: cursor.beforeLikes,
            beforeId: cursor.beforeId,
        });

        expect(secondPage.posts.map((post) => post._id)).toEqual([first._id]);
        expect(secondPage.nextCursor).toBeNull();
    });

    it("calcula estatísticas de posts e curtidas recebidas", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const first = await createPost(alice._id.toString(), {
            content: "Primeiro",
        });
        const second = await createPost(alice._id.toString(), {
            content: "Segundo",
        });
        const deleted = await createPost(alice._id.toString(), {
            content: "Excluído",
        });

        await setPostLike(bob._id.toString(), first._id, true);
        await setPostLike(alice._id.toString(), second._id, true);
        await setPostLike(bob._id.toString(), deleted._id, true);
        await deletePost(alice._id.toString(), deleted._id);

        await expect(
            getPostStats(alice._id.toString()),
        ).resolves.toEqual({ postCount: 2, totalLikes: 2 });
    });

    it("retorna tópicos em alta ignorando bloqueios e posts excluídos", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");

        await Post.create({
            author: alice._id,
            content: "Dica de #WebRTC para chamadas",
        });
        await Post.create({
            author: bob._id,
            content: "Mais #WebRTC e #Dica",
        });
        await Post.create({
            author: carol._id,
            content: "Post sem hashtag",
        });

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: carol._id } },
        );
        await Post.create({
            author: carol._id,
            content: "#Bloqueado #WebRTC",
            deleted: false,
        });
        await Post.create({
            author: alice._id,
            content: "#Excluido",
            deleted: true,
        });

        const topics = await getTrendingTopics(alice._id.toString(), 5);

        expect(topics).toEqual([
            { tag: "#webrtc", count: 2 },
            { tag: "#dica", count: 1 },
        ]);
    });

    it("sincroniza likeCount ao curtir e descurtir", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");

        const post = await createPost(alice._id.toString(), {
            content: "Post curtível",
        });

        await setPostLike(bob._id.toString(), post._id, true);
        await setPostLike(bob._id.toString(), post._id, true);
        await setPostLike(carol._id.toString(), post._id, true);

        let stored = await Post.findById(post._id).lean();
        expect(stored?.likeCount).toBe(2);
        expect(stored?.likes).toHaveLength(2);

        await setPostLike(bob._id.toString(), post._id, false);

        stored = await Post.findById(post._id).lean();
        expect(stored?.likeCount).toBe(1);
        expect(stored?.likes).toHaveLength(1);
    });

    it("preenche likeCount de posts antigos", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");

        const post = await Post.create({
            author: alice._id,
            content: "Post legado",
        });

        await Post.collection.updateOne(
            { _id: post._id },
            { $set: { likes: [bob._id] }, $unset: { likeCount: 1 } },
        );

        await backfillPostLikeCounts();

        const stored = await Post.findById(post._id).lean();
        expect(stored?.likeCount).toBe(1);
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

    it("aceita cursor popular completo", () => {
        const result = postsQuerySchema.safeParse({
            query: {
                sort: "popular",
                beforeLikes: 3,
                beforeId: "507f1f77bcf86cd799439011",
            },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita cursor popular incompleto", () => {
        expect(
            postsQuerySchema.safeParse({
                query: { sort: "popular", beforeLikes: 3 },
            }).success,
        ).toBe(false);
        expect(
            postsQuerySchema.safeParse({
                query: {
                    sort: "popular",
                    beforeId: "507f1f77bcf86cd799439011",
                },
            }).success,
        ).toBe(false);
    });

    it("rejeita beforeLikes na ordenação recente", () => {
        const result = postsQuerySchema.safeParse({
            query: {
                beforeLikes: 1,
                beforeId: "507f1f77bcf86cd799439011",
            },
        });
        expect(result.success).toBe(false);
    });

    it("valida o limite dos tópicos em alta", () => {
        expect(
            trendingTopicsQuerySchema.safeParse({ query: { limit: 5 } })
                .success,
        ).toBe(true);
        expect(
            trendingTopicsQuerySchema.safeParse({ query: { limit: 11 } })
                .success,
        ).toBe(false);
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
