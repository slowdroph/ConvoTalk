import { describe, it, expect } from "vitest";
import {
    INTEREST_CATEGORIES,
    INTEREST_OPTIONS,
    MAX_INTERESTS,
} from "@shared/interests";
import {
    LANGUAGE_OPTIONS,
    LANGUAGE_REGIONS,
    MAX_LANGUAGES,
} from "@shared/profile";

describe("catálogo de interesses", () => {
    it("tem IDs e labels únicos", () => {
        const ids = INTEREST_OPTIONS.map((option) => option.id);
        const labels = INTEREST_OPTIONS.map((option) => option.label);

        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(labels).size).toBe(labels.length);
    });

    it("usa apenas categorias válidas", () => {
        const categories = new Set<string>(INTEREST_CATEGORIES);

        for (const option of INTEREST_OPTIONS) {
            expect(categories.has(option.category)).toBe(true);
        }
    });

    it("preserva os IDs antigos", () => {
        const legacy = [
            "programming",
            "coffee",
            "music",
            "gaming",
            "travel",
            "books",
            "design",
            "wine",
            "podcasts",
            "photography",
            "cinema",
            "sports",
            "cooking",
            "art",
            "technology",
            "anime",
            "nature",
            "pets",
            "business",
            "languages",
            "boardgames",
            "gardening",
        ];
        const ids = new Set<string>(
            INTEREST_OPTIONS.map((option) => option.id),
        );

        for (const id of legacy) {
            expect(ids.has(id)).toBe(true);
        }
    });

    it("permite selecionar menos do que o catálogo oferece", () => {
        expect(MAX_INTERESTS).toBe(20);
        expect(MAX_INTERESTS).toBeLessThan(INTEREST_OPTIONS.length);
    });
});

describe("catálogo de idiomas", () => {
    it("tem IDs e labels únicos", () => {
        const ids = LANGUAGE_OPTIONS.map((option) => option.id);
        const labels = LANGUAGE_OPTIONS.map((option) => option.label);

        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(labels).size).toBe(labels.length);
    });

    it("usa apenas regiões válidas", () => {
        const regions = new Set<string>(LANGUAGE_REGIONS);

        for (const option of LANGUAGE_OPTIONS) {
            expect(regions.has(option.region)).toBe(true);
        }
    });

    it("preserva os IDs antigos", () => {
        const legacy = [
            "pt",
            "en",
            "es",
            "fr",
            "de",
            "it",
            "ja",
            "ko",
            "zh",
            "ru",
            "ar",
            "hi",
            "libras",
        ];
        const ids = new Set<string>(
            LANGUAGE_OPTIONS.map((option) => option.id),
        );

        for (const id of legacy) {
            expect(ids.has(id)).toBe(true);
        }
    });

    it("permite selecionar menos do que o catálogo oferece", () => {
        expect(MAX_LANGUAGES).toBe(10);
        expect(MAX_LANGUAGES).toBeLessThan(LANGUAGE_OPTIONS.length);
    });
});
