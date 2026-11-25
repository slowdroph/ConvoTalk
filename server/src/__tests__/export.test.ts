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

    it("pagina mensagens longas sem lan\u00e7ar erro", async () => {
        const longContent = Array.from(
            { length: 400 },
            (_, i) => `palavra${i}`,
        ).join(" ");
        const buffer = await generateConversationPdf({
            roomTitle: "Longa",
            participantsLabel: "2 participantes: Ana, Bruno",
            exportedAt: new Date("2024-01-01T12:00:00.000Z"),
            messages: [
                {
                    senderName: "Ana",
                    content: longContent,
                    createdAt: new Date("2024-01-01T12:00:01.000Z"),
                    deleted: false,
                },
            ],
        });
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
        const pageMarkers = buffer
            .toString("latin1")
            .match(/\/Type \/Page\b/g);
        expect(pageMarkers?.length ?? 0).toBeGreaterThan(1);
    });

    it("inclui anexos (imagem e arquivo) no PDF", async () => {
        const pngDataUri =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CY=";
        const buffer = await generateConversationPdf({
            roomTitle: "Anexos",
            participantsLabel: "1 participante: Ana",
            exportedAt: new Date("2024-01-01T12:00:00.000Z"),
            messages: [
                {
                    senderName: "Ana",
                    content: "Olha a imagem",
                    createdAt: new Date("2024-01-01T12:00:01.000Z"),
                    deleted: false,
                    attachments: [
                        {
                            url: pngDataUri,
                            filename: "foto.png",
                            mimetype: "image/png",
                            size: 70,
                        },
                        {
                            url: "https://example.com/doc.pdf",
                            filename: "doc.pdf",
                            mimetype: "application/pdf",
                            size: 1024,
                        },
                    ],
                },
            ],
        });
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    });
});