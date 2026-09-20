import { describe, it, expect } from "vitest";
import type { Request } from "express";
import { getHttpClientIp } from "../utils/clientIp";

function mockReq(
    headers: Record<string, string> = {},
    remoteAddress = "10.0.0.5",
    ip = "10.0.0.5",
): Request {
    const lower: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        lower[key.toLowerCase()] = value;
    }
    return {
        header: (name: string) => lower[name.toLowerCase()],
        socket: { remoteAddress },
        ip,
    } as unknown as Request;
}

describe("getHttpClientIp", () => {
    it("usa o primeiro IP do X-Forwarded-For atrás de proxy privado", () => {
        const req = mockReq(
            { "x-forwarded-for": "158.173.156.225, 152.233.13.166" },
            "10.0.0.5",
        );
        expect(getHttpClientIp(req)).toBe("158.173.156.225");
    });

    it("ignora X-Forwarded-For quando a conexão direta é pública", () => {
        const req = mockReq(
            { "x-forwarded-for": "1.2.3.4" },
            "203.0.113.10",
            "203.0.113.10",
        );
        expect(getHttpClientIp(req)).toBe("203.0.113.10");
    });

    it("normaliza IPv4 mapeado em IPv6", () => {
        const req = mockReq(
            { "x-forwarded-for": "::ffff:158.173.156.225" },
            "::ffff:10.0.0.5",
        );
        expect(getHttpClientIp(req)).toBe("158.173.156.225");
    });

    it("tolera mocks de teste sem header/socket", () => {
        const req = { ip: "127.0.0.1" } as unknown as Request;
        expect(getHttpClientIp(req)).toBe("127.0.0.1");
    });
});
