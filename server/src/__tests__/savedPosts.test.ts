import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
} from "vitest";
import type { Server as SocketIOServer } from "socket.io";
import User from "../models/User";
import Post from "../models/Post";
import SavedPost from "../models/SavedPost";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import { generatePublicId } from "../utils/publicId";
import { createPost, deletePost, getFeed, getPost } from "../services/post";
import {
    listSavedPosts,
    savePost,
    unsavePost,
} from "../services/savedPost";
import { addUserSocket, removeUserSocket } from "../socket/onlineUsers";
import { setSocketIO } from "../config/io";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { savedPostsQuerySchema } from "../validations";

interface EmittedEvent {
    socketId: string;
    event: string;
    payload: unknown;
}

let emitted: EmittedEvent[] = [];
let connectedUserIds: string[] = [];

function connect(userId: string): void {
    addUserSocket(userId, `socket-${userId}`);
    connectedUserIds.push(userId);
}

setSocketIO({
    to: (socketId: string) => ({
        emit: (event: string, payload: unknown) => {
            emitted.push({ socketId, event, payload });
        },
    }),
} as unknown as SocketIOServer);

beforeAll(async () => {
    await startTestDb();
}, 180_000);

afterAll(async () => {
    setSocketIO(null as unknown as SocketIOServer);
    await stopTestDb();
}, 30_000);

beforeEach(async () => {
    emitted = [];
    connectedUserIds = [];
    await clearTestDb();
});

afterEach(() => {
    for (const userId of connectedUserIds) {
        removeUserSocket(userId, `socket-${userId}`);
    }
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

describe("posts salvos", () => {
    it("salva e desalva de forma idempotente", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post salvável",
        });

        const postId = post._id;
        await savePost(alice._id.toString(), postId);
        await savePost(alice._id.toString(), postId);

        expect(
            await SavedPost.countDocuments({
                user: alice._id,
                post: postId,
            }),
        ).toBe(1);

        await unsavePost(alice._id.toString(), postId);
        await unsavePost(alice._id.toString(), postId);

        expect(
            await SavedPost.countDocuments({
                user: alice._id,
                post: postId,
            }),
        ).toBe(0);
    });

    it("rejeita salvar um post inexistente", async () => {
        const alice = await createUser("Alice", "alice@test.com");

        await expect(
            savePost(alice._id.toString(), "64b7f0f0f0f0f0f0f0f0f0f0"),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("bloqueia salvar post de autor bloqueado", async () => {
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
            savePost(bob._id.toString(), post._id),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("marca savedByMe no feed e no post individual", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post da Alice",
        });

        await savePost(bob._id.toString(), post._id);

        const feed = await getFeed(bob._id.toString(), { limit: 10 });
        expect(feed.posts[0].savedByMe).toBe(true);

        const single = await getPost(bob._id.toString(), post._id);
        expect(single.savedByMe).toBe(true);

        const aliceFeed = await getFeed(alice._id.toString(), { limit: 10 });
        expect(aliceFeed.posts[0].savedByMe).toBe(false);
    });

    it("lista os salvos do mais recente para o mais antigo", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const first = await createPost(alice._id.toString(), {
            content: "Primeiro",
        });
        const second = await createPost(alice._id.toString(), {
            content: "Segundo",
        });

        await savePost(alice._id.toString(), first._id);
        await savePost(alice._id.toString(), second._id);

        const result = await listSavedPosts(alice._id.toString(), {
            limit: 10,
        });

        expect(result.posts.map((post) => post._id)).toEqual([
            second._id,
            first._id,
        ]);
        expect(result.nextCursor).toBeNull();
    });

    it("pagina a lista de salvos com cursor próprio", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const first = await createPost(alice._id.toString(), {
            content: "Primeiro",
        });
        const second = await createPost(alice._id.toString(), {
            content: "Segundo",
        });

        await savePost(alice._id.toString(), first._id);
        await savePost(alice._id.toString(), second._id);

        const firstPage = await listSavedPosts(alice._id.toString(), {
            limit: 1,
        });
        expect(firstPage.posts.map((post) => post._id)).toEqual([second._id]);
        expect(firstPage.nextCursor).not.toBeNull();
        const cursor = firstPage.nextCursor as {
            before: string;
            beforeId: string;
        };

        const secondPage = await listSavedPosts(alice._id.toString(), {
            limit: 1,
            before: cursor.before,
            beforeId: cursor.beforeId,
        });
        expect(secondPage.posts.map((post) => post._id)).toEqual([first._id]);
        expect(secondPage.nextCursor).toBeNull();
    });

    it("remove registros salvos ao excluir o post", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post da Alice",
        });

        await savePost(bob._id.toString(), post._id);
        await deletePost(alice._id.toString(), post._id);

        expect(await SavedPost.countDocuments({ post: post._id })).toBe(0);
        expect(await Post.findById(post._id).lean()).toBeNull();
        const result = await listSavedPosts(bob._id.toString(), {
            limit: 10,
        });
        expect(result.posts).toHaveLength(0);
    });

    it("emite o evento apenas para os sockets do próprio usuário", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post salvável",
        });

        connect(alice._id.toString());
        connect(bob._id.toString());
        emitted = [];

        await savePost(bob._id.toString(), post._id);

        expect(emitted).toHaveLength(1);
        expect(emitted[0].socketId).toBe(`socket-${bob._id.toString()}`);
        expect(emitted[0].event).toBe("post:saved");
        expect(emitted[0].payload).toMatchObject({
            postId: post._id,
            userId: bob._id.toString(),
            saved: true,
        });

        emitted = [];
        await unsavePost(bob._id.toString(), post._id);

        expect(emitted).toHaveLength(1);
        expect(emitted[0].socketId).toBe(`socket-${bob._id.toString()}`);
        expect(emitted[0].event).toBe("post:unsaved");
    });

    it("valida os parâmetros de paginação da lista de salvos", () => {
        expect(
            savedPostsQuerySchema.safeParse({ query: { limit: "10" } })
                .success,
        ).toBe(true);
        expect(
            savedPostsQuerySchema.safeParse({ query: { before: "x" } }).success,
        ).toBe(false);
        expect(
            savedPostsQuerySchema.safeParse({ query: { beforeId: "x" } })
                .success,
        ).toBe(false);
    });
});
