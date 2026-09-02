import { describe, it, expect, afterEach } from "vitest";
import express from "express";
import type { Request, Response } from "express";
import type { AddressInfo } from "net";
import {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
} from "../services/token";
import auth, { AuthRequest } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import { notFoundHandler } from "../middleware/errorHandler";
import { validateEnv } from "../config/env";

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
    options: { method?: string; headers?: Record<string, string>; body?: unknown } = {},
): Promise<{ status: number; json: unknown }> {
    const { port, close } = await listen(app);
    try {
        const res = await fetch(`http://localhost:${port}${path}`, {
            method: options.method || "GET",
            headers: { "content-type": "application/json", ...options.headers },
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        });
        const json = await res.json().catch(() => null);
        return { status: res.status, json };
    } finally {
        close();
    }
}

describe("segurança: token type", () => {
    it("rejeita refresh token usado como access token", () => {
        const refresh = signRefreshToken("user-123", "session-456");
        expect(() => verifyAccessToken(refresh)).toThrow();
    });

    it("aceita access token como access token", () => {
        const access = signAccessToken("user-123", "session-456");
        expect(verifyAccessToken(access).userId).toBe("user-123");
    });
});

describe("segurança: middleware auth", () => {
    it("retorna 401 sem token", async () => {
        const app = express();
        app.get("/api/rooms", auth, (_req: AuthRequest, res: Response) => {
            res.json({ ok: true });
        });

        const result = await request(app, "/api/rooms");
        expect(result.status).toBe(401);
        const body = result.json as { error?: { code?: string } };
        expect(body.error?.code).toBe("UNAUTHORIZED");
    });

    it("retorna 401 com token inválido", async () => {
        const app = express();
        app.get("/api/rooms", auth, (_req: AuthRequest, res: Response) => {
            res.json({ ok: true });
        });

        const result = await request(app, "/api/rooms", {
            headers: { authorization: "Bearer token-invalido" },
        });
        expect(result.status).toBe(401);
    });

    it("permite acesso com token válido", async () => {
        const app = express();
        app.get("/api/rooms", auth, (req: AuthRequest, res: Response) => {
            res.json({ userId: req.user?._id });
        });

        const token = signAccessToken("user-123", "session-456");
        const result = await request(app, "/api/rooms", {
            headers: { authorization: `Bearer ${token}` },
        });
        expect(result.status).toBe(200);
        expect((result.json as { userId?: string }).userId).toBe("user-123");
    });
});

describe("segurança: rate limiting", () => {
    it("retorna 429 após exceder limite de tentativas de login", async () => {
        const app = express();
        app.use(authLimiter);
        app.post("/api/auth/login", (_req: Request, res: Response) => {
            res.json({ ok: true });
        });

        let lastStatus = 0;
        for (let i = 0; i < 16; i++) {
            lastStatus = (
                await request(app, "/api/auth/login", { method: "POST", body: {} })
            ).status;
        }
        expect(lastStatus).toBe(429);
    }, 30_000);
});

describe("segurança: 404 JSON para API", () => {
    it("retorna JSON estruturado para rota de API inexistente", async () => {
        const app = express();
        app.use("/api/health", (_req: Request, res: Response) => {
            res.json({ status: "ok" });
        });
        app.use(notFoundHandler);

        const result = await request(app, "/api/rota-inexistente");
        expect(result.status).toBe(404);
        expect(result.json).toEqual({
            success: false,
            error: { code: "NOT_FOUND", message: "Rota não encontrada." },
        });
    });

    it("retorna HTML para rotas não-API", async () => {
        const app = express();
        app.use(notFoundHandler);

        const { port, close } = await listen(app);
        try {
            const res = await fetch(`http://localhost:${port}/pagina`);
            expect(res.status).toBe(404);
            expect((res.headers.get("content-type") || "").includes("text/html")).toBe(true);
        } finally {
            close();
        }
    });
});

describe("segurança: validateEnv em produção", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it("lança erro se segredo for curto em produção", () => {
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = "curto";
        process.env.REFRESH_TOKEN_SECRET = "outro-segredo-longo-com-mais-de-32-caracteres";
        process.env.CLIENT_URL = "https://chat.example.com";
        process.env.MONGO_URI = "mongodb://localhost:27017/test";

        expect(() => validateEnv()).toThrow(/pelo menos 32 caracteres/);
    });

    it("lança erro se secrets forem iguais em produção", () => {
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = "a".repeat(40);
        process.env.REFRESH_TOKEN_SECRET = "a".repeat(40);
        process.env.CLIENT_URL = "https://chat.example.com";
        process.env.MONGO_URI = "mongodb://localhost:27017/test";

        expect(() => validateEnv()).toThrow(/devem ser diferentes/);
    });

    it("não lança erro em produção com secrets válidos", () => {
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = "j".repeat(40);
        process.env.REFRESH_TOKEN_SECRET = "r".repeat(40);
        process.env.CLIENT_URL = "https://chat.example.com";
        process.env.MONGO_URI = "mongodb://localhost:27017/test";

        expect(() => validateEnv()).not.toThrow();
    });
});