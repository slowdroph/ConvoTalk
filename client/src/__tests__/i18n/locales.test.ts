import { describe, expect, it } from "vitest";
import { INTEREST_OPTIONS } from "@shared/interests";
import { NAMESPACES, resources } from "../../i18n";

const LANGUAGES = ["en", "es", "fr"] as const;

function flattenKeys(value: unknown, prefix = ""): string[] {
    if (Array.isArray(value)) {
        return value.flatMap((item, index) =>
            flattenKeys(item, prefix ? `${prefix}.${index}` : String(index)),
        );
    }
    if (value && typeof value === "object") {
        return Object.entries(value as Record<string, unknown>).flatMap(
            ([key, child]) =>
                flattenKeys(child, prefix ? `${prefix}.${key}` : key),
        );
    }
    return [prefix];
}

function flattenValues(value: unknown, prefix = ""): Record<string, string> {
    if (Array.isArray(value)) {
        return value.reduce<Record<string, string>>((acc, item, index) => {
            Object.assign(
                acc,
                flattenValues(item, prefix ? `${prefix}.${index}` : String(index)),
            );
            return acc;
        }, {});
    }
    if (value && typeof value === "object") {
        return Object.entries(value as Record<string, unknown>).reduce<
            Record<string, string>
        >((acc, [key, child]) => {
            Object.assign(
                acc,
                flattenValues(child, prefix ? `${prefix}.${key}` : key),
            );
            return acc;
        }, {});
    }
    return { [prefix]: String(value) };
}

function placeholders(value: string): string[] {
    return Array.from(value.matchAll(/\{\{\s*(\w+)\s*\}\}/g))
        .map((match) => match[1])
        .sort();
}

describe("catalog coverage", () => {
    it("translates every profile interest in all languages", () => {
        const ids = INTEREST_OPTIONS.map((option) => option.id).sort();

        for (const language of ["pt-BR", "en", "es", "fr"] as const) {
            expect(
                Object.keys(resources[language].profile.interests).sort(),
                language,
            ).toEqual(ids);
        }
    });
});

describe("translation catalogs", () => {
    for (const namespace of NAMESPACES) {
        it(`keeps key parity for namespace "${namespace}"`, () => {
            const base = flattenKeys(resources["pt-BR"][namespace]).sort();
            expect(base.length).toBeGreaterThan(0);

            for (const language of LANGUAGES) {
                const keys = flattenKeys(resources[language][namespace]).sort();
                expect(keys, `${language}/${namespace}`).toEqual(base);
            }
        });

        it(`keeps interpolation parity for namespace "${namespace}"`, () => {
            const base = flattenValues(resources["pt-BR"][namespace]);

            for (const language of LANGUAGES) {
                const values = flattenValues(resources[language][namespace]);
                for (const [key, value] of Object.entries(base)) {
                    expect(
                        placeholders(values[key] ?? ""),
                        `${language}/${namespace}:${key}`,
                    ).toEqual(placeholders(value));
                }
            }
        });

        it(`has no empty values in namespace "${namespace}"`, () => {
            for (const language of ["pt-BR", ...LANGUAGES] as const) {
                const values = flattenValues(resources[language][namespace]);
                for (const [key, value] of Object.entries(values)) {
                    expect(
                        value.trim().length,
                        `${language}/${namespace}:${key}`,
                    ).toBeGreaterThan(0);
                }
            }
        });
    }
});
