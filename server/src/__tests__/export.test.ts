import { describe, it, expect } from "vitest";
import { generateConversationPdf } from "../services/export";

describe("export service (PDF)", () => {
    it("gera um buffer PDF válido", async () => {
        const buffer = await generateConversationPdf({
            roomTitle: "Equipe",
            participantsLabel: "2 participantes: Ana, Bruno",
            exportedAt: new Date("2024-01-01T12:00:00.000Z"),
            messages: [
                {
                    senderName: "Ana",
                    content: "Olá pessoal!",
                    createdAt: new Date("2024-01-01T12:00:01.000Z"),
                    deleted: false,
                },
                {
                    senderName: "Bruno",
                    content: "Oi Ana!",
                    createdAt: new Date("2024-01-01T12:00:10.000Z"),
                    deleted: false,
                },
                {
                    senderName: "Ana",
                    content: "",
                    createdAt: new Date("2024-01-01T12:00:20.000Z"),
                    deleted: true,
                },
            ],
        });

        expect(Buffer.isBuffer(buffer)).toBe(true);
        const header = buffer.subarray(0, 5).toString("latin1");
        expect(header).toBe("%PDF-");
    });

    it("gera PDF sem mensagens", async () => {
        const buffer = await generateConversationPdf({
            roomTitle: "Vazia",
            participantsLabel: "1 participante: Ana",
            exportedAt: new Date(),
            messages: [],
        });
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    });
});