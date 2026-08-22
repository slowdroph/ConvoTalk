import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    testDir: "./e2e/specs",
    fullyParallel: false,
    workers: 1,
    timeout: 30_000,
    retries: process.env.CI ? 2 : 0,
    reporter: [["list"]],
    use: {
        baseURL: "http://localhost:5174",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: [
        {
            command: "npx tsx src/e2e/e2eServer.ts",
            cwd: path.resolve(__dirname, "../server"),
            url: "http://localhost:3100/api/health",
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
            env: {
                ...process.env,
                PORT: "3100",
                CLIENT_URL: "http://localhost:5174",
            },
        },
        {
            command: "npm run dev",
            cwd: path.resolve(__dirname, "."),
            url: "http://localhost:5174",
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
            env: {
                ...process.env,
                VITE_API_TARGET: "http://localhost:3100",
                VITE_PORT: "5174",
            },
        },
    ],
});
