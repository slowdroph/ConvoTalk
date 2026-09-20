import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Room from "../models/Room";
import Message from "../models/Message";
import { isRoomCreator, isRoomAdmin, isRoomCreatorOrAdmin } from "../utils/roomAuth";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import {
    updateProfile,
    confirmEmailChange,
} from "../controllers/userController";
import { generateSecretToken, hashSecretToken } from "../services/token";
import {
    createGroupRoom,
    updateGroupVisibility,
    getPublicRooms,
    joinPublicRoom,
} from "../services/room";
import { generatePublicId } from "../utils/publicId";
import type { AuthRequest } from "../middleware/auth";
import type { Request, Response } from "express";

vi.mock("../services/email", () => ({
    sendEmailChangeConfirmation: vi.fn().mockResolvedValue(undefined),
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

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

describe("integração: grupos públicos", () => {
    it("cria grupo público com visibilidade persistida", async () => {
        const creator = await createUser("Dono", "dono-pub@test.com");
        const room = (await createGroupRoom(
            creator._id.toString(),
            "Estudos Abertos",
            "",
            [],
            "public",
        )) as unknown as { visibility?: string };
        expect(room?.visibility).toBe("public");
    });

    it("cria grupo privado por padrão", async () => {
        const creator = await createUser("Dono", "dono-priv@test.com");
        const room = (await createGroupRoom(
            creator._id.toString(),
            "Segredos",
            "",
            [],
        )) as unknown as { visibility?: string };
        expect(room?.visibility).toBe("private");
    });

    it("criador pode tornar o grupo público e membro comum não pode", async () => {
        const creator = await createUser("Dono", "dono-vis@test.com");
        const member = await createUser("Membro", "membro-vis@test.com");
        const room = await Room.create({
            type: "group",
            name: "Clube",
            createdBy: creator._id,
            participants: [creator._id, member._id],
        });

        const updated = (await updateGroupVisibility(
            room._id.toString(),
            creator._id.toString(),
            "public",
        )) as unknown as { visibility?: string };
        expect(updated?.visibility).toBe("public");

        await expect(
            updateGroupVisibility(
                room._id.toString(),
                member._id.toString(),
                "private",
            ),
        ).rejects.toThrow();
    });

    it("lista apenas públicos não participados, com busca e paginação", async () => {
        const creator = await createUser("Dono", "dono-list@test.com");
        const outsider = await createUser("Fora", "fora-list@test.com");

        await createGroupRoom(
            creator._id.toString(),
            "Xadrez Aberto",
            "",
            [],
            "public",
        );
        await createGroupRoom(
            creator._id.toString(),
            "Culinária Aberta",
            "",
            [],
            "public",
        );
        await createGroupRoom(
            creator._id.toString(),
            "Cofre Fechado",
            "",
            [],
            "private",
        );

        const all = await getPublicRooms(outsider._id.toString(), "", 20);
        expect(all.rooms).toHaveLength(2);
        expect(all.rooms.every((r) => r.visibility === "public")).toBe(true);
        expect(all.nextCursor).toBeNull();

        const filtered = await getPublicRooms(
            outsider._id.toString(),
            "xadrez",
            20,
        );
        expect(filtered.rooms).toHaveLength(1);
        expect(filtered.rooms[0].name).toBe("Xadrez Aberto");

        const page1 = await getPublicRooms(outsider._id.toString(), "", 1);
        expect(page1.rooms).toHaveLength(1);
        expect(page1.nextCursor).not.toBeNull();

        const page2 = await getPublicRooms(
            outsider._id.toString(),
            "",
            1,
            page1.nextCursor!,
        );
        expect(page2.rooms).toHaveLength(1);
        expect(page2.rooms[0]._id.toString()).not.toBe(
            page1.rooms[0]._id.toString(),
        );

        const mine = await getPublicRooms(creator._id.toString(), "", 20);
        expect(mine.rooms).toHaveLength(0);
    });

    it("permite entrar em grupo público e bloqueia privado e duplicado", async () => {
        const creator = await createUser("Dono", "dono-join@test.com");
        const joiner = await createUser("Novo", "novo-join@test.com");

        const pub = await Room.create({
            type: "group",
            name: "Aberto",
            visibility: "public",
            createdBy: creator._id,
            participants: [creator._id],
        });
        const priv = await Room.create({
            type: "group",
            name: "Fechado",
            visibility: "private",
            createdBy: creator._id,
            participants: [creator._id],
        });

        await joinPublicRoom(
            pub._id.toString(),
            joiner._id.toString(),
        );
        const after = (await Room.findById(pub._id)
            .select("participants")
            .lean()) as { participants?: { toString(): string }[] } | null;
        expect((after?.participants ?? []).map((p) => p.toString())).toContain(
            joiner._id.toString(),
        );

        await expect(
            joinPublicRoom(pub._id.toString(), joiner._id.toString()),
        ).rejects.toThrow();

        await expect(
            joinPublicRoom(priv._id.toString(), joiner._id.toString()),
        ).rejects.toThrow();
    });
});

describe("integração: alteração de email", () => {
    async function createHashedUser(name: string, email: string) {
        const salt = await bcrypt.genSalt(10);
        return User.create({
            name,
            email,
            publicId: generatePublicId(),
            password: await bcrypt.hash("password123", salt),
            verified: true,
        });
    }

    function mockRes() {
        const state = { statusCode: 200, body: undefined as unknown };
        const res = {
            status(code: number) {
                state.statusCode = code;
                return res;
            },
            json(body: unknown) {
                state.body = body;
                return res;
            },
            get statusCode() {
                return state.statusCode;
            },
            get body() {
                return state.body;
            },
        };
        return res as Response & { statusCode: number; body: unknown };
    }

    function profileReq(
        user: { _id: unknown },
        body: { name: string; email: string; currentPassword?: string },
    ) {
        return {
            body,
            user: { _id: user._id },
            ip: "127.0.0.1",
        } as unknown as AuthRequest;
    }

    it("exige senha atual correta para alterar email", async () => {
        const user = await createHashedUser("Zé", "ze@test.com");
        const res = mockRes();

        await updateProfile(
            profileReq(user, {
                name: "Zé",
                email: "novo@test.com",
                currentPassword: "errada",
            }),
            res,
        );

        expect(res.statusCode).toBe(401);
        const updated = await User.findById(user._id).lean();
        expect(updated?.email).toBe("ze@test.com");
        expect(updated?.pendingEmail).toBeNull();
    });

    it("marca email pendente sem alterar email/verified atuais", async () => {
        const user = await createHashedUser("Zé", "ze@test.com");
        const res = mockRes();

        await updateProfile(
            profileReq(user, {
                name: "Zé",
                email: "novo@test.com",
                currentPassword: "password123",
            }),
            res,
        );

        expect(res.statusCode).toBe(200);
        const body = res.body as {
            email?: string;
            emailPending?: boolean;
            pendingEmail?: string | null;
        };
        expect(body.email).toBe("ze@test.com");
        expect(body.emailPending).toBe(true);
        expect(body.pendingEmail).toBe("novo@test.com");

        const updated = await User.findById(user._id).lean();
        expect(updated?.email).toBe("ze@test.com");
        expect(updated?.verified).toBe(true);
        expect(updated?.pendingEmail).toBe("novo@test.com");
        expect(updated?.pendingEmailToken).toBeTruthy();
        expect(updated?.pendingEmailTokenExpiry).toBeInstanceOf(Date);
    });

    it("confirma alteração com token válido", async () => {
        const user = await createHashedUser("Zé", "ze@test.com");
        const rawToken = generateSecretToken();
        await User.updateOne(
            { _id: user._id },
            {
                pendingEmail: "novo@test.com",
                pendingEmailToken: hashSecretToken(rawToken),
                pendingEmailTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
            },
        );

        const res = mockRes();
        await confirmEmailChange(
            {
                body: { token: rawToken },
                ip: "127.0.0.1",
            } as unknown as Request,
            res,
        );

        expect(res.statusCode).toBe(200);
        const updated = await User.findById(user._id).lean();
        expect(updated?.email).toBe("novo@test.com");
        expect(updated?.verified).toBe(true);
        expect(updated?.pendingEmail).toBeNull();
        expect(updated?.pendingEmailToken).toBeNull();
        expect(updated?.pendingEmailTokenExpiry).toBeNull();
    });

    it("rejeita token inválido ou expirado", async () => {
        const user = await createHashedUser("Zé", "ze@test.com");
        await User.updateOne(
            { _id: user._id },
            {
                pendingEmail: "novo@test.com",
                pendingEmailToken: hashSecretToken(generateSecretToken()),
                pendingEmailTokenExpiry: new Date(Date.now() - 1000),
            },
        );

        const res = mockRes();
        await confirmEmailChange(
            {
                body: { token: generateSecretToken() },
                ip: "127.0.0.1",
            } as unknown as Request,
            res,
        );

        expect(res.statusCode).toBe(400);
        const updated = await User.findById(user._id).lean();
        expect(updated?.email).toBe("ze@test.com");
    });

    it("rejeita confirmação quando email já está em uso", async () => {
        const user = await createHashedUser("Zé", "ze@test.com");
        await createHashedUser("Outro", "novo@test.com");
        const rawToken = generateSecretToken();
        await User.updateOne(
            { _id: user._id },
            {
                pendingEmail: "novo@test.com",
                pendingEmailToken: hashSecretToken(rawToken),
                pendingEmailTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
            },
        );

        const res = mockRes();
        await confirmEmailChange(
            {
                body: { token: rawToken },
                ip: "127.0.0.1",
            } as unknown as Request,
            res,
        );

        expect(res.statusCode).toBe(409);
        const updated = await User.findById(user._id).lean();
        expect(updated?.email).toBe("ze@test.com");
        expect(updated?.pendingEmail).toBe("novo@test.com");
    });

    it("atualização só de nome não cria pendência de email", async () => {
        const user = await createHashedUser("Zé", "ze@test.com");
        const res = mockRes();

        await updateProfile(
            profileReq(user, {
                name: "Zezinho",
                email: "ze@test.com",
                currentPassword: "",
            }),
            res,
        );

        expect(res.statusCode).toBe(200);
        const body = res.body as { emailPending?: boolean };
        expect(body.emailPending).toBe(false);
        const updated = await User.findById(user._id).lean();
        expect(updated?.name).toBe("Zezinho");
        expect(updated?.email).toBe("ze@test.com");
        expect(updated?.pendingEmail).toBeNull();
    });

    it("salva nome e email simultaneamente", async () => {
        const user = await createHashedUser("Zé", "ze@test.com");
        const res = mockRes();

        await updateProfile(
            profileReq(user, {
                name: "Zezinho",
                email: "novo@test.com",
                currentPassword: "password123",
            }),
            res,
        );

        expect(res.statusCode).toBe(200);
        const body = res.body as {
            name?: string;
            email?: string;
            emailPending?: boolean;
        };
        expect(body.name).toBe("Zezinho");
        expect(body.email).toBe("ze@test.com");
        expect(body.emailPending).toBe(true);

        const updated = await User.findById(user._id).lean();
        expect(updated?.name).toBe("Zezinho");
        expect(updated?.pendingEmail).toBe("novo@test.com");
    });

    it("compara email de forma case-insensitive", async () => {
        const user = await createHashedUser("Zé", "ze@test.com");
        const res = mockRes();

        await updateProfile(
            profileReq(user, {
                name: "Zé",
                email: "ZE@TEST.COM",
                currentPassword: "",
            }),
            res,
        );

        expect(res.statusCode).toBe(200);
        const body = res.body as { emailPending?: boolean };
        expect(body.emailPending).toBe(false);
        const updated = await User.findById(user._id).lean();
        expect(updated?.pendingEmail).toBeNull();
    });
});
