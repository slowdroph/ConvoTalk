import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import User from "../models/User";
import Room from "../models/Room";
import Message from "../models/Message";
import socketHandler from "../socket/socketHandler";
import { socketAuth } from "../middleware/socketAuth";
import { signAccessToken } from "../services/token";
import { startTestDb, stopTestDb, clearTestDb } from "./db";

let httpServer: ReturnType<typeof createServer>;
let ioServer: SocketIOServer;
let port: number;

async function createUser(name: string, email: string) {
    return User.create({
        name,
        email,
        password: "password123",
        verified: true,
    });
}

function connectClient(userId: string): Promise<ClientSocket> {
    return new Promise((resolve) => {
        const token = signAccessToken(userId, "session-test");
        const client = ioc(`http://localhost:${port}`, {
            transports: ["websocket"],
            auth: { token },
        });
        client.on("connect", () => resolve(client));
    });
}

async function joinRoom(client: ClientSocket, roomId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 300));
    client.emit("join", roomId);
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
        const sockets = ioServer.sockets.adapter.rooms.get(roomId);
        if (sockets && client.id && sockets.has(client.id)) return;
        await new Promise((r) => setTimeout(r, 25));
    }
    throw new Error(`sala ${roomId} não ingressada`);
}

function waitFor(client: ClientSocket, event: string, timeoutMs = 3000): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`timeout aguardando ${event}`)),
            timeoutMs,
        );
        client.once(event, (payload) => {
            clearTimeout(timer);
            resolve(payload);
        });
    });
}

beforeAll(async () => {
    await startTestDb();
    httpServer = createServer();
    ioServer = new SocketIOServer(httpServer, {
        transports: ["websocket"],
    });
    ioServer.use(socketAuth);
    socketHandler(ioServer);
    await new Promise<void>((resolve) => {
        httpServer.listen(0, resolve);
    });
    port = (httpServer.address() as AddressInfo).port;
});

afterAll(async () => {
    ioServer.close();
    httpServer.close();
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

describe("socket handlers", () => {
    it("rejeita conexão sem token", async () => {
        await expect(
            new Promise<void>((resolve, reject) => {
                const client = ioc(`http://localhost:${port}`, {
                    transports: ["websocket"],
                });
                client.on("connect_error", () => {
                    client.close();
                    resolve();
                });
                setTimeout(() => reject(new Error("deveria rejeitar")), 2000);
            }),
        ).resolves.toBeUndefined();
    });

    it("persiste mensagem e a transmite para os participantes", async () => {
        const alice = await createUser("Alice", "alice-s@test.com");
        const bob = await createUser("Bob", "bob-s@test.com");
        const room = await Room.create({
            type: "group",
            name: "Testes",
            participants: [alice._id, bob._id],
        });

        const clientAlice = await connectClient(alice._id.toString());
        const clientBob = await connectClient(bob._id.toString());

        await joinRoom(clientAlice, room._id.toString());
        await joinRoom(clientBob, room._id.toString());

        const receivedPromise = waitFor(clientBob, "message");
        const ackPromise = new Promise<void>((resolve) => {
            clientAlice.emit(
                "message",
                { roomId: room._id.toString(), content: "Olá Bob!", attachments: [] },
                () => resolve(),
            );
        });

        await Promise.all([ackPromise]);
        const received = (await receivedPromise) as {
            content: string;
            room: string;
        };
        expect(received.content).toBe("Olá Bob!");
        expect(received.room).toBe(room._id.toString());

        const persisted = await Message.findOne({
            room: room._id,
            content: "Olá Bob!",
        }).lean();
        expect(persisted?.content).toBe("Olá Bob!");

        clientAlice.close();
        clientBob.close();
    });

    it("cria resposta com parentMessage persistido", async () => {
        const alice = await createUser("Alice2", "alice2-s@test.com");
        const bob = await createUser("Bob2", "bob2-s@test.com");
        const room = await Room.create({
            type: "group",
            participants: [alice._id, bob._id],
        });
        const parent = await Message.create({
            sender: alice._id,
            room: room._id,
            content: "mensagem original",
        });

        const clientAlice = await connectClient(alice._id.toString());
        const clientBob = await connectClient(bob._id.toString());
        await joinRoom(clientAlice, room._id.toString());
        await joinRoom(clientBob, room._id.toString());

        const receivedPromise = waitFor(clientBob, "thread_reply");
        await new Promise<void>((resolve) => {
            clientAlice.emit(
                "reply",
                {
                    roomId: room._id.toString(),
                    parentId: parent._id.toString(),
                    content: "resposta",
                    attachments: [],
                },
                () => resolve(),
            );
        });

        const received = (await receivedPromise) as {
            parentId?: string;
            message?: { parentMessage?: { _id: string } | string };
        };
        expect(received.parentId).toBe(parent._id.toString());
        const parentMessage = received.message?.parentMessage as
            | { _id: string }
            | string
            | undefined;
        const parentIdValue =
            typeof parentMessage === "string"
                ? parentMessage
                : parentMessage?._id;
        expect(parentIdValue).toBe(parent._id.toString());

        const persisted = await Message.findOne({
            room: room._id,
            parentMessage: parent._id,
        }).lean();
        expect(persisted?.parentMessage?.toString()).toBe(
            parent._id.toString(),
        );

        clientAlice.close();
        clientBob.close();
    });

    it("bloqueia envio em DM quando há bloqueio mútuo", async () => {
        const alice = await createUser("Alice3", "alice3-s@test.com");
        const bob = await createUser("Bob3", "bob3-s@test.com");
        const room = await Room.create({
            type: "direct",
            participants: [alice._id, bob._id],
        });
        await User.updateOne(
            { _id: alice._id },
            { $addToSet: { blockedUsers: bob._id } },
        );

        const clientAlice = await connectClient(alice._id.toString());
        await joinRoom(clientAlice, room._id.toString());

        const ackError = await new Promise<string | undefined>((resolve) => {
            clientAlice.emit(
                "message",
                {
                    roomId: room._id.toString(),
                    content: "não deveria enviar",
                    attachments: [],
                },
                (res: { error?: string }) => resolve(res?.error),
            );
        });
        expect(ackError).toBeTruthy();

        const persisted = await Message.countDocuments({
            room: room._id,
            content: "não deveria enviar",
        });
        expect(persisted).toBe(0);

        clientAlice.close();
    });
});
