import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import User from "../models/User";
import Room from "../models/Room";
import { discoverUsers, type DiscoverQueryInput } from "../services/discover";
import { addUserSocket, removeUserSocket } from "../socket/onlineUsers";
import { startTestDb, stopTestDb, clearTestDb } from "./db";

const DAY = 24 * 60 * 60 * 1000;

function baseQuery(
    overrides: Partial<DiscoverQueryInput> = {},
): DiscoverQueryInput {
    return {
        sort: "active",
        page: 1,
        limit: 12,
        ...overrides,
    };
}

let viewerId: string;
let aliceId: string;
let bobId: string;
let carolId: string;
let daveId: string;
let blockerId: string;
let blockedByViewerId: string;
let dmPartnerId: string;
const sockets: Array<{ userId: string; socketId: string }> = [];

async function createUser(
    data: Partial<{
        name: string;
        email: string;
        publicId: string;
        country: string;
        city: string;
        bio: string;
        interests: string[];
        languages: string[];
        lastSeen: Date | null;
        createdAt: Date;
    }>,
) {
    return User.create({
        name: data.name ?? "User",
        email: data.email ?? `${new mongoose.Types.ObjectId()}@test.com`,
        publicId: data.publicId ?? new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase(),
        password: "hashed-password",
        verified: true,
        country: data.country ?? "",
        city: data.city ?? "",
        bio: data.bio ?? "",
        interests: data.interests ?? [],
        languages: data.languages ?? [],
        lastSeen: data.lastSeen ?? null,
        createdAt: data.createdAt ?? new Date(Date.now() - 60 * DAY),
    });
}

function goOnline(userId: string): void {
    const socketId = `socket-${userId}-${sockets.length}`;
    addUserSocket(userId, socketId);
    sockets.push({ userId, socketId });
}

beforeAll(async () => {
    await startTestDb();
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();

    const now = Date.now();

    const viewer = await createUser({ name: "Viewer" });
    viewerId = viewer._id.toString();

    const alice = await createUser({
        name: "Alice Souza",
        publicId: "AAAA1111",
        country: "BR",
        city: "São Paulo",
        bio: "Frontend e café.",
        interests: ["programming", "ai"],
        languages: ["pt", "en"],
        lastSeen: new Date(now - 60 * 1000),
        createdAt: new Date(now - 10 * DAY),
    });
    aliceId = alice._id.toString();

    const bob = await createUser({
        name: "Bob Lima",
        publicId: "BBBB2222",
        country: "PT",
        city: "Lisboa",
        interests: ["music"],
        languages: ["pt"],
        lastSeen: new Date(now - 10 * DAY),
        createdAt: new Date(now - 20 * DAY),
    });
    bobId = bob._id.toString();

    const carol = await createUser({
        name: "Carol Dias",
        publicId: "CCCC3333",
        country: "BR",
        city: "São Paulo",
        interests: ["travel"],
        languages: ["pt", "es"],
        lastSeen: new Date(now - 2 * DAY),
        createdAt: new Date(now - 5 * DAY),
    });
    carolId = carol._id.toString();

    const dave = await createUser({
        name: "Dave Rocha",
        publicId: "DDDD4444",
        country: "BR",
        city: "Rio de Janeiro",
        interests: ["ai"],
        languages: ["en"],
        lastSeen: null,
        createdAt: new Date(now - DAY),
    });
    daveId = dave._id.toString();

    const blocker = await createUser({
        name: "Blocker",
        publicId: "EEEE5555",
        country: "BR",
        city: "São Paulo",
        languages: ["pt"],
        interests: ["programming"],
    });
    blockerId = blocker._id.toString();

    const blockedByViewer = await createUser({
        name: "Blocked",
        publicId: "FFFF6666",
        country: "BR",
        city: "São Paulo",
        languages: ["pt"],
        interests: ["programming"],
    });
    blockedByViewerId = blockedByViewer._id.toString();

    const dmPartner = await createUser({
        name: "DM Partner",
        publicId: "GGGG7777",
        country: "BR",
        city: "São Paulo",
        languages: ["pt"],
        interests: ["programming"],
    });
    dmPartnerId = dmPartner._id.toString();

    await User.updateOne(
        { _id: blockerId },
        { $addToSet: { blockedUsers: viewerId } },
    );
    await User.updateOne(
        { _id: viewerId },
        { $addToSet: { blockedUsers: blockedByViewerId } },
    );
    await Room.create({
        type: "direct",
        participants: [viewerId, dmPartnerId],
    });
});

afterEach(() => {
    for (const { userId, socketId } of sockets.splice(0)) {
        removeUserSocket(userId, socketId);
    }
});

function ids(result: { users: Array<{ _id: string }> }): string[] {
    return result.users.map((user) => user._id);
}

describe("discover users", () => {
    it("busca por nome sem diferenciar maiúsculas", async () => {
        const result = await discoverUsers(viewerId, baseQuery({ q: "alice" }));
        expect(ids(result)).toContain(aliceId);
        expect(ids(result)).not.toContain(bobId);
    });

    it("busca por prefixo do ID público", async () => {
        const result = await discoverUsers(viewerId, baseQuery({ q: "#BBBB" }));
        expect(ids(result)).toEqual([bobId]);
    });

    it("restringe a busca por #ID ao ID público", async () => {
        const result = await discoverUsers(viewerId, baseQuery({ q: "#alice" }));
        expect(result.users).toHaveLength(0);
    });

    it("filtra por país", async () => {
        const result = await discoverUsers(
            viewerId,
            baseQuery({ country: "PT" }),
        );
        expect(ids(result)).toContain(bobId);
        expect(ids(result)).not.toContain(aliceId);
    });

    it("filtra por cidade sem diferenciar maiúsculas", async () => {
        const result = await discoverUsers(
            viewerId,
            baseQuery({ country: "BR", city: "são paulo" }),
        );
        expect(ids(result).sort()).toEqual(
            [aliceId, carolId, dmPartnerId].sort(),
        );
    });

    it("exige todos os idiomas selecionados (AND)", async () => {
        const result = await discoverUsers(
            viewerId,
            baseQuery({ languages: ["pt", "en"] }),
        );
        expect(ids(result)).toEqual([aliceId]);
    });

    it("aceita qualquer um dos interesses selecionados (OR)", async () => {
        const result = await discoverUsers(
            viewerId,
            baseQuery({ interests: ["programming", "travel"] }),
        );
        expect(ids(result).sort()).toEqual(
            [aliceId, carolId, dmPartnerId].sort(),
        );
    });

    it("combina busca e filtros com AND", async () => {
        const result = await discoverUsers(
            viewerId,
            baseQuery({
                q: "alice",
                country: "BR",
                city: "São Paulo",
                languages: ["pt"],
                interests: ["ai"],
            }),
        );
        expect(ids(result)).toEqual([aliceId]);
    });

    it("filtra por atividade recente", async () => {
        const result = await discoverUsers(
            viewerId,
            baseQuery({ activeWithin: "24h" }),
        );
        expect(ids(result)).toContain(aliceId);
        expect(ids(result)).not.toContain(bobId);
        expect(ids(result)).not.toContain(daveId);
    });

    it("inclui usuário online mesmo com lastSeen antigo no filtro de atividade", async () => {
        goOnline(bobId);

        const result = await discoverUsers(
            viewerId,
            baseQuery({ activeWithin: "24h" }),
        );
        expect(ids(result)).toContain(bobId);
    });

    it("prioriza usuários online na ordenação por atividade", async () => {
        goOnline(bobId);

        const result = await discoverUsers(viewerId, baseQuery());
        expect(result.users[0]?._id).toBe(bobId);
    });

    it("ordena por cadastro recente", async () => {
        const result = await discoverUsers(
            viewerId,
            baseQuery({ sort: "recent" }),
        );
        expect(ids(result).slice(0, 4)).toEqual([
            daveId,
            carolId,
            aliceId,
            bobId,
        ]);
    });

    it("ordena por nome de A a Z", async () => {
        const result = await discoverUsers(
            viewerId,
            baseQuery({ sort: "name" }),
        );
        expect(ids(result).slice(0, 2)).toEqual([aliceId, bobId]);
    });

    it("pagina sem duplicar ou pular resultados", async () => {
        const first = await discoverUsers(
            viewerId,
            baseQuery({ sort: "name", limit: 2 }),
        );
        const second = await discoverUsers(
            viewerId,
            baseQuery({ sort: "name", limit: 2, page: 2 }),
        );

        expect(first.users).toHaveLength(2);
        expect(first.hasMore).toBe(true);
        expect(second.page).toBe(2);

        const allIds = [...ids(first), ...ids(second)];
        expect(new Set(allIds).size).toBe(allIds.length);
    });

    it("sugere usuários excluindo self, bloqueios e DMs existentes", async () => {
        const result = await discoverUsers(viewerId, baseQuery());

        expect(result.mode).toBe("suggested");
        expect(ids(result)).toContain(aliceId);
        expect(ids(result)).not.toContain(viewerId);
        expect(ids(result)).not.toContain(blockerId);
        expect(ids(result)).not.toContain(blockedByViewerId);
        expect(ids(result)).not.toContain(dmPartnerId);
    });

    it("não expõe campos sensíveis", async () => {
        const result = await discoverUsers(viewerId, baseQuery());
        const [user] = result.users;
        expect(user).toBeDefined();

        for (const field of [
            "email",
            "password",
            "birthdate",
            "gender",
            "lastIp",
            "verificationToken",
        ]) {
            expect(user).not.toHaveProperty(field);
        }
        expect(user).not.toHaveProperty("isOnline");
    });

    it("retorna lista vazia quando nada corresponde", async () => {
        const result = await discoverUsers(
            viewerId,
            baseQuery({ q: "zzzzzz" }),
        );
        expect(result.mode).toBe("results");
        expect(result.users).toEqual([]);
        expect(result.hasMore).toBe(false);
    });
});
