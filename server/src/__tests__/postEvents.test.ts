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
import Comment from "../models/Comment";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import { generatePublicId } from "../utils/publicId";
import { createPost, deletePost, setPostLike } from "../services/post";
import {
    createComment,
    deleteComment,
} from "../services/comment";
import { addUserSocket, removeUserSocket } from "../socket/onlineUsers";
import { setSocketIO } from "../config/io";

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

function recipientsOf(event: string): string[] {
    return emitted
        .filter((item) => item.event === event)
        .map((item) => item.socketId)
        .sort();
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

describe("posts: emissão de eventos", () => {
    it("emite post:new respeitando bloqueios", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: carol._id } },
        );

        connect(alice._id.toString());
        connect(bob._id.toString());
        connect(carol._id.toString());

        const post = await createPost(alice._id.toString(), {
            content: "Post da Alice",
        });

        expect(recipientsOf("post:new")).toEqual(
            [
                `socket-${alice._id.toString()}`,
                `socket-${bob._id.toString()}`,
            ].sort(),
        );

        const [event] = emitted.filter((item) => item.event === "post:new");
        expect(event.payload).toMatchObject({ _id: post._id });
    });

    it("emite post:liked filtrando bloqueios do autor e do curtidor", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");
        const dave = await createUser("Dave", "dave@test.com");
        const eve = await createUser("Eve", "eve@test.com");

        await User.updateOne(
            { _id: bob._id },
            { $addToSet: { blockedUsers: carol._id } },
        );
        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: dave._id } },
        );

        const post = await createPost(alice._id.toString(), {
            content: "Post curtível",
        });

        emitted = [];

        for (const user of [alice, bob, carol, dave, eve]) {
            connect(user._id.toString());
        }

        await setPostLike(bob._id.toString(), post._id, true);

        expect(recipientsOf("post:liked")).toEqual(
            [
                `socket-${alice._id.toString()}`,
                `socket-${bob._id.toString()}`,
                `socket-${eve._id.toString()}`,
            ].sort(),
        );

        const [event] = emitted.filter((item) => item.event === "post:liked");
        expect(event.payload).toEqual({
            postId: post._id,
            likeCount: 1,
            userId: bob._id.toString(),
            liked: true,
        });
    });

    it("emite post:deleted apenas para usuários sem bloqueio", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");

        const post = await createPost(alice._id.toString(), {
            content: "Post removível",
        });

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: carol._id } },
        );

        emitted = [];

        connect(alice._id.toString());
        connect(bob._id.toString());
        connect(carol._id.toString());

        await deletePost(alice._id.toString(), post._id);

        expect(recipientsOf("post:deleted")).toEqual(
            [
                `socket-${alice._id.toString()}`,
                `socket-${bob._id.toString()}`,
            ].sort(),
        );

        const stored = await Post.findById(post._id).lean();
        expect(stored).toBeNull();
    });

    it("emite comment:created após persistir e respeitando bloqueios", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");

        const post = await createPost(alice._id.toString(), {
            content: "Post comentável",
        });

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: carol._id } },
        );

        emitted = [];

        connect(alice._id.toString());
        connect(bob._id.toString());
        connect(carol._id.toString());

        const { comment } = await createComment(
            bob._id.toString(),
            post._id,
            { content: "Muito bom" },
        );

        expect(recipientsOf("comment:created")).toEqual(
            [
                `socket-${alice._id.toString()}`,
                `socket-${bob._id.toString()}`,
            ].sort(),
        );

        const [event] = emitted.filter(
            (item) => item.event === "comment:created",
        );
        expect(event.payload).toMatchObject({
            postId: post._id,
            comment: { _id: comment._id, content: "Muito bom" },
            commentCount: 1,
        });

        const stored = await Comment.findById(comment._id).lean();
        expect(stored?.content).toBe("Muito bom");
    });

    it("emite comment:deleted apenas para usuários sem bloqueio", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");

        const post = await createPost(alice._id.toString(), {
            content: "Post comentável",
        });
        const { comment } = await createComment(
            bob._id.toString(),
            post._id,
            { content: "Comentário" },
        );

        await User.updateOne(
            { _id: bob._id },
            { $addToSet: { blockedUsers: carol._id } },
        );

        emitted = [];

        connect(alice._id.toString());
        connect(bob._id.toString());
        connect(carol._id.toString());

        await deleteComment(bob._id.toString(), post._id, comment._id);

        expect(recipientsOf("comment:deleted")).toEqual(
            [
                `socket-${alice._id.toString()}`,
                `socket-${bob._id.toString()}`,
            ].sort(),
        );

        const [event] = emitted.filter(
            (item) => item.event === "comment:deleted",
        );
        expect(event.payload).toEqual({
            postId: post._id,
            commentId: comment._id,
            commentCount: 0,
        });
    });
});
