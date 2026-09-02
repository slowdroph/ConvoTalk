import { describe, it, expect } from "vitest";
import {
    parseMentionTokens,
    getUniqueMentionUserIds,
    type MentionParticipant,
} from "../../../shared/mentions";

const participants: MentionParticipant[] = [
    { _id: "1", name: "Alice" },
    { _id: "2", name: "Bob" },
    { _id: "3", name: "Ana Maria" },
    { _id: "4", name: "Carlos" },
];

describe("parseMentionTokens", () => {
    it("retorna array vazio quando não há @", () => {
        expect(parseMentionTokens("Olá mundo", participants)).toEqual([]);
    });

    it("retorna array vazio para conteúdo vazio", () => {
        expect(parseMentionTokens("", participants)).toEqual([]);
    });

    it("detecta uma menção simples", () => {
        const tokens = parseMentionTokens("Olá @Alice", participants);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].userId).toBe("1");
        expect(tokens[0].name).toBe("Alice");
        expect(tokens[0].start).toBe(4);
        expect(tokens[0].end).toBe(10);
    });

    it("detecta múltiplas menções de usuários diferentes", () => {
        const tokens = parseMentionTokens("@Alice e @Bob", participants);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].userId).toBe("1");
        expect(tokens[1].userId).toBe("2");
    });

    it("detecta menção com nome composto", () => {
        const tokens = parseMentionTokens("Olá @Ana Maria", participants);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].userId).toBe("3");
        expect(tokens[0].name).toBe("Ana Maria");
    });

    it("não detecta menção quando @ está após palavra", () => {
        const tokens = parseMentionTokens("foo@Alice", participants);
        expect(tokens).toHaveLength(0);
    });

    it("detecta menção no início da mensagem", () => {
        const tokens = parseMentionTokens("@Alice olá", participants);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].userId).toBe("1");
        expect(tokens[0].start).toBe(0);
    });

    it("detecta menção no final da mensagem", () => {
        const tokens = parseMentionTokens("Olá @Alice", participants);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].userId).toBe("1");
    });

    it("não detecta menção quando há caractere de palavra depois do nome", () => {
        const tokens = parseMentionTokens("@Alicex", participants);
        expect(tokens).toHaveLength(0);
    });

    it("detecta menção case-insensitive", () => {
        const tokens = parseMentionTokens("Olá @alice", participants);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].userId).toBe("1");
    });

    it("preserva menções duplicadas do mesmo usuário", () => {
        const tokens = parseMentionTokens("@Alice oi @Alice", participants);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].userId).toBe("1");
        expect(tokens[1].userId).toBe("1");
    });

    it("não detecta segunda menção quando @ está colado ao nome anterior", () => {
        const tokens = parseMentionTokens("@Alice@Bob", participants);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].userId).toBe("1");
    });

    it("ignora @ solto sem nome válido depois", () => {
        const tokens = parseMentionTokens("Olá @ mundo", participants);
        expect(tokens).toHaveLength(0);
    });

    it("prioriza nome mais longo (Ana Maria antes de Ana)", () => {
        const p: MentionParticipant[] = [
            { _id: "a", name: "Ana" },
            { _id: "b", name: "Ana Maria" },
        ];
        const tokens = parseMentionTokens("@Ana Maria", p);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].userId).toBe("b");
        expect(tokens[0].name).toBe("Ana Maria");
    });

    it("funciona com participantes vazio", () => {
        expect(parseMentionTokens("@Alice", [])).toEqual([]);
    });
});

describe("getUniqueMentionUserIds", () => {
    it("retorna IDs únicos", () => {
        const tokens = parseMentionTokens("@Alice oi @Alice", participants);
        const ids = getUniqueMentionUserIds(tokens);
        expect(ids).toEqual(["1"]);
    });

    it("retorna todos os IDs quando são diferentes", () => {
        const tokens = parseMentionTokens("@Alice @Bob", participants);
        const ids = getUniqueMentionUserIds(tokens);
        expect(ids).toEqual(["1", "2"]);
    });

    it("retorna array vazio para tokens vazios", () => {
        expect(getUniqueMentionUserIds([])).toEqual([]);
    });
});
