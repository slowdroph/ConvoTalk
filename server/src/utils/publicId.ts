import crypto from "crypto";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ID_LENGTH = 8;

export function generatePublicId(): string {
    const bytes = crypto.randomBytes(ID_LENGTH);
    let result = "";
    for (let i = 0; i < ID_LENGTH; i++) {
        result += CHARSET[bytes[i] % CHARSET.length];
    }
    return result;
}
