import { describe, it, expect } from "vitest";
import { filterOptions, normalizeSearch } from "../../utils/options";

const options = [
    { id: "pt", label: "Português" },
    { id: "th", label: "Tailandês" },
    { id: "tl", label: "Filipino" },
];

describe("filterOptions", () => {
    it("retorna todas as opções com busca vazia", () => {
        expect(filterOptions(options, "  ")).toHaveLength(3);
    });

    it("filtra ignorando acentos e maiúsculas", () => {
        expect(filterOptions(options, "PORTUGUES")).toEqual([options[0]]);
        expect(filterOptions(options, "tailandes")).toEqual([options[1]]);
    });

    it("retorna vazio quando não encontra", () => {
        expect(filterOptions(options, "klingon")).toEqual([]);
    });

    it("normaliza o termo de busca", () => {
        expect(normalizeSearch("  Programação  ")).toBe("programacao");
    });
});
