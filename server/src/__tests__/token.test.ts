import { describe, it, expect } from "vitest";
import {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    hashRefreshToken,
} from "../services/token";

describe("token service", () => {
    it("gera e valida access token", () => {
        const token = signAccessToken("user-123", "session-456");
        expect(typeof token).toBe("string");
        expect(verifyAccessToken(token).userId).toBe("user-123");
        expect(verifyAccessToken(token).sessionId).toBe("session-456");
    });

    it("gera e valida refresh token", () => {
        const token = signRefreshToken("user-123", "session-456");
        expect(typeof token).toBe("string");
        expect(verifyRefreshToken(token).userId).toBe("user-123");
        expect(verifyRefreshToken(token).sessionId).toBe("session-456");
    });

    it("rejeita access token usado como refresh token", () => {
        const access = signAccessToken("user-123", "session-456");
        expect(() => verifyRefreshToken(access)).toThrow();
    });

    it("gera hash determinístico do refresh token", () => {
        const token = signRefreshToken("user-123", "session-456");
        expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
        expect(hashRefreshToken(token)).toMatch(/^[0-9a-f]{64}$/);
    });

    it("rejeita token com assinatura inválida", () => {
        const tampered = signAccessToken("user-123", "session-456") + "x";
        expect(() => verifyAccessToken(tampered)).toThrow();
    });
});