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
import { resetRateLimitsForTests } from "../socket/rateLimit";
import { generatePublicId } from "../utils/publicId";
import { setSocketIO } from "../config/io";
import { notifyUserVerified } from "../socket/userEvents";
import {
    UNVERIFIED_DAILY_MESSAGE_LIMIT,
    getMessageQuota,
} from "../services/messageQuota";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import type { MessageAck } from "../../../shared/types";

let httpServer: ReturnType<typeof createServer>;
let ioServer: SocketIOServer;
let port: number;
let counter = 0;

async function createUser(verified: boolean) {
    counter += 1;
    return User.create({
        name: `Quota Socket ${counter}`,
        email: `quota-socket-${counter}@test.com`,
        publicId: generatePublicId(),
        password: "password123",
        verified,
    });
}

function connectClient(userId: string): Promise<ClientSocket> {
    return new Promise((resolve) => {
        const token = signAccessToken(userId, "session-test");
        const client = ioc(`http://localhost:${port}`, {
            transports: ["websocket"],
            auth: { token },
        });
        client.on("connect", () => {
            // Os handlers do servidor são registrados após consultas assíncronas.
            setTimeout(() => resolve(client), 300);
        });
    });
}

function sendMessage(
    client: ClientSocket,
    roomId: string,
    content: string,
    clientMessageId?: string,
): Promise<MessageAck> {
    return new Promise((resolve) => {
        client.emit(
            "message",
            { roomId, content, attachments: [], clientMessageId },
            (res: MessageAck) => resolve(res ?? {}),
        );
    });
}

function waitFor(
    client: ClientSocket,
    event: string,
    timeoutMs = 3000,
): Promise<unknown> {
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
    setSocketIO(ioServer);
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
    setSocketIO(null as unknown as SocketIOServer);
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
    resetRateLimitsForTests();
    counter = 0;
});

describe("limite diário de mensagens via socket", { timeout: 30_000 }, () => {
    it("bloqueia a 21ª mensagem sem persistir e sem transmitir", async () => {
        const user = await createUser(false);
        const partner = await createUser(true);
        const room = await Room.create({
            type: "group",
            participants: [user._id, partner._id],
        });
        const roomId = room._id.toString();

        const sender = await connectClient(user._id.toString());
        const secondTab = await connectClient(user._id.toString());

        for (let i = 0; i < UNVERIFIED_DAILY_MESSAGE_LIMIT; i += 1) {
            const ack = await sendMessage(sender, roomId, `mensagem ${i}`);
            expect(ack.error).toBeUndefined();
        }

        const blocked = await sendMessage(secondTab, roomId, "mensagem 21");
        expect(blocked.code).toBe("MESSAGE_QUOTA_EXCEEDED");
        expect(blocked.quota?.remaining).toBe(0);

        const stored = await Message.countDocuments({
            room: room._id,
            sender: user._id,
        });
        expect(stored).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT);

        const state = await getMessageQuota(user._id.toString());
        expect(state.quota?.used).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT);
        expect(state.quota?.remaining).toBe(0);

        sender.close();
        secondTab.close();
    });

    it("compartilha a cota entre abas e conexões do mesmo usuário", async () => {
        const user = await createUser(false);
        const partner = await createUser(true);
        const room = await Room.create({
            type: "group",
            participants: [user._id, partner._id],
        });
        const roomId = room._id.toString();

        const first = await connectClient(user._id.toString());
        const second = await connectClient(user._id.toString());

        for (let i = 0; i < 10; i += 1) {
            expect((await sendMessage(first, roomId, `a ${i}`)).error).toBeUndefined();
        }
        for (let i = 0; i < 9; i += 1) {
            expect((await sendMessage(second, roomId, `b ${i}`)).error).toBeUndefined();
        }

        expect((await sendMessage(first, roomId, "a 10")).error).toBeUndefined();

        const blocked = await sendMessage(second, roomId, "b 9");
        expect(blocked.code).toBe("MESSAGE_QUOTA_EXCEEDED");

        const stored = await Message.countDocuments({
            room: room._id,
            sender: user._id,
        });
        expect(stored).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT);

        first.close();
        second.close();
    });

    it("não consome cota em reenvio duplicado", async () => {
        const user = await createUser(false);
        const partner = await createUser(true);
        const room = await Room.create({
            type: "group",
            participants: [user._id, partner._id],
        });
        const roomId = room._id.toString();

        const client = await connectClient(user._id.toString());
        const clientMessageId = "duplicada-1";

        const firstAck = await sendMessage(client, roomId, "oi", clientMessageId);
        expect(firstAck.error).toBeUndefined();

        const secondAck = await sendMessage(client, roomId, "oi", clientMessageId);
        expect(secondAck.error).toBeUndefined();

        const stored = await Message.countDocuments({
            room: room._id,
            sender: user._id,
        });
        expect(stored).toBe(1);

        const state = await getMessageQuota(user._id.toString());
        expect(state.quota?.used).toBe(1);
        expect(state.quota?.remaining).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT - 1);

        client.close();
    });

    it("emite user:verified e libera o envio após a confirmação", async () => {
        const user = await createUser(false);
        const partner = await createUser(true);
        const room = await Room.create({
            type: "group",
            participants: [user._id, partner._id],
        });
        const roomId = room._id.toString();

        const client = await connectClient(user._id.toString());
        const freshSocket = await connectClient(user._id.toString());

        for (let i = 0; i < UNVERIFIED_DAILY_MESSAGE_LIMIT; i += 1) {
            expect((await sendMessage(client, roomId, `mensagem ${i}`)).error).toBeUndefined();
        }

        const verifiedEvent = waitFor(client, "user:verified");
        await User.updateOne(
            { _id: user._id },
            { $set: { verified: true } },
        );
        await notifyUserVerified(user._id.toString());

        await expect(verifiedEvent).resolves.toEqual({ verified: true });

        const ack = await sendMessage(freshSocket, roomId, "liberada");
        expect(ack.error).toBeUndefined();

        const stored = await Message.countDocuments({
            room: room._id,
            sender: user._id,
        });
        expect(stored).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT + 1);

        const state = await getMessageQuota(user._id.toString());
        expect(state.verified).toBe(true);
        expect(state.quota).toBeNull();

        client.close();
        freshSocket.close();
    });
});
