import { logger } from "./logger";

const REQUIRED_VARS = [
    "MONGO_URI",
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
    "CLIENT_URL",
] as const;

const OPTIONAL_VARS = [
    "PORT",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "RESEND_API_KEY",
] as const;

const MIN_SECRET_LENGTH = 32;

function isValidHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function isValidPort(value: string): boolean {
    if (!value) {
        return true;
    }
    const port = Number(value);
    return Number.isInteger(port) && port >= 1 && port <= 65535;
}

export function validateEnv(): void {
    const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Variáveis de ambiente obrigatórias ausentes: ${missing.join(
                ", ",
            )}. Verifique o arquivo .env.`,
        );
    }

    const clientUrl = process.env.CLIENT_URL!;
    if (!isValidHttpUrl(clientUrl)) {
        throw new Error(
            `CLIENT_URL inválida: "${clientUrl}". Deve ser uma URL http(s) válida.`,
        );
    }

    if (!isValidPort(process.env.PORT || "")) {
        throw new Error(
            `PORT inválido: "${process.env.PORT}". Deve ser um número entre 1 e 65535.`,
        );
    }

    const isProduction = process.env.NODE_ENV === "production";

    for (const key of ["JWT_SECRET", "REFRESH_TOKEN_SECRET"] as const) {
        const value = process.env[key]!;
        if (value.length < MIN_SECRET_LENGTH) {
            if (isProduction) {
                throw new Error(
                    `${key} deve ter pelo menos ${MIN_SECRET_LENGTH} caracteres em produção.`,
                );
            }
            logger.warn(
                { key, length: value.length },
                "Segredo de autenticação muito curto. Use pelo menos 32 caracteres.",
            );
        }
    }

    if (process.env.JWT_SECRET === process.env.REFRESH_TOKEN_SECRET) {
        if (isProduction) {
            throw new Error(
                "JWT_SECRET e REFRESH_TOKEN_SECRET devem ser diferentes em produção.",
            );
        }
        logger.warn(
            {},
            "JWT_SECRET e REFRESH_TOKEN_SECRET são iguais. Use valores distintos.",
        );
    }

    const missingOptional = OPTIONAL_VARS.filter((key) => !process.env[key]);
    if (missingOptional.length > 0) {
        logger.warn(
            { missingOptional },
            "Variáveis de ambiente opcionais ausentes. Recursos correspondentes ficarão indisponíveis.",
        );
    }
}

export function getAllowedOrigins(): string[] {
    const origins = new Set<string>();
    const clientUrl = process.env.CLIENT_URL;
    if (clientUrl) origins.add(clientUrl);

    const extra = process.env.CORS_ORIGINS;
    if (extra) {
        for (const origin of extra.split(",")) {
            const trimmed = origin.trim();
            if (trimmed && isValidHttpUrl(trimmed)) origins.add(trimmed);
        }
    }

    return [...origins];
}
