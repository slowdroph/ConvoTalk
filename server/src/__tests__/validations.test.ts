import { describe, it, expect } from "vitest";
import {
    registerSchema,
    loginSchema,
    messagesQuerySchema,
    messageSearchQuerySchema,
    deleteRoomParams,
    directRoomSchema,
} from "../validations";

describe("auth validations", () => {
    it("aceita dados de registro válidos", () => {
        const result = registerSchema.safeParse({
            body: {
                name: "Ana",
                email: "ana@test.com",
                password: "12345678",
                acceptedTerms: true,
            },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita registro sem aceitar os termos", () => {
        const result = registerSchema.safeParse({
            body: {
                name: "Ana",
                email: "ana@test.com",
                password: "12345678",
                acceptedTerms: false,
            },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita senha curta no registro", () => {
        const result = registerSchema.safeParse({
            body: { name: "Ana", email: "ana@test.com", password: "123" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita email inválido no login", () => {
        const result = loginSchema.safeParse({
            body: { email: "nao-e-email", password: "123456" },
        });
        expect(result.success).toBe(false);
    });
});

describe("message validations", () => {
    const validRoomId = "507f1f77bcf86cd799439011";
    const validDate = "2024-01-01T00:00:00.000Z";

    it("aceita payload de busca válido", () => {
        const result = messageSearchQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { q: "olá", limit: 20 },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita roomId inválido", () => {
        const result = messagesQuerySchema.safeParse({
            params: { roomId: "abc" },
            query: { limit: 50 },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita before não-datetime", () => {
        const result = messagesQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { limit: 50, before: "ontem" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita limit acima do máximo", () => {
        const result = messageSearchQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { q: "olá", limit: 999 },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita limit acima do máximo", () => {
        const result = messagesQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { limit: 101 },
        });
        expect(result.success).toBe(false);
    });

    it("aceita cursor com beforeId para tie-break", () => {
        const result = messagesQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { limit: 50, before: validDate, beforeId: "507f1f77bcf86cd799439012" },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita beforeId inválido", () => {
        const result = messagesQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { limit: 50, before: validDate, beforeId: "xyz" },
        });
        expect(result.success).toBe(false);
    });
});

describe("room validations", () => {
    it("aceita directRoomSchema com userId válido", () => {
        const result = directRoomSchema.safeParse({
            body: { userId: "507f1f77bcf86cd799439011" },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita deleteRoomParams com id inválido", () => {
        const result = deleteRoomParams.safeParse({
            params: { id: "não-é-id" },
        });
        expect(result.success).toBe(false);
    });
});

describe("push validations", () => {
    it("aceita payload de inscrição válido", async () => {
        const { pushSubscribeSchema } = await import("../validations");
        const result = pushSubscribeSchema.safeParse({
            body: {
                endpoint: "https://fcm.googleapis.com/fcm/send/sample-token",
                keys: {
                    p256dh: "key-p256dh",
                    auth: "key-auth",
                },
                userAgent: "Mozilla/5.0",
            },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita inscrição com endpoint que não é URL", async () => {
        const { pushSubscribeSchema } = await import("../validations");
        const result = pushSubscribeSchema.safeParse({
            body: {
                endpoint: "invalid-url",
                keys: {
                    p256dh: "key-p256dh",
                    auth: "key-auth",
                },
            },
        });
        expect(result.success).toBe(false);
    });

    it("aceita payload de desinscrição válido", async () => {
        const { pushUnsubscribeSchema } = await import("../validations");
        const result = pushUnsubscribeSchema.safeParse({
            body: {
                endpoint: "https://fcm.googleapis.com/fcm/send/sample-token",
            },
        });
        expect(result.success).toBe(true);
    });
});