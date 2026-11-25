import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const LEGAL_COPY = [
    "src/i18n/locales/en/legal.json",
    "src/i18n/locales/es/legal.json",
    "src/i18n/locales/fr/legal.json",
    "src/i18n/locales/pt-BR/legal.json",
];

/**
 * The legal pages must show when their text last changed, not when the page was
 * rendered. Read that from git; fall back to the last known revision date when
 * git is unavailable (Docker build, source tarball).
 */
function legalLastUpdated(): string {
    try {
        const value = execSync(
            `git log -1 --format=%cs -- ${LEGAL_COPY.join(" ")}`,
            {
                cwd: fileURLToPath(new URL(".", import.meta.url)),
                stdio: ["ignore", "pipe", "ignore"],
            },
        )
            .toString()
            .trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    } catch {
        // git unavailable: use the fallback below
    }
    return "2026-11-22";
}

export default defineConfig({
    plugins: [react(), tailwindcss()],
    define: {
        __LEGAL_LAST_UPDATED__: JSON.stringify(legalLastUpdated()),
    },
    resolve: {
        alias: {
            "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
        },
    },
    server: {
        port: Number(process.env.VITE_PORT || 5173),
        proxy: {
            "/api": {
                target: process.env.VITE_API_TARGET || "http://localhost:3001",
                changeOrigin: true,
            },
            "/socket.io": {
                target: process.env.VITE_API_TARGET || "http://localhost:3001",
                changeOrigin: true,
                ws: true,
            },
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["src/__tests__/setup.ts"],
        include: ["src/__tests__/**/*.test.{ts,tsx}"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "src/main.tsx",
                "src/**/*.test.{ts,tsx}",
                "src/**/__tests__/**",
            ],
            thresholds: {
                lines: 2.5,
                functions: 2.5,
                branches: 3.3,
                statements: 2.5,
            },
        },
    },
});
