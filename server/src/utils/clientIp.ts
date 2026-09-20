import type { Request } from "express";

function normalizeIp(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith("::ffff:")) {
        return trimmed.slice("::ffff:".length);
    }
    return trimmed.replace(/^\[|\]$/g, "");
}

function isTrustedDirectAddress(address: string): boolean {
    const clean = normalizeIp(String(address));
    return (
        clean === "::1" ||
        clean === "127.0.0.1" ||
        /^10\./.test(clean) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(clean) ||
        /^192\.168\./.test(clean)
    );
}

function firstForwardedIp(value: unknown): string | null {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string" || raw.trim() === "") return null;
    const first = raw.split(",")[0]?.trim();
    if (!first || first.toLowerCase() === "unknown") return null;
    return normalizeIp(first);
}

function readHeader(req: Request, name: string): string | undefined {
    try {
        if (typeof req.header === "function") {
            return req.header(name) ?? undefined;
        }
        const headers = (req as { headers?: Record<string, unknown> }).headers;
        const value = headers?.[name.toLowerCase()];
        if (typeof value === "string") return value;
        if (Array.isArray(value) && typeof value[0] === "string")
            return value[0];
        return undefined;
    } catch {
        return undefined;
    }
}

export function getHttpClientIp(req: Request): string {
    try {
        const direct = req.socket?.remoteAddress ?? "";
        const trustForwarded = !direct || isTrustedDirectAddress(direct);

        const cfIp = readHeader(req, "cf-connecting-ip")?.trim();
        if (cfIp) return normalizeIp(cfIp);

        const trueClientIp = readHeader(req, "true-client-ip")?.trim();
        if (trueClientIp) return normalizeIp(trueClientIp);

        if (trustForwarded) {
            const xff = firstForwardedIp(readHeader(req, "x-forwarded-for"));
            if (xff) return xff;

            const realIp = readHeader(req, "x-real-ip")?.trim();
            if (realIp) return normalizeIp(realIp);
        }

        if (typeof req.ip === "string" && req.ip) return normalizeIp(req.ip);
        if (direct) return normalizeIp(direct);
        return "unknown";
    } catch {
        try {
            if (typeof req.ip === "string" && req.ip) return req.ip;
        } catch {
            // ignore
        }
        return "unknown";
    }
}
