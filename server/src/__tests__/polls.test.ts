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
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import { generatePublicId } from "../utils/publicId";
import {
    createPost,
    deletePost,
    getPost,
    setPollVote,
} from "../services/post";
import { addUserSocket, removeUserSocket } from "../socket/onlineUsers";
import { setSocketIO } from "../config/io";
import { createPostSchema, votePollSchema } from "../validations";
import {
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from "../utils/errors";

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

function firstOptionId(poll: {
    options: Array<{ _id: string; text: string; voteCount: number }>;
}): string {
    return poll.options[0]._id;
}

describe("posts: enquetes", () => {
    it("cria post com enquete zerada", async () => {
        const alice = await createUser("Alice", "alice@test.com");

        const post = await createPost(alice._id.toString(), {
            content: "Qual a melhor opção?",
            poll: { options: ["A", "B"] },
        });

        expect(post.poll).not.toBeNull();
        expect(post.poll?.options.map((option) => option.text)).toEqual([
            "A",
            "B",
        ]);
        expect(post.poll?.options.map((option) => option.voteCount)).toEqual([
            0, 0,
        ]);
        expect(post.poll?.totalVotes).toBe(0);
        expect(post.poll?.myVoteOptionId).toBeNull();
    });

    it("registra voto e devolve a contagem", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Qual a melhor opção?",
            poll: { options: ["A", "B"] },
        });
        const optionId = firstOptionId(post.poll!);

        const result = await setPollVote(
            bob._id.toString(),
            post._id,
            optionId,
        );

        expect(result.poll.totalVotes).toBe(1);
        expect(result.poll.myVoteOptionId).toBe(optionId);
        expect(result.poll.options[0].voteCount).toBe(1);

        const stored = await getPost(bob._id.toString(), post._id);
        expect(stored.poll?.myVoteOptionId).toBe(optionId);
        expect(stored.poll?.totalVotes).toBe(1);
    });

    it("troca o voto sem duplicar", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Qual a melhor opção?",
            poll: { options: ["A", "B"] },
        });
        const [first, second] = post.poll!.options;

        await setPollVote(bob._id.toString(), post._id, first._id);
        const result = await setPollVote(
            bob._id.toString(),
            post._id,
            second._id,
        );

        expect(result.poll.totalVotes).toBe(1);
        expect(result.poll.myVoteOptionId).toBe(second._id);
        expect(result.poll.options[0].voteCount).toBe(0);
        expect(result.poll.options[1].voteCount).toBe(1);
    });

    it("votar novamente na mesma opção é idempotente", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Qual a melhor opção?",
            poll: { options: ["A", "B"] },
        });
        const optionId = firstOptionId(post.poll!);

        await setPollVote(bob._id.toString(), post._id, optionId);
        const result = await setPollVote(
            bob._id.toString(),
            post._id,
            optionId,
        );

        expect(result.poll.totalVotes).toBe(1);
        expect(result.poll.options[0].voteCount).toBe(1);
    });

    it("remove o voto", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Qual a melhor opção?",
            poll: { options: ["A", "B"] },
        });
        const optionId = firstOptionId(post.poll!);

        await setPollVote(bob._id.toString(), post._id, optionId);
        const result = await setPollVote(bob._id.toString(), post._id, null);

        expect(result.poll.totalVotes).toBe(0);
        expect(result.poll.myVoteOptionId).toBeNull();
        expect(result.poll.options[0].voteCount).toBe(0);
    });

    it("rejeita opção inválida", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Qual a melhor opção?",
            poll: { options: ["A", "B"] },
        });

        await expect(
            setPollVote(
                alice._id.toString(),
                post._id,
                "64b7f0f0f0f0f0f0f0f0f0f0",
            ),
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejeita voto em post sem enquete", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Post comum",
        });

        await expect(
            setPollVote(
                alice._id.toString(),
                post._id,
                "64b7f0f0f0f0f0f0f0f0f0f0",
            ),
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("bloqueia voto entre usuários com bloqueio", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Qual a melhor opção?",
            poll: { options: ["A", "B"] },
        });
        const optionId = firstOptionId(post.poll!);

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: bob._id } },
        );

        await expect(
            setPollVote(bob._id.toString(), post._id, optionId),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("rejeita voto em post inexistente ou excluído", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Qual a melhor opção?",
            poll: { options: ["A", "B"] },
        });
        const optionId = firstOptionId(post.poll!);

        await deletePost(alice._id.toString(), post._id);

        await expect(
            setPollVote(alice._id.toString(), post._id, optionId),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("emite post:poll com as contagens respeitando bloqueios", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const carol = await createUser("Carol", "carol@test.com");
        const post = await createPost(alice._id.toString(), {
            content: "Qual a melhor opção?",
            poll: { options: ["A", "B"] },
        });
        const optionId = firstOptionId(post.poll!);

        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: carol._id } },
        );

        connect(alice._id.toString());
        connect(bob._id.toString());
        connect(carol._id.toString());
        emitted = [];

        await setPollVote(bob._id.toString(), post._id, optionId);

        expect(recipientsOf("post:poll")).toEqual(
            [
                `socket-${alice._id.toString()}`,
                `socket-${bob._id.toString()}`,
            ].sort(),
        );

        const [event] = emitted.filter((item) => item.event === "post:poll");
        expect(event.payload).toMatchObject({
            postId: post._id,
            userId: bob._id.toString(),
            optionId,
            totalVotes: 1,
        });
    });

    it("valida criação e voto de enquete", () => {
        const optionId = "64b7f0f0f0f0f0f0f0f0f0f0";
        const postId = "64b7f0f0f0f0f0f0f0f0f0f0";

        const valid = createPostSchema.safeParse({
            body: {
                content: "Qual a melhor opção?",
                poll: JSON.stringify({ options: ["A", "B"] }),
            },
        });
        expect(valid.success).toBe(true);
        if (valid.success) {
            expect(valid.data.body.poll).toEqual({ options: ["A", "B"] });
        }

        expect(
            createPostSchema.safeParse({
                body: { content: "Pergunta", poll: "não-é-json" },
            }).success,
        ).toBe(false);
        expect(
            createPostSchema.safeParse({
                body: {
                    content: "Pergunta",
                    poll: JSON.stringify({ options: ["A"] }),
                },
            }).success,
        ).toBe(false);
        expect(
            createPostSchema.safeParse({
                body: {
                    content: "Pergunta",
                    poll: JSON.stringify({ options: ["A", "a"] }),
                },
            }).success,
        ).toBe(false);

        expect(
            votePollSchema.safeParse({
                params: { id: postId },
                body: { optionId },
            }).success,
        ).toBe(true);
        expect(
            votePollSchema.safeParse({
                params: { id: postId },
                body: { optionId: "inválido" },
            }).success,
        ).toBe(false);
    });
});
