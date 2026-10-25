import type {
    AiReplySuggestion,
    AiSuggestRepliesPayload,
    AiSummaryPayload,
    AiTone,
} from "@shared/types";
import { AiError, createChatCompletion } from "./client";
import type { AiJsonSchema, ChatMessage } from "./client";
import { getAiConfig } from "./config";
import {
    buildConversationContext,
    buildMessageContext,
    type ConversationContext,
} from "./context";
import {
    buildTranscript,
    suggestionsJsonSchema,
    suggestionsMessages,
    summaryJsonSchema,
    summaryMessages,
} from "./prompts";
import { withCache } from "./cache";
import {
    AiBadOutputError,
    AiDisabledError,
    AiRateLimitedError,
    AiUnavailableError,
    ValidationError,
} from "../../utils/errors";

const MIN_MESSAGES = 2;
const TONES: readonly AiTone[] = ["short", "friendly", "formal"];

export interface SummarizeOptions {
    limit?: number;
    sinceMessageId?: string;
    regenerate?: boolean;
}

export interface SuggestRepliesOptions {
    messageId?: string;
    regenerate?: boolean;
}

function getEnabledConfig(): ReturnType<typeof getAiConfig> {
    const config = getAiConfig();
    if (!config.enabled) {
        throw new AiDisabledError();
    }
    return config;
}

function parseJson(content: string): unknown {
    const trimmed = content.trim();
    const withoutFence = trimmed
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
    try {
        return JSON.parse(withoutFence);
    } catch {
        return null;
    }
}

async function completeJson<T>(
    messages: ChatMessage[],
    schema: AiJsonSchema,
    maxTokens: number,
    validate: (value: unknown) => T | null,
    temperature = 0.3,
): Promise<{ data: T; model: string }> {
    let content: string;
    let model: string;
    try {
        const result = await createChatCompletion({
            messages,
            jsonSchema: schema,
            temperature,
            maxTokens,
        });
        content = result.content;
        model = result.model;
    } catch (error) {
        if (error instanceof AiError) {
            if (error.status === 429) {
                throw new AiRateLimitedError();
            }
            throw new AiUnavailableError();
        }
        throw error;
    }

    const data = validate(parseJson(content));
    if (data === null) {
        throw new AiBadOutputError();
    }
    return { data, model };
}

function isSummary(value: unknown): { summary: string; keyPoints: string[] } | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as { summary?: unknown; keyPoints?: unknown };
    if (typeof candidate.summary !== "string") return null;
    if (!Array.isArray(candidate.keyPoints)) return null;
    const keyPoints = candidate.keyPoints.filter(
        (point): point is string => typeof point === "string",
    );
    const summary = candidate.summary.trim();
    if (!summary) return null;
    return { summary, keyPoints };
}

function isSuggestions(value: unknown): { suggestions: AiReplySuggestion[] } | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as { suggestions?: unknown };
    if (!Array.isArray(candidate.suggestions)) return null;

    const suggestions: AiReplySuggestion[] = [];
    for (const item of candidate.suggestions) {
        if (!item || typeof item !== "object") continue;
        const suggestion = item as { tone?: unknown; text?: unknown };
        if (typeof suggestion.text !== "string") continue;
        const text = suggestion.text.trim();
        if (!text) continue;
        const tone = TONES.includes(suggestion.tone as AiTone)
            ? (suggestion.tone as AiTone)
            : "friendly";
        suggestions.push({ tone, text });
    }

    if (suggestions.length === 0) return null;
    return { suggestions };
}

export async function summarizeRoom(
    roomId: string,
    userId: string,
    options: SummarizeOptions = {},
): Promise<AiSummaryPayload> {
    const config = getEnabledConfig();

    const context = await buildConversationContext(roomId, userId, options);
    const cacheKey = `summary:${roomId}:${context.lastMessageId ?? "empty"}:${
        options.sinceMessageId ?? "all"
    }:${options.limit ?? "def"}`;

    return withCache(
        cacheKey,
        async () => {
            if (context.messages.length < MIN_MESSAGES) {
                throw new ValidationError(
                    "Não há mensagens suficientes para resumir.",
                );
            }

            const transcript = buildTranscript(context.messages);
            const { data, model } = await completeJson(
                summaryMessages(transcript),
                summaryJsonSchema,
                config.summaryMaxTokens,
                isSummary,
            );

            return {
                summary: data.summary,
                keyPoints: data.keyPoints,
                messageCount: context.messages.length,
                model,
                generatedAt: new Date().toISOString(),
            };
        },
        { bypass: options.regenerate === true },
    );
}

export async function suggestReplies(
    roomId: string,
    userId: string,
    options: SuggestRepliesOptions = {},
): Promise<AiSuggestRepliesPayload> {
    const config = getEnabledConfig();

    let context: ConversationContext;
    let cacheKey: string;
    if (options.messageId) {
        context = await buildMessageContext(roomId, userId, options.messageId);
        cacheKey = `suggest:${roomId}:${options.messageId}`;
    } else {
        context = await buildConversationContext(roomId, userId);
        cacheKey = `suggest:${roomId}:${context.lastMessageId ?? "empty"}`;
    }

    return withCache(
        cacheKey,
        async () => {
            if (context.messages.length < 1) {
                throw new ValidationError(
                    "Não há mensagens suficientes para sugerir respostas.",
                );
            }

            const transcript = buildTranscript(context.messages);
            const { data, model } = await completeJson(
                suggestionsMessages(transcript),
                suggestionsJsonSchema,
                config.suggestionsMaxTokens,
                isSuggestions,
                options.regenerate ? 0.8 : 0.3,
            );

            return {
                suggestions: data.suggestions,
                model,
                generatedAt: new Date().toISOString(),
            };
        },
        { bypass: options.regenerate === true },
    );
}
