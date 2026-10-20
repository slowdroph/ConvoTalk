export interface AiConfig {
    enabled: boolean;
    apiKey: string | null;
    model: string;
    fallbackModels: string[];
    timeoutMs: number;
    maxContextMessages: number;
    summaryMaxTokens: number;
    suggestionsMaxTokens: number;
}

const DEFAULT_MODEL = "nvidia/nemotron-3.5-super-vl:free";
const DEFAULT_FALLBACK_MODELS = ["nvidia/nemotron-3-super-120b-a12b:free"];
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_CONTEXT_MESSAGES = 100;
const DEFAULT_SUMMARY_MAX_TOKENS = 1_800;
const DEFAULT_SUGGESTIONS_MAX_TOKENS = 1_500;

function positiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return parsed;
}

function parseModelList(value: string | undefined): string[] | null {
    if (value === undefined) return null;
    return value
        .split(",")
        .map((model) => model.trim())
        .filter(Boolean);
}

export function getAiConfig(): AiConfig {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim() || null;
    const explicitlyDisabled = process.env.AI_ENABLED === "false";
    const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;

    const configuredFallback = parseModelList(process.env.AI_FALLBACK_MODELS);
    const fallbackModels = [
        ...new Set(
            (configuredFallback ?? DEFAULT_FALLBACK_MODELS).filter(
                (fallback) => fallback !== model,
            ),
        ),
    ];

    return {
        enabled: !explicitlyDisabled && apiKey !== null,
        apiKey,
        model,
        fallbackModels,
        timeoutMs: positiveInt(process.env.AI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
        maxContextMessages: positiveInt(
            process.env.AI_MAX_CONTEXT_MESSAGES,
            DEFAULT_MAX_CONTEXT_MESSAGES,
        ),
        summaryMaxTokens: positiveInt(
            process.env.AI_SUMMARY_MAX_TOKENS,
            DEFAULT_SUMMARY_MAX_TOKENS,
        ),
        suggestionsMaxTokens: positiveInt(
            process.env.AI_SUGGESTIONS_MAX_TOKENS,
            DEFAULT_SUGGESTIONS_MAX_TOKENS,
        ),
    };
}

export function isAiEnabled(): boolean {
    return getAiConfig().enabled;
}
