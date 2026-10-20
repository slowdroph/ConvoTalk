import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    vi,
} from "vitest";
import mongoose from "mongoose";
import User from "../models/User";
import Room from "../models/Room";
import Message from "../models/Message";
import { startTestDb, stopTestDb, clearTestDb } from "./db";
import { generatePublicId } from "../utils/publicId";
import { summarizeRoom, suggestReplies } from "../services/ai/assistant";
import {
    AiBadOutputError,
    AiDisabledError,
    AiRateLimitedError,
    AiUnavailableError,
    ForbiddenError,
} from "../utils/errors";

beforeAll(async () => {
    await startTestDb();
}, 180_000);

afterAll(async () => {
    await stopTestDb();
}, 30_000);

beforeEach(async () => {
    await clearTestDb();
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
    process.env.AI_MODEL = "nvidia/nemotron-3.5-super-vl:free";
    delete process.env.AI_FALLBACK_MODELS;
    delete process.env.AI_SUMMARY_MAX_TOKENS;
    delete process.env.AI_SUGGESTIONS_MAX_TOKENS;
});

afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.AI_FALLBACK_MODELS;
    delete process.env.AI_SUMMARY_MAX_TOKENS;
    delete process.env.AI_SUGGESTIONS_MAX_TOKENS;
    vi.unstubAllGlobals();
});

function mockCompletion(payload: unknown, status = 200) {
    const fetchMock = vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: async () => ({
            model: "nvidia/nemotron-3.5-super-vl:free",
            choices: [
                { message: { content: JSON.stringify(payload) } },
            ],
            usage: {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30,
            },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

async function seedConversation() {
    const user = await User.create({
        name: "Alice",
        email: `alice-${new mongoose.Types.ObjectId()}@test.com`,
        publicId: generatePublicId(),
        password: "password123",
        verified: true,
    });
    const room = await Room.create({
        type: "group",
        name: "Geral",
        participants: [user._id],
    });
    await Message.create([
        { sender: user._id, room: room._id, content: "Oi, tudo bem?" },
        { sender: user._id, room: room._id, content: "Vamos marcar reunião amanhã." },
        { sender: user._id, room: room._id, content: "Pode ser às 10h." },
    ]);
    return { user, room };
}

describe("assistente de IA: resumo", () => {
    it("retorna resumo estruturado para um participante", async () => {
        const { user, room } = await seedConversation();
        const fetchMock = mockCompletion({
            summary: "A conversa combina uma reunião para amanhã.",
            keyPoints: ["Marcar reunião", "Sugerido às 10h"],
        });

        const result = await summarizeRoom(
            room._id.toString(),
            user._id.toString(),
        );

        expect(result.summary).toContain("reunião");
        expect(result.keyPoints).toHaveLength(2);
        expect(result.messageCount).toBe(3);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("reutiliza o cache para o mesmo contexto", async () => {
        const { user, room } = await seedConversation();
        const fetchMock = mockCompletion({
            summary: "Resumo",
            keyPoints: ["a"],
        });

        await summarizeRoom(room._id.toString(), user._id.toString());
        await summarizeRoom(room._id.toString(), user._id.toString());

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("bloqueia usuário que não participa da sala", async () => {
        const { room } = await seedConversation();
        mockCompletion({ summary: "x", keyPoints: [] });
        const outsider = new mongoose.Types.ObjectId().toString();

        await expect(
            summarizeRoom(room._id.toString(), outsider),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("falha quando o assistente está desativado", async () => {
        const { user, room } = await seedConversation();
        delete process.env.OPENROUTER_API_KEY;

        await expect(
            summarizeRoom(room._id.toString(), user._id.toString()),
        ).rejects.toBeInstanceOf(AiDisabledError);
    });

    it("falha com saída inválida do modelo", async () => {
        const { user, room } = await seedConversation();
        mockCompletion({ summary: 123, keyPoints: "não é lista" });

        await expect(
            summarizeRoom(room._id.toString(), user._id.toString()),
        ).rejects.toBeInstanceOf(AiBadOutputError);
    });

    it("mapeia erro do provedor para AI_UNAVAILABLE", async () => {
        const { user, room } = await seedConversation();
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 401,
                text: async () =>
                    JSON.stringify({
                        error: { message: "User not found.", code: 401 },
                    }),
            }),
        );

        await expect(
            summarizeRoom(room._id.toString(), user._id.toString()),
        ).rejects.toBeInstanceOf(AiUnavailableError);
    });

    it("envia modelos de fallback e usa a rota fallback", async () => {
        const { user, room } = await seedConversation();
        const fetchMock = mockCompletion({
            summary: "Resumo",
            keyPoints: ["a"],
        });

        await summarizeRoom(room._id.toString(), user._id.toString());

        const init = fetchMock.mock.calls[0][1] as { body: string };
        const body = JSON.parse(init.body) as {
            models?: string[];
            model?: string;
            route?: string;
        };

        expect(body.models).toEqual([
            "nvidia/nemotron-3.5-super-vl:free",
            "nvidia/nemotron-3-super-120b-a12b:free",
        ]);
        expect(body.route).toBe("fallback");
        expect(body.model).toBeUndefined();
    });

    it("permite desativar o fallback", async () => {
        process.env.AI_FALLBACK_MODELS = "";
        const { user, room } = await seedConversation();
        const fetchMock = mockCompletion({
            summary: "Resumo",
            keyPoints: ["a"],
        });

        await summarizeRoom(room._id.toString(), user._id.toString());

        const init = fetchMock.mock.calls[0][1] as { body: string };
        const body = JSON.parse(init.body) as {
            models?: string[];
            model?: string;
            route?: string;
        };

        expect(body.model).toBe("nvidia/nemotron-3.5-super-vl:free");
        expect(body.models).toBeUndefined();
        expect(body.route).toBeUndefined();
    });

    it("respeita o limite de tokens configurado", async () => {
        process.env.AI_SUMMARY_MAX_TOKENS = "2500";
        const { user, room } = await seedConversation();
        const fetchMock = mockCompletion({
            summary: "Resumo",
            keyPoints: ["a"],
        });

        await summarizeRoom(room._id.toString(), user._id.toString());

        const init = fetchMock.mock.calls[0][1] as { body: string };
        const body = JSON.parse(init.body) as { max_tokens?: number };
        expect(body.max_tokens).toBe(2500);
    });

    it("mapeia 429 do provedor para AI_RATE_LIMITED", async () => {
        const { user, room } = await seedConversation();
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 429,
                text: async () =>
                    JSON.stringify({
                        error: { message: "rate limited", code: 429 },
                    }),
            }),
        );

        await expect(
            summarizeRoom(room._id.toString(), user._id.toString()),
        ).rejects.toBeInstanceOf(AiRateLimitedError);
    }, 30_000);
});

describe("assistente de IA: sugestões", () => {
    it("retorna sugestões de resposta normalizadas", async () => {
        const { user, room } = await seedConversation();
        mockCompletion({
            suggestions: [
                { tone: "short", text: "Combinado!" },
                { tone: "formal", text: "Confirmo a reunião às 10h." },
                { tone: "desconhecido", text: "Fechado." },
            ],
        });

        const result = await suggestReplies(
            room._id.toString(),
            user._id.toString(),
        );

        expect(result.suggestions).toHaveLength(3);
        expect(result.suggestions[2].tone).toBe("friendly");
    });
});
