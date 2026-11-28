import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import User from "../models/User";
import Session from "../models/Session";
import {
    loginUser,
    registerUser,
    verifyEmailToken,
} from "../services/auth";
import { hashSecretToken } from "../services/token";
import { utcDayKey } from "../services/messageQuota";
import { startTestDb, stopTestDb, clearTestDb } from "./db";

vi.mock("../services/email", () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendEmailChangeConfirmation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/emailQueue", () => ({
    enqueueEmail: vi.fn(),
    startEmailQueue: vi.fn(),
    stopEmailQueue: vi.fn(),
}));

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0";
let counter = 0;

async function registerFreshUser() {
    counter += 1;
    const email = `fluxo-${counter}@test.com`;
    const result = await registerUser(
        {
            name: "Fluxo",
            email,
            password: "password123",
            gender: "other",
            birthdate: "1995-05-20",
            country: "BR",
            city: "São Paulo",
            languages: ["pt"],
        },
        "127.0.0.1",
        USER_AGENT,
    );

    if (result.alreadyExists) {
        throw new Error("usuário deveria ter sido criado");
    }

    return { ...result, email };
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

describe("cadastro", () => {
    it("autentica automaticamente e devolve a cota inicial", async () => {
        const result = await registerFreshUser();

        expect(result.accessToken).toBeTruthy();
        expect(result.refreshToken).toBeTruthy();
        expect(result.user.verified).toBe(false);
        expect(result.user.messageQuota).toMatchObject({
            limit: 20,
            used: 0,
            remaining: 20,
        });

        const sessions = await Session.countDocuments({
            userId: result.user._id,
        });
        expect(sessions).toBe(1);
    });

    it("não cria sessão nova para email já cadastrado", async () => {
        const { email } = await registerFreshUser();
        const sessionsBefore = await Session.countDocuments({});

        const again = await registerUser(
            {
                name: "Fluxo",
                email,
                password: "password123",
                gender: "other",
                birthdate: "1995-05-20",
                country: "BR",
                city: "São Paulo",
                languages: ["pt"],
            },
            "127.0.0.1",
            USER_AGENT,
        );

        expect(again).toMatchObject({ alreadyExists: true });
        expect(await Session.countDocuments({})).toBe(sessionsBefore);
    });
});

describe("login", () => {
    it("permite login de usuário não verificado e informa a cota", async () => {
        const { email } = await registerFreshUser();

        const result = await loginUser(
            email,
            "password123",
            USER_AGENT,
            "127.0.0.1",
        );

        expect(result.accessToken).toBeTruthy();
        expect(result.user.verified).toBe(false);
        expect(result.user.messageQuota).toMatchObject({
            limit: 20,
            remaining: 20,
        });
    });

    it("devolve a cota consumida do dia", async () => {
        const { email, user } = await registerFreshUser();
        await User.updateOne(
            { _id: user._id },
            {
                messageQuotaDate: utcDayKey(),
                messageQuotaUsed: 7,
            },
        );

        const result = await loginUser(
            email,
            "password123",
            USER_AGENT,
            "127.0.0.1",
        );

        expect(result.user.messageQuota).toMatchObject({
            used: 7,
            remaining: 13,
        });
    });

    it("remove a cota após a verificação do email", async () => {
        const { email, user } = await registerFreshUser();

        const plainToken = "token-de-verificacao";
        await User.updateOne(
            { _id: user._id },
            {
                verificationToken: hashSecretToken(plainToken),
                verificationTokenExpiry: new Date(Date.now() + 60_000),
            },
        );

        await verifyEmailToken(plainToken);

        const stored = await User.findById(user._id).lean();
        expect(stored?.verified).toBe(true);
        expect(stored?.verificationToken).toBeNull();

        const result = await loginUser(
            email,
            "password123",
            USER_AGENT,
            "127.0.0.1",
        );
        expect(result.user.verified).toBe(true);
        expect(result.user.messageQuota).toBeNull();
    });
});
