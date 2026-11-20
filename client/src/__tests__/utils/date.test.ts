import { describe, it, expect } from "vitest";
import {
    dateOfBirthError,
    datePartsFromIso,
    formatIsoDate,
    isValidIsoDate,
} from "../../utils/date";

describe("date helpers", () => {
    it("converte ISO em partes e em formato brasileiro", () => {
        expect(datePartsFromIso("1995-05-10")).toEqual({
            day: "10",
            month: "05",
            year: "1995",
        });
        expect(formatIsoDate("1995-05-10")).toBe("10/05/1995");
        expect(formatIsoDate("")).toBe("");
    });

    it("valida datas reais, incluindo bissexto", () => {
        expect(isValidIsoDate("1996-02-29")).toBe(true);
        expect(isValidIsoDate("1995-02-29")).toBe(false);
        expect(isValidIsoDate("2024-04-31")).toBe(false);
        expect(isValidIsoDate("1995-13-10")).toBe(false);
        expect(isValidIsoDate("1995-05-00")).toBe(false);
        expect(isValidIsoDate("10/05/1995")).toBe(false);
    });

    it("exige data no cadastro", () => {
        expect(dateOfBirthError("")).toBe("Informe sua data de nascimento.");
    });

    it("rejeita data inexistente", () => {
        expect(dateOfBirthError("1995-02-29")).toBe(
            "Data de nascimento inválida.",
        );
    });

    it("rejeita menor de idade", () => {
        const year = new Date().getUTCFullYear() - 10;
        expect(dateOfBirthError(`${year}-01-01`)).toBe(
            "É necessário ter pelo menos 18 anos.",
        );
    });

    it("rejeita idade acima do máximo", () => {
        const year = new Date().getUTCFullYear() - 121;
        expect(dateOfBirthError(`${year}-01-01`)).toBe(
            "Data de nascimento inválida.",
        );
    });

    it("aceita uma data válida dentro dos limites", () => {
        expect(dateOfBirthError("1995-05-10")).toBeNull();
    });
});
