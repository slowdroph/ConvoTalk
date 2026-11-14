import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import User from "../models/User";
import Post from "../models/Post";
import Comment from "../models/Comment";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import { generatePublicId } from "../utils/publicId";
import { createPost } from "../services/post";
import {
    createComment,
    deleteComment,
    listComments,
} from "../services/comment";
import {
    commentParamsSchema,
    commentsQuerySchema,
    createCommentSchema,
} from "../validations";
import {
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from "../utils/errors";

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

describe("comments: criação", () => {
    it("cria comentário, popula o autor e incrementa o contador", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post comentável",
        });

        const result = await createComment(
            bob._id.toString(),
            post._id,
            { content: "  Muito bom!  " },
        );

        expect(result.comment.content).toBe("Muito bom!");
        expect(result.comment.author?.name).toBe("Bob");
        expect(result.comment.post).toBe(post._id);
        expect(result.commentCount).toBe(1);

        const stored = await Post.findById(post._id).lean();
        expect(stored?.commentCount).toBe(1);
    });

    it("rejeita comentário vazio ou acima de 500 caracteres", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post",
        });

        await expect(
            createComment(alice._id.toString(), post._id, { content: "   " }),
        ).rejects.toBeInstanceOf(ValidationError);

        await expect(
            createComment(alice._id.toString(), post._id, {
                content: "a".repeat(501),
            }),
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejeita comentário em post inexistente", async () => {
        const alice = await createUser("Alice", "alice@test.com");

        await expect(
            createComment(alice._id.toString(), "6af79694b9f591cd6b8a76d5", {
                content: "Oi",
            }),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("é idempotente com o mesmo clientCommentId", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post",
        });

        const first = await createComment(alice._id.toString(), post._id, {
            content: "Comentário único",
            clientCommentId: "client-comment-1",
        });
        const second = await createComment(alice._id.toString(), post._id, {
            content: "Comentário único",
            clientCommentId: "client-comment-1",
        });

        expect(second.comment._id).toBe(first.comment._id);
        expect(second.commentCount).toBe(1);
        expect(await Comment.countDocuments({ post: post._id })).toBe(1);
    });
});

describe("comments: listagem", () => {
    it("lista os mais recentes primeiro com paginação por cursor", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post",
        });

        const first = await createComment(alice._id.toString(), post._id, {
            content: "Primeiro",
        });
        const second = await createComment(alice._id.toString(), post._id, {
            content: "Segundo",
        });
        const third = await createComment(alice._id.toString(), post._id, {
            content: "Terceiro",
        });

        const page = await listComments(alice._id.toString(), post._id, {
            limit: 2,
        });

        expect(page.comments.map((comment) => comment._id)).toEqual([
            third.comment._id,
            second.comment._id,
        ]);
        expect(page.nextCursor).not.toBeNull();

        const next = await listComments(alice._id.toString(), post._id, {
            limit: 2,
            before: page.nextCursor!.before,
            beforeId: page.nextCursor!.beforeId,
        });

        expect(next.comments.map((comment) => comment._id)).toEqual([
            first.comment._id,
        ]);
        expect(next.nextCursor).toBeNull();
    });

    it("omite comentários de autores bloqueados pelo visualizador", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post",
        });

        await createComment(bob._id.toString(), post._id, {
            content: "Comentário do Bob",
        });
        await createComment(alice._id.toString(), post._id, {
            content: "Comentário da Alice",
        });

        await User.updateOne(
            { _id: bob._id },
            { $addToSet: { blockedUsers: carol._id } },
        );

        const page = await listComments(carol._id.toString(), post._id, {
            limit: 20,
        });

        expect(page.comments.map((comment) => comment.content)).toEqual([
            "Comentário da Alice",
        ]);
    });
});

describe("comments: bloqueios", () => {
    it("impede comentar e listar quando há bloqueio com o autor do post", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post",
        });

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: bob._id } },
        );

        await expect(
            createComment(bob._id.toString(), post._id, { content: "Oi" }),
        ).rejects.toBeInstanceOf(ForbiddenError);

        await expect(
            listComments(bob._id.toString(), post._id, { limit: 20 }),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });
});

describe("comments: exclusão", () => {
    it("permite que o autor do comentário exclua e decrementa o contador", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post",
        });

        const created = await createComment(bob._id.toString(), post._id, {
            content: "Comentário",
        });

        const result = await deleteComment(
            bob._id.toString(),
            post._id,
            created.comment._id,
        );

        expect(result).toEqual({
            commentId: created.comment._id,
            commentCount: 0,
        });
        expect(await Comment.countDocuments({ post: post._id })).toBe(0);

        const stored = await Post.findById(post._id).lean();
        expect(stored?.commentCount).toBe(0);
    });

    it("permite que o autor do post exclua o comentário de outra pessoa", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post",
        });

        const created = await createComment(bob._id.toString(), post._id, {
            content: "Comentário",
        });

        await expect(
            deleteComment(
                alice._id.toString(),
                post._id,
                created.comment._id,
            ),
        ).resolves.toMatchObject({ commentId: created.comment._id });
    });

    it("bloqueia terceiros e não permite excluir duas vezes", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post",
        });

        const created = await createComment(bob._id.toString(), post._id, {
            content: "Comentário",
        });

        await expect(
            deleteComment(
                carol._id.toString(),
                post._id,
                created.comment._id,
            ),
        ).rejects.toBeInstanceOf(ForbiddenError);

        await deleteComment(
            bob._id.toString(),
            post._id,
            created.comment._id,
        );

        await expect(
            deleteComment(
                bob._id.toString(),
                post._id,
                created.comment._id,
            ),
        ).rejects.toBeInstanceOf(NotFoundError);

        const stored = await Post.findById(post._id).lean();
        expect(stored?.commentCount).toBe(0);
    });

    it("mantém o contador consistente ao excluir um post com comentários", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post",
        });

        await createComment(alice._id.toString(), post._id, {
            content: "Um",
        });
        await createComment(alice._id.toString(), post._id, {
            content: "Dois",
        });

        await Post.updateOne({ _id: post._id }, { $set: { deleted: true } });

        await expect(
            createComment(alice._id.toString(), post._id, { content: "Três" }),
        ).rejects.toBeInstanceOf(NotFoundError);

        const stored = await Post.findById(post._id).lean();
        expect(stored?.commentCount).toBe(2);
    });
});

describe("comments: validações", () => {
    it("valida parâmetros e corpo das requisições", () => {
        expect(
            commentsQuerySchema.safeParse({
                params: { id: "6af79694b9f591cd6b8a76d5" },
                query: {},
            }).success,
        ).toBe(true);

        expect(
            commentsQuerySchema.safeParse({
                params: { id: "6af79694b9f591cd6b8a76d5" },
                query: { before: "2026-01-01T00:00:00.000Z" },
            }).success,
        ).toBe(false);

        expect(
            createCommentSchema.safeParse({
                params: { id: "6af79694b9f591cd6b8a76d5" },
                body: { content: "   " },
            }).success,
        ).toBe(false);

        expect(
            createCommentSchema.safeParse({
                params: { id: "6af79694b9f591cd6b8a76d5" },
                body: { content: "Comentário válido" },
            }).success,
        ).toBe(true);

        expect(
            commentParamsSchema.safeParse({
                params: {
                    id: "6af79694b9f591cd6b8a76d5",
                    commentId: "inválido",
                },
            }).success,
        ).toBe(false);
    });
});
