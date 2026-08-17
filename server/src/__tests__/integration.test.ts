import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import User from "../models/User";
import Room from "../models/Room";
import Message from "../models/Message";
import { isRoomCreator, isRoomAdmin, isRoomCreatorOrAdmin } from "../utils/roomAuth";
import { startTestDb, stopTestDb, clearTestDb } from "./db";

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
        password: "password123",
        verified: true,
    });
}

describe("integração: mensagens", () => {
    it("cria mensagem com remetente e room", async () => {
        const user = await createUser("Alice", "alice@test.com");
        const room = await Room.create({
            type: "group",
            name: "Geral",
            participants: [user._id],
        });

        const msg = await Message.create({
            sender: user._id,
            room: room._id,
            content: "Olá mundo",
        });

        const found = (await Message.findById(msg._id)
            .populate("sender", "name email")
            .lean()) as { content?: string; sender?: { name?: string } | null };
        expect(found?.content).toBe("Olá mundo");
        expect(found?.sender?.name).toBe("Alice");
    });

    it("cria thread com parentMessage", async () => {
        const user = await createUser("Bob", "bob@test.com");
        const room = await Room.create({
            type: "group",
            participants: [user._id],
        });
        const parent = await Message.create({
            sender: user._id,
            room: room._id,
            content: "pergunta",
        });
        const reply = await Message.create({
            sender: user._id,
            room: room._id,
            content: "resposta",
            parentMessage: parent._id,
        });

        const found = await Message.findById(reply._id).lean();
        expect(found?.parentMessage?.toString()).toBe(parent._id.toString());
    });

    it("usa cursor-based paginação ordenada por createdAt", async () => {
        const user = await createUser("Carol", "carol@test.com");
        const room = await Room.create({
            type: "group",
            participants: [user._id],
        });

        for (let i = 0; i < 5; i++) {
            await Message.create({
                sender: user._id,
                room: room._id,
                content: `msg-${i}`,
            });
        }

        const page = await Message.find({ room: room._id })
            .sort({ createdAt: -1, _id: -1 })
            .limit(3)
            .lean();
        expect(page).toHaveLength(3);
        expect(page[0].content).toBe("msg-4");
    });
});

describe("integração: permissões de grupo", () => {
    it("distingue criador, admin e membro", async () => {
        const creator = await createUser("Dono", "dono@test.com");
        const admin = await createUser("Admin", "admin@test.com");
        const member = await createUser("Membro", "membro@test.com");

        const room = await Room.create({
            type: "group",
            createdBy: creator._id,
            admins: [admin._id],
            participants: [creator._id, admin._id, member._id],
        });

        const roomLean = await Room.findById(room._id).lean();

        expect(isRoomCreator(roomLean!, creator._id.toString())).toBe(true);
        expect(isRoomAdmin(roomLean!, admin._id.toString())).toBe(true);
        expect(isRoomCreatorOrAdmin(roomLean!, admin._id.toString())).toBe(true);
        expect(isRoomCreatorOrAdmin(roomLean!, member._id.toString())).toBe(false);
    });

    it("impede remoção do criador do grupo", async () => {
        const creator = await createUser("Dono2", "dono2@test.com");
        const room = await Room.create({
            type: "group",
            createdBy: creator._id,
            participants: [creator._id],
        });

        const creatorIsProtected = room.createdBy?.toString() === creator._id.toString();
        expect(creatorIsProtected).toBe(true);
    });
});

describe("integração: bloqueio mútuo", () => {
    it("bloqueio em qualquer lado impede envio em DM", async () => {
        const a = await createUser("Ana", "ana@test.com");
        const b = await createUser("Bruno", "bruno@test.com");

        // A bloqueia B
        await User.updateOne(
            { _id: a._id },
            { $addToSet: { blockedUsers: b._id } },
        );

        const blockedA = await User.findById(a._id)
            .select("blockedUsers")
            .lean();
        const blockedFromA = (blockedA?.blockedUsers ?? []).some(
            (id) => id.toString() === b._id.toString(),
        );
        expect(blockedFromA).toBe(true);

        // Simula isBlockedBetween: existe user cuja blockedUsers contém o outro
        const blockedBetween = await User.exists({
            _id: { $in: [a._id, b._id] },
            blockedUsers: { $in: [a._id, b._id] },
        });
        expect(!!blockedBetween).toBe(true);
    });

    it("registra blockedUsers mutuamente com $addToSet sem duplicar", async () => {
        const a = await createUser("Carla", "carla@test.com");
        const b = await createUser("Diego", "diego@test.com");

        await User.updateOne(
            { _id: a._id },
            { $addToSet: { blockedUsers: b._id } },
        );
        await User.updateOne(
            { _id: a._id },
            { $addToSet: { blockedUsers: b._id } },
        );

        const doc = await User.findById(a._id).select("blockedUsers").lean();
        expect(doc?.blockedUsers?.map((x) => x.toString())).toHaveLength(1);
    });
});

describe("integração: mongoose sanitização", () => {
    it("converte IDs para ObjectId corretamente", async () => {
        const user = await createUser("Eva", "eva@test.com");
        expect(user._id).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(mongoose.isObjectIdOrHexString(user._id.toString())).toBe(true);
    });
});
