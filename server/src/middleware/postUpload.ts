import multer from "multer";
import { BadRequestError } from "../utils/errors";

const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

const UNSUPPORTED_MESSAGE =
    "Formato de imagem não suportado. Use JPEG, PNG, WebP ou GIF.";

const postUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new BadRequestError(UNSUPPORTED_MESSAGE));
        }
    },
});

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
    if (buffer.length < offset + bytes.length) return false;
    return bytes.every((byte, index) => buffer[offset + index] === byte);
}

function asciiAt(buffer: Buffer, offset: number, value: string): boolean {
    return startsWith(
        buffer,
        value.split("").map((char) => char.charCodeAt(0)),
        offset,
    );
}

export function hasSupportedImageSignature(buffer: Buffer): boolean {
    if (startsWith(buffer, [0xff, 0xd8, 0xff])) return true;
    if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        return true;
    }
    if (asciiAt(buffer, 0, "GIF8")) return true;
    return asciiAt(buffer, 0, "RIFF") && asciiAt(buffer, 8, "WEBP");
}

export function assertSupportedImage(file: Express.Multer.File): void {
    if (!hasSupportedImageSignature(file.buffer)) {
        throw new BadRequestError(UNSUPPORTED_MESSAGE);
    }
}

export default postUpload;
