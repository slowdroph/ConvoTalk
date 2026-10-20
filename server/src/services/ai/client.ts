import { getAiConfig } from "./config";
import { logger } from "../../config/logger";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 600;
const MAX_UPSTREAM_MESSAGE_LENGTH = 200;

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface AiJsonSchema {
    name: string;
    schema: Record<string, unknown>;
}

export interface AiCompletionOptions {
    messages: ChatMessage[];
    jsonSchema?: AiJsonSchema;
    maxTokens?: number;
    temperature?: number;
}

export interface AiCompletionResult {
    content: string;
    model: string;
}

export class AiError extends Error {
    readonly status?: number;
    readonly retryable: boolean;
    readonly upstreamCode?: string | number;
    readonly upstreamMessage?: string;

    constructor(
        message: string,
        status?: number,
        retryable = false,
        upstreamCode?: string | number,
        upstreamMessage?: string,
    ) {
        super(message);
        this.name = "AiError";
        this.status = status;
        this.retryable = retryable;
        this.upstreamCode = upstreamCode;
        this.upstreamMessage = upstreamMessage;
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
    return [429, 500, 502, 503, 504].includes(status);
}

function normalizeError(error: unknown): AiError {
    if (error instanceof AiError) return error;
    if (error instanceof Error && error.name === "AbortError") {
        return new AiError(
            "Tempo limite excedido ao contatar o assistente de IA.",
            504,
            true,
        );
    }
    return new AiError("Falha de rede ao contatar o assistente de IA.", 502, true);
}

interface OpenRouterResponse {
    model?: string;
    choices?: {
        message?: { content?: string | null };
        finish_reason?: string | null;
    }[];
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    };
}

interface UpstreamErrorInfo {
    code?: string | number;
    message?: string;
    provider?: string;
}

function truncate(value: string): string {
    return value.length > MAX_UPSTREAM_MESSAGE_LENGTH
        ? `${value.slice(0, MAX_UPSTREAM_MESSAGE_LENGTH)}…`
        : value;
}

function parseUpstreamError(raw: string): UpstreamErrorInfo {
    try {
        const parsed = JSON.parse(raw) as {
            error?: {
                code?: string | number;
                message?: string;
                metadata?: { provider_name?: string };
            };
        };
        return {
            code: parsed.error?.code,
            message: parsed.error?.message
                ? truncate(parsed.error.message)
                : undefined,
            provider: parsed.error?.metadata?.provider_name,
        };
    } catch {
        return raw.trim() ? { message: truncate(raw.trim()) } : {};
    }
}

function buildRequestBody(
    config: ReturnType<typeof getAiConfig>,
    options: AiCompletionOptions,
): Record<string, unknown> {
    const body: Record<string, unknown> = { messages: options.messages };

    if (config.fallbackModels.length > 0) {
        body.models = [config.model, ...config.fallbackModels];
        body.route = "fallback";
    } else {
        body.model = config.model;
    }

    if (options.maxTokens) body.max_tokens = options.maxTokens;
    if (options.temperature !== undefined) {
        body.temperature = options.temperature;
    }
    if (options.jsonSchema) {
        body.response_format = {
            type: "json_schema",
            json_schema: {
                name: options.jsonSchema.name,
                strict: true,
                schema: options.jsonSchema.schema,
            },
        };
    }

    return body;
}

export async function createChatCompletion(
    options: AiCompletionOptions,
): Promise<AiCompletionResult> {
    const config = getAiConfig();
    if (!config.apiKey) {
        throw new AiError("Assistente de IA não configurado.", 503, false);
    }

    const body = buildRequestBody(config, options);

    let lastError: AiError = new AiError(
        "Falha ao contatar o assistente de IA.",
        502,
        true,
    );

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

        try {
            const startedAt = Date.now();
            const res = await fetch(OPENROUTER_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer":
                        process.env.CLIENT_URL || "http://localhost:5173",
                    "X-Title": "ConvoTalk",
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            if (!res.ok) {
                const raw = await res.text().catch(() => "");
                const upstream = parseUpstreamError(raw);
                throw new AiError(
                    `OpenRouter respondeu com status ${res.status}.`,
                    res.status,
                    isRetryableStatus(res.status),
                    upstream.code,
                    upstream.message,
                );
            }

            const json = (await res.json()) as OpenRouterResponse;
            const choice = json.choices?.[0];
            const content = choice?.message?.content;
            if (typeof content !== "string" || !content.trim()) {
                throw new AiError(
                    `Resposta vazia do modelo (finish_reason: ${
                        choice?.finish_reason ?? "desconhecido"
                    }).`,
                    502,
                    true,
                );
            }

            logger.info(
                {
                    model: json.model ?? config.model,
                    attempt,
                    usage: json.usage ?? null,
                    durationMs: Date.now() - startedAt,
                },
                "ai_completion",
            );

            return { content, model: json.model ?? config.model };
        } catch (error) {
            lastError = normalizeError(error);
            logger.warn(
                {
                    model: config.model,
                    fallbackModels: config.fallbackModels,
                    attempt,
                    status: lastError.status ?? null,
                    retryable: lastError.retryable,
                    upstreamCode: lastError.upstreamCode ?? null,
                    upstreamMessage: lastError.upstreamMessage ?? null,
                },
                "ai_completion_failed",
            );

            if (lastError.retryable && attempt < MAX_RETRIES) {
                await delay(BASE_BACKOFF_MS * 2 ** attempt);
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeout);
        }
    }

    throw lastError;
}
