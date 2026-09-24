import { describe, it, expect } from "vitest";
import {
    registerSchema,
    loginSchema,
    messagesQuerySchema,
    messageSearchQuerySchema,
    userSearchQuerySchema,
    deleteRoomParams,
    directRoomSchema,
    createGroupRoomSchema,
    patchVisibilitySchema,
    publicRoomsQuerySchema,
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

    it("aceita grupo público na criação", () => {
        const result = createGroupRoomSchema.safeParse({
            body: { name: "Estudos", visibility: "public" },
        });
        expect(result.success).toBe(true);
    });

    it("aplica visibilidade private por padrão na criação", () => {
        const result = createGroupRoomSchema.safeParse({
            body: { name: "Estudos" },
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.body.visibility).toBe("private");
        }
    });

    it("rejeita visibilidade inválida na criação", () => {
        const result = createGroupRoomSchema.safeParse({
            body: { name: "Estudos", visibility: "aberto" },
        });
        expect(result.success).toBe(false);
    });

    it("aceita troca de visibilidade válida", () => {
        const result = patchVisibilitySchema.safeParse({
            params: { id: "507f1f77bcf86cd799439011" },
            body: { visibility: "public" },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita troca de visibilidade inválida", () => {
        const result = patchVisibilitySchema.safeParse({
            params: { id: "507f1f77bcf86cd799439011" },
            body: { visibility: "aberto" },
        });
        expect(result.success).toBe(false);
    });

    it("aplica padrões na busca de grupos públicos", () => {
        const result = publicRoomsQuerySchema.safeParse({ query: {} });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.query.q).toBe("");
            expect(result.data.query.limit).toBe(20);
        }
    });

    it("rejeita limit acima do máximo na busca de grupos públicos", () => {
        const result = publicRoomsQuerySchema.safeParse({
            query: { q: "estudos", limit: 51 },
        });
        expect(result.success).toBe(false);
    });
});

describe("user search validations", () => {
    it("aceita busca com 3+ caracteres", () => {
        const result = userSearchQuerySchema.safeParse({
            query: { q: "ana" },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita busca curta que permitiria enumeração", () => {
        const result = userSearchQuerySchema.safeParse({
            query: { q: "a" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita termo acima de 50 caracteres", () => {
        const result = userSearchQuerySchema.safeParse({
            query: { q: "a".repeat(51) },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita busca por email com mensagem clara", () => {
        const result = userSearchQuerySchema.safeParse({
            query: { q: "ana@test.com" },
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                "Busca por email foi desativada",
            );
        }
    });

    it("aceita busca por #ID", () => {
        const result = userSearchQuerySchema.safeParse({
            query: { q: "#ABCD1234" },
        });
        expect(result.success).toBe(true);
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