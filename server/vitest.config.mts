import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
    resolve: {
        alias: {
            "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        globals: true,
        env: {
            JWT_SECRET: "test-jwt-secret-with-at-least-32-chars-11111",
            REFRESH_TOKEN_SECRET:
                "test-refresh-secret-with-at-least-32-chars-22222",
            CLIENT_URL: "http://localhost:5173",
            NODE_ENV: "test",
        },
        setupFiles: ["src/__tests__/setup.ts"],
        include: ["src/__tests__/**/*.test.ts"],
    },
});
