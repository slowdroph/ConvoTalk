import { describe, it, expect } from "vitest";
import { COUNTRIES, getCountryName } from "../../utils/countries";

describe("countries", () => {
    it("possui a lista de países preenchida", () => {
        expect(COUNTRIES.length).toBeGreaterThan(200);
    });

    it("não possui códigos duplicados", () => {
        const codes = COUNTRIES.map((c) => c.code);
        expect(new Set(codes).size).toBe(codes.length);
    });

    it("todos os códigos têm 2 letras maiúsculas", () => {
        for (const { code } of COUNTRIES) {
            expect(code).toMatch(/^[A-Z]{2}$/);
        }
    });

    it("todos os países possuem nome não vazio", () => {
        for (const { name } of COUNTRIES) {
            expect(name.trim().length).toBeGreaterThan(0);
        }
    });

    it("getCountryName retorna o nome do Brasil", () => {
        expect(getCountryName("BR")).toBe("Brasil");
    });

    it("getCountryName aceita código minúsculo", () => {
        expect(getCountryName("pt")).toBe("Portugal");
    });

    it("getCountryName retorna undefined para vazio ou desconhecido", () => {
        expect(getCountryName("")).toBeUndefined();
        expect(getCountryName(null)).toBeUndefined();
        expect(getCountryName(undefined)).toBeUndefined();
        expect(getCountryName("ZZ")).toBeUndefined();
    });
});
