import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import User from "../models/User";
import {
    UNVERIFIED_DAILY_MESSAGE_LIMIT,
    consumeMessageQuota,
    getMessageQuota,
    quotaSnapshot,
    refundMessageQuota,
    utcDayKey,
} from "../services/messageQuota";
import { generatePublicId } from "../utils/publicId";
import { startTestDb, stopTestDb, clearTestDb } from "./db";

let counter = 0;

async function createUser(verified = false) {
    counter += 1;
    return User.create({
        name: `Quota ${counter}`,
        email: `quota-${counter}@test.com`,
        publicId: generatePublicId(),
        password: "password123",
        verified,
    });
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

describe("quotaSnapshot", () => {
    it("zera o uso quando a data salva não é hoje", () => {
        const snapshot = quotaSnapshot({
            messageQuotaDate: "2000-01-01",
            messageQuotaUsed: 15,
        });

        expect(snapshot.used).toBe(0);
        expect(snapshot.remaining).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT);
    });

    it("respeita o uso do dia atual", () => {
        const snapshot = quotaSnapshot({
            messageQuotaDate: utcDayKey(),
            messageQuotaUsed: 5,
        });

        expect(snapshot.used).toBe(5);
        expect(snapshot.remaining).toBe(
            UNVERIFIED_DAILY_MESSAGE_LIMIT - 5,
        );
    });
});

describe("getMessageQuota", () => {
    it("retorna cota para usuário não verificado", async () => {
        const user = await createUser(false);
        const state = await getMessageQuota(user._id.toString());

        expect(state.verified).toBe(false);
        expect(state.quota?.limit).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT);
        expect(state.quota?.remaining).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT);
    });

    it("não retorna cota para usuário verificado", async () => {
        const user = await createUser(true);
        const state = await getMessageQuota(user._id.toString());

        expect(state.verified).toBe(true);
        expect(state.quota).toBeNull();
    });
});

describe("consumeMessageQuota", () => {
    it("permite apenas o limite diário", async () => {
        const user = await createUser(false);

        for (let i = 0; i < UNVERIFIED_DAILY_MESSAGE_LIMIT; i += 1) {
            const result = await consumeMessageQuota(user._id.toString());
            expect(result.allowed).toBe(true);
            expect(result.quota?.used).toBe(i + 1);
        }

        const blocked = await consumeMessageQuota(user._id.toString());
        expect(blocked.allowed).toBe(false);
        expect(blocked.quota?.remaining).toBe(0);

        const stored = await User.findById(user._id).lean();
        expect(stored?.messageQuotaUsed).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT);
    });

    it("nunca passa do limite com pedidos concorrentes", async () => {
        const user = await createUser(false);

        const results = await Promise.all(
            Array.from({ length: UNVERIFIED_DAILY_MESSAGE_LIMIT + 10 }, () =>
                consumeMessageQuota(user._id.toString()),
            ),
        );

        expect(results.filter((result) => result.allowed)).toHaveLength(
            UNVERIFIED_DAILY_MESSAGE_LIMIT,
        );

        const stored = await User.findById(user._id).lean();
        expect(stored?.messageQuotaUsed).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT);
    });

    it("reinicia a cota em um novo dia UTC", async () => {
        const user = await createUser(false);
        await User.updateOne(
            { _id: user._id },
            {
                messageQuotaDate: "2000-01-01",
                messageQuotaUsed: UNVERIFIED_DAILY_MESSAGE_LIMIT,
            },
        );

        const result = await consumeMessageQuota(user._id.toString());
        expect(result.allowed).toBe(true);
        expect(result.quota?.used).toBe(1);
    });

    it("não desconta cota de usuário verificado", async () => {
        const user = await createUser(true);

        const result = await consumeMessageQuota(user._id.toString());
        expect(result.allowed).toBe(true);
        expect(result.verified).toBe(true);
        expect(result.quota).toBeNull();

        const stored = await User.findById(user._id).lean();
        expect(stored?.messageQuotaUsed).toBe(0);
    });
});

describe("refundMessageQuota", () => {
    it("devolve uma mensagem reservada", async () => {
        const user = await createUser(false);
        await consumeMessageQuota(user._id.toString());
        await consumeMessageQuota(user._id.toString());

        const quota = await refundMessageQuota(user._id.toString());

        expect(quota?.used).toBe(1);
        expect(quota?.remaining).toBe(UNVERIFIED_DAILY_MESSAGE_LIMIT - 1);
    });

    it("não devolve cota de outro dia", async () => {
        const user = await createUser(false);
        await User.updateOne(
            { _id: user._id },
            { messageQuotaDate: "2000-01-01", messageQuotaUsed: 5 },
        );

        const quota = await refundMessageQuota(user._id.toString());

        const stored = await User.findById(user._id).lean();
        expect(stored?.messageQuotaUsed).toBe(5);
        expect(quota?.used).toBe(0);
    });

    it("não deixa a cota ficar negativa", async () => {
        const user = await createUser(false);

        await refundMessageQuota(user._id.toString());

        const stored = await User.findById(user._id).lean();
        expect(stored?.messageQuotaUsed).toBe(0);
    });
});
