import { test, expect } from "@playwright/test";

async function login(page, email: string, password: string) {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Senha").fill(password);
    await page.locator("form").getByRole("button", { name: "Entrar" }).click();
}

test.describe("ConvoTalk E2E", () => {
    test("login e acesso à lista de conversas", async ({ page }) => {
        await login(page, "alice@e2e.com", "senha123");

        await expect(page).toHaveURL(/\/chat/, { timeout: 10_000 });
        await expect(
            page.getByRole("button", { name: /Sala E2E/i }),
        ).toBeVisible({ timeout: 10_000 });
    });

    test("abre uma conversa e vê mensagens persistidas", async ({ page }) => {
        await login(page, "alice@e2e.com", "senha123");

        await page
            .getByRole("button", { name: /Sala E2E/i })
            .click({ timeout: 10_000 });
        await expect(
            page.getByText("Mensagem de boas-vindas E2E"),
        ).toBeVisible({ timeout: 10_000 });
    });

    test("envia uma mensagem em tempo real", async ({ page, context }) => {
        await login(page, "alice@e2e.com", "senha123");
        await page
            .getByRole("button", { name: /Sala E2E/i })
            .click({ timeout: 10_000 });

        const messageInput = page.getByPlaceholder("Digite sua mensagem...");
        await expect(messageInput).toBeVisible({ timeout: 10_000 });

        const uniqueText = `mensagem-e2e-${Date.now()}`;
        await messageInput.fill(uniqueText);
        await page.getByRole("button", { name: "Enviar mensagem" }).click();

        await expect(
            page.getByText(uniqueText, { exact: true }).first(),
        ).toBeVisible({ timeout: 10_000 });

        await context.close();
    });

    test("login falha com credenciais inválidas", async ({ page }) => {
        await login(page, "alice@e2e.com", "senha-errada");
        await expect(
            page.getByText(/Credenciais inválidas/i),
        ).toBeVisible({ timeout: 10_000 });
        await expect(page).not.toHaveURL(/\/chat/);
    });
});
