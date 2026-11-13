import { describe, it, expect } from "vitest";
import {
    assertSupportedImage,
    hasSupportedImageSignature,
} from "../middleware/postUpload";
import { BadRequestError } from "../utils/errors";

function asFile(buffer: Buffer): Express.Multer.File {
    return { buffer } as Express.Multer.File;
}

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const PNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
]);
const GIF = Buffer.from("GIF89a\x01\x00\x01\x00", "binary");
const WEBP = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x24, 0x00, 0x00, 0x00]),
    Buffer.from("WEBPVP8 ", "ascii"),
]);

describe("postUpload: assinatura de imagem", () => {
    it.each([
        ["JPEG", JPEG],
        ["PNG", PNG],
        ["GIF", GIF],
        ["WebP", WEBP],
    ])("aceita %s válido", (_label, buffer) => {
        expect(hasSupportedImageSignature(buffer)).toBe(true);
        expect(() => assertSupportedImage(asFile(buffer))).not.toThrow();
    });

    it("rejeita conteúdo de texto disfarçado de imagem", () => {
        const fake = Buffer.from("<script>alert(1)</script>", "utf8");
        expect(hasSupportedImageSignature(fake)).toBe(false);
    });

    it("rejeita RIFF que não seja WebP", () => {
        const wav = Buffer.concat([
            Buffer.from("RIFF", "ascii"),
            Buffer.from([0x24, 0x00, 0x00, 0x00]),
            Buffer.from("WAVEfmt ", "ascii"),
        ]);
        expect(hasSupportedImageSignature(wav)).toBe(false);
    });

    it("rejeita assinatura PNG truncada", () => {
        expect(hasSupportedImageSignature(PNG.subarray(0, 6))).toBe(false);
    });

    it("lança BadRequestError em arquivo inválido", () => {
        expect(() =>
            assertSupportedImage(asFile(Buffer.from("não é imagem"))),
        ).toThrow(BadRequestError);
    });
});
