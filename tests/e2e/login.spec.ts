import { test, expect } from "@playwright/test";

test.describe("Login do nutricionista", () => {
  test("sessão persiste após auth.setup.ts e abre área autenticada", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Não deve redirecionar para /app (login).
    await expect(page).not.toHaveURL(/\/app$/, { timeout: 15_000 });
    // Heurística: alguma estrutura típica do shell autenticado.
    await expect(page.locator("body")).toBeVisible();
  });

  test("credenciais inválidas mostram erro", async ({ page, context }) => {
    // Limpa sessão para este teste específico.
    await context.clearCookies();
    await context.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* noop */
      }
    });

    await page.goto("/app");
    await page.locator('input[type="email"]').fill("nao-existe@example.com");
    await page.locator('input[type="password"]').fill("senha-errada-123");
    await page.getByRole("button", { name: /entrar/i }).click();

    // Aguarda mensagem de erro renderizar (texto variável — pega qualquer alerta/erro).
    await expect(
      page.getByText(/invalid|inválid|incorret|credenci/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
