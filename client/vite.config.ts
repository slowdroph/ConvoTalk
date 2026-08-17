import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
    plugins: [react(), tailwindcss()],
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
