import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import express from "express";
import type { AddressInfo } from "net";
import User from "../models/User";
import userRoutes from "../routes/user";
import { errorHandler } from "../middleware/errorHandler";
import { signAccessToken } from "../services/token";
import { generatePublicId } from "../utils/publicId";
import { updatePreferences } from "../services/user";
import { getPushCopy } from "../i18n/push";
import { startTestDb, stopTestDb, clearTestDb } from "./db";

vi.mock("../services/email", () => ({
    sendEmailChangeConfirmation: vi.fn().mockResolvedValue(undefined),
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendAlreadyRegisteredEmail: vi.fn().mockResolvedValue(undefined),
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

function listen(app: express.Express): Promise<{ port: number; close: () => void }> {
    return new Promise((resolve) => {
        const server = app.listen(0, () => {
            const port = (server.address() as AddressInfo).port;
            resolve({ port, close: () => server.close() });
        });
    });
}

async function request(
    app: express.Express,
    path: string,
    options: {
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
    } = {},
): Promise<{ status: number; json: any }> {
    const { port, close } = await listen(app);
    try {
        const res = await fetch(`http://localhost:${port}${path}`, {
            method: options.method || "GET",
            headers: {
                "content-type": "application/json",
                ...options.headers,
            },
            body:
                options.body !== undefined
                    ? JSON.stringify(options.body)
                    : undefined,
        });
        const json = await res.json().catch(() => null);
        return { status: res.status, json };
    } finally {
        close();
    }
}

function createApp() {
    const app = express();
    app.use(express.json());
    app.use("/api/user", userRoutes);
    app.use(errorHandler);
    return app;
}

async function createUser(name: string, email: string) {
    return User.create({
        name,
        email,
        publicId: generatePublicId(),
        password: "password123",
        verified: true,
    });
}

describe("preferências de idioma", () => {
    it("usa en como idioma padrão de novos cadastros", async () => {
        const { registerUser } = await import("../services/auth");
        await registerUser({
            name: "Ana",
            email: "ana-default@test.com",
            password: "password123",
            gender: "woman",
            birthdate: "1995-05-10",
            country: "BR",
            city: "São Paulo",
            languages: ["pt"],
            languageLevels: { pt: "fluent" },
        });

        const user = await User.findOne({ email: "ana-default@test.com" }).lean();
        expect(user?.preferences?.language).toBe("en");
    });

    it("salva o idioma escolhido no cadastro", async () => {
        const { registerUser } = await import("../services/auth");
        await registerUser({
            name: "Bob",
            email: "bob-en@test.com",
            password: "password123",
            gender: "man",
            birthdate: "1990-01-01",
            country: "US",
            city: "New York",
            languages: ["en"],
            languageLevels: { en: "fluent" },
            language: "en",
        });

        const user = await User.findOne({ email: "bob-en@test.com" }).lean();
        expect(user?.preferences?.language).toBe("en");
    });

    it("atualiza apenas o idioma do usuário autenticado", async () => {
        const alice = await createUser("Alice", "alice@test.com");
        const bob = await createUser("Bob", "bob@test.com");
        const token = signAccessToken(String(alice._id), "session-test");

        const result = await request(createApp(), "/api/user/preferences", {
            method: "PUT",
            headers: { authorization: `Bearer ${token}` },
            body: { language: "es", userId: String(bob._id) },
        });

        expect(result.status).toBe(200);
        expect(result.json.preferences).toEqual({ language: "es" });

        const updatedAlice = await User.findById(alice._id).lean();
        const untouchedBob = await User.findById(bob._id).lean();
        expect(updatedAlice?.preferences?.language).toBe("es");
        expect(untouchedBob?.preferences?.language).toBeUndefined();
    });

    it("rejeita idiomas não suportados", async () => {
        const user = await createUser("Carla", "carla@test.com");
        const token = signAccessToken(String(user._id), "session-test");

        const result = await request(createApp(), "/api/user/preferences", {
            method: "PUT",
            headers: { authorization: `Bearer ${token}` },
            body: { language: "de" },
        });

        expect(result.status).toBe(400);
        expect(result.json.error.code).toBe("VALIDATION_ERROR");

        const unchanged = await User.findById(user._id).lean();
        expect(unchanged?.preferences?.language).toBeUndefined();
    });

    it("exige autenticação", async () => {
        const result = await request(createApp(), "/api/user/preferences", {
            method: "PUT",
            body: { language: "en" },
        });

        expect(result.status).toBe(401);
    });

    it("mantém usuários legados sem preferência funcionando", async () => {
        const legacy = await createUser("Legacy", "legacy@test.com");
        const token = signAccessToken(String(legacy._id), "session-test");

        const result = await request(createApp(), "/api/user/preferences", {
            method: "PUT",
            headers: { authorization: `Bearer ${token}` },
            body: { language: "fr" },
        });

        expect(result.status).toBe(200);
        expect(result.json.preferences.language).toBe("fr");
    });

    it("atualiza preferências pelo serviço", async () => {
        const user = await createUser("Dora", "dora@test.com");
        const preferences = await updatePreferences(
            String(user._id),
            "en",
        );
        expect(preferences).toEqual({ language: "en" });
    });
});

describe("notificações push localizadas", () => {
    it("traduz o texto de anexo por idioma", () => {
        expect(getPushCopy("pt-BR").attachment).toBe("Enviou um anexo");
        expect(getPushCopy("en").attachment).toBe("Sent an attachment");
        expect(getPushCopy("es").attachment).toBe("Envió un archivo adjunto");
        expect(getPushCopy("fr").attachment).toBe("A envoyé une pièce jointe");
    });

    it("traduz menções por idioma e mantém o nome do remetente", () => {
        expect(getPushCopy("pt-BR").mention("Ana")).toBe(
            "@Ana mencionou você",
        );
        expect(getPushCopy("en").mention("Ana")).toBe("@Ana mentioned you");
        expect(getPushCopy("es").mention("Ana")).toBe("@Ana te mencionó");
        expect(getPushCopy("fr").mention("Ana")).toBe(
            "@Ana vous a mentionné",
        );
    });

    it("usa en para idiomas desconhecidos ou ausentes", () => {
        expect(getPushCopy(undefined).attachment).toBe("Sent an attachment");
        expect(getPushCopy("de").attachment).toBe("Sent an attachment");
    });
});
