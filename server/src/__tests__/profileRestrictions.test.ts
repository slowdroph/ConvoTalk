import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import type { Response, NextFunction } from "express";
import User from "../models/User";
import { updateProfile } from "../services/user";
import requireVerified from "../middleware/requireVerified";
import { AppError } from "../utils/errors";
import { generatePublicId } from "../utils/publicId";
import type { AuthRequest } from "../middleware/auth";
import { startTestDb, stopTestDb, clearTestDb } from "./db";

vi.mock("../services/emailQueue", () => ({
    enqueueEmail: vi.fn(),
    startEmailQueue: vi.fn(),
    stopEmailQueue: vi.fn(),
}));

const PASSWORD = "password123";
let counter = 0;

async function createUser(verified: boolean) {
    counter += 1;
    return User.create({
        name: `Perfil ${counter}`,
        email: `perfil-${counter}@test.com`,
        publicId: generatePublicId(),
        password: await bcrypt.hash(PASSWORD, 4),
        verified,
    });
}

function fakeResponse() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
    } as unknown as Response;
}

beforeAll(async () => {
    await startTestDb();
});

afterAll(async () => {
    await stopTestDb();
});

beforeEach(async () => {
    await clearTestDb();
    counter = 0;
});

describe("updateProfile para usuário não verificado", () => {
    it("bloqueia a alteração de nome", async () => {
        const user = await createUser(false);

        await expect(
            updateProfile(user._id.toString(), {
                name: "Novo Nome",
                email: user.email,
            }),
        ).rejects.toMatchObject({
            code: "EMAIL_NOT_VERIFIED",
            statusCode: 403,
        });

        const stored = await User.findById(user._id).lean();
        expect(stored?.name).toBe(user.name);
    });

    it("permite manter o mesmo nome e email", async () => {
        const user = await createUser(false);

        const result = await updateProfile(user._id.toString(), {
            name: user.name,
            email: user.email,
        });

        expect(result.emailChanged).toBe(false);
        expect(result.verified).toBe(false);
        expect(result.messageQuota).toMatchObject({ remaining: 20 });
    });

    it("permite trocar o email e envia nova verificação", async () => {
        const user = await createUser(false);
        const newEmail = "novo-email@test.com";

        const result = await updateProfile(user._id.toString(), {
            name: user.name,
            email: newEmail,
            currentPassword: PASSWORD,
        });

        expect(result.emailChanged).toBe(true);
        expect("verificationSent" in result && result.verificationSent).toBe(
            true,
        );
        expect(result.newEmail).toBe(newEmail);

        const stored = await User.findById(user._id).lean();
        expect(stored?.email).toBe(newEmail);
        expect(stored?.verified).toBe(false);
        expect(stored?.pendingEmail).toBeNull();
        expect(stored?.verificationToken).toBeTruthy();
        expect(stored?.verificationTokenExpiry).toBeTruthy();
    });

    it("exige a senha atual para trocar o email", async () => {
        const user = await createUser(false);

        await expect(
            updateProfile(user._id.toString(), {
                name: user.name,
                email: "outro-email@test.com",
                currentPassword: "senha-errada",
            }),
        ).rejects.toMatchObject({ statusCode: 401 });

        const stored = await User.findById(user._id).lean();
        expect(stored?.email).toBe(user.email);
    });
});

describe("updateProfile para usuário verificado", () => {
    it("permite alterar o nome", async () => {
        const user = await createUser(true);

        const result = await updateProfile(user._id.toString(), {
            name: "Nome Atualizado",
            email: user.email,
        });

        expect(result.name).toBe("Nome Atualizado");
        expect(result.verified).toBe(true);
        expect(result.messageQuota).toBeNull();
    });
});

describe("middleware requireVerified", () => {
    it("bloqueia usuário não verificado com 403", async () => {
        const user = await createUser(false);
        const res = fakeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await requireVerified(
            { user: { _id: user._id.toString() } } as AuthRequest,
            res,
            next,
        );

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it("libera usuário verificado", async () => {
        const user = await createUser(true);
        const res = fakeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await requireVerified(
            { user: { _id: user._id.toString() } } as AuthRequest,
            res,
            next,
        );

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("rejeita sessão de usuário inexistente", async () => {
        const res = fakeResponse();
        const next = vi.fn() as unknown as NextFunction;

        await requireVerified(
            { user: { _id: "6b0a4cc0a99f70557306c7e7" } } as AuthRequest,
            res,
            next,
        );

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });
});

describe("AppError", () => {
    it("mantém o código EMAIL_NOT_VERIFIED mapeado", () => {
        const error = new AppError(403, "EMAIL_NOT_VERIFIED", "confirme");
        expect(error.code).toBe("EMAIL_NOT_VERIFIED");
    });
});
