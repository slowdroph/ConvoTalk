import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = (): string => process.env.JWT_SECRET!;
const REFRESH_SECRET = (): string => process.env.REFRESH_TOKEN_SECRET!;

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_EXPIRES_IN = "7d";
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE_NAME = "refresh_token";

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId, tokenType: "access" }, ACCESS_SECRET(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId, tokenType: "refresh" }, REFRESH_SECRET(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, ACCESS_SECRET()) as {
    userId: string;
    tokenType?: string;
  };
  if (decoded.tokenType !== "access") {
    throw new Error("Tipo de token inválido");
  }
  return decoded;
}

export function verifyRefreshToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, REFRESH_SECRET()) as {
    userId: string;
    tokenType?: string;
  };
  if (decoded.tokenType !== "refresh") {
    throw new Error("Tipo de token inválido");
  }
  return decoded;
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hashSecretToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSecretToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const VERIFICATION_TOKEN_EXPIRES_MIN = 60 * 24;
export const RESET_TOKEN_EXPIRES_MIN = 60;

export function refreshCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
} {
  const isProd = process.env.NODE_ENV === "production";
  const cookieSecure =
    process.env.COOKIE_SECURE === "true" ||
    (isProd && process.env.COOKIE_SECURE !== "false");
  return {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  };
}