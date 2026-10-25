export type AiActionId = "suggest" | "summarize";

export type AiActionResultSurface = "composer" | "panel";

export interface AiActionDefinition {
    id: AiActionId;
    label: string;
    description: string;
    surface: AiActionResultSurface;
    iconPath: string;
}

export const AI_ACTIONS: readonly AiActionDefinition[] = [
    {
        id: "suggest",
        label: "Sugerir respostas",
        description: "Três opções prontas para enviar",
        surface: "composer",
        iconPath:
            "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4H9z",
    },
    {
        id: "summarize",
        label: "Resumir conversa",
        description: "Resumo com os pontos principais",
        surface: "panel",
        iconPath:
            "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-5 4h5",
    },
];
