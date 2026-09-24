import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { getHttpClientIp } from "../utils/clientIp";
import type { AuthRequest } from "./auth";

function skipHealth(req: { path: string }): boolean {
    return req.path === "/api/health" || req.path === "/api/health/live";
}

function keyGenerator(req: Request): string {
    return getHttpClientIp(req);
}

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipHealth,
    keyGenerator,
    message: { message: "Muitas requisições. Tente novamente mais tarde." },
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/refresh",
    keyGenerator,
    message: { message: "Muitas tentativas. Aguarde 15 minutos." },
});

export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: { message: "Muitas renovações de sessão. Aguarde um pouco." },
});

export const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: { message: "Muitas buscas. Aguarde um minuto." },
});

export function searchUserKeyGenerator(req: Request): string {
    const userId = (req as AuthRequest).user?._id;
    if (userId) return `user:${userId}`;
    return getHttpClientIp(req);
}

export const searchUserLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: searchUserKeyGenerator,
    message: { message: "Muitas buscas. Aguarde um minuto." },
});

export const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: {
        message: "Muitas tentativas de redefinição. Aguarde 15 minutos.",
    },
});

export const emailChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: {
        message: "Muitas solicitações de alteração de email. Aguarde 15 minutos.",
    },
});

export const previewLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: { message: "Muitos previews de link. Aguarde um minuto." },
});

export const pushLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: { message: "Muitas requisições de push. Aguarde um minuto." },
});
