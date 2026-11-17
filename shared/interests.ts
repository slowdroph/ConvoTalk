export const MAX_INTERESTS = 12;

export const INTEREST_OPTIONS = [
    { id: "programming", emoji: "💻", label: "Programação & Open Source" },
    { id: "coffee", emoji: "☕", label: "Café Especial" },
    { id: "music", emoji: "🎵", label: "Música Lo-Fi & Synthwave" },
    { id: "gaming", emoji: "🎮", label: "Games" },
    { id: "travel", emoji: "✈️", label: "Viagens Culturais" },
    { id: "books", emoji: "📚", label: "Ficção Científica" },
    { id: "design", emoji: "🎨", label: "UI/UX Design" },
    { id: "wine", emoji: "🍷", label: "Bom Vinho" },
    { id: "podcasts", emoji: "🎧", label: "Podcasts de Tecnologia" },
    { id: "photography", emoji: "📸", label: "Fotografia Analógica" },
    { id: "cinema", emoji: "🎬", label: "Cinema Neo-noir" },
    { id: "sports", emoji: "🏃", label: "Esportes & Corrida" },
    { id: "cooking", emoji: "🍳", label: "Culinária" },
    { id: "art", emoji: "🖌️", label: "Arte & Ilustração" },
    { id: "technology", emoji: "🚀", label: "Tecnologia & Inovação" },
    { id: "anime", emoji: "🍥", label: "Animes & Mangás" },
    { id: "nature", emoji: "🌿", label: "Natureza & Trilhas" },
    { id: "pets", emoji: "🐾", label: "Animais de Estimação" },
    { id: "business", emoji: "📈", label: "Empreendedorismo" },
    { id: "languages", emoji: "🗣️", label: "Idiomas" },
    { id: "boardgames", emoji: "🎲", label: "Board Games & RPG" },
    { id: "gardening", emoji: "🪴", label: "Plantas & Jardim" },
] as const;

export type InterestId = (typeof INTEREST_OPTIONS)[number]["id"];

const INTEREST_ID_SET = new Set<string>(
    INTEREST_OPTIONS.map((interest) => interest.id),
);

export function isInterestId(value: string): value is InterestId {
    return INTEREST_ID_SET.has(value);
}

export function getInterestOption(id: string) {
    return INTEREST_OPTIONS.find((interest) => interest.id === id);
}
