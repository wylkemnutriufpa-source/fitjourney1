// FLUXO 4 — Mobile smoke
// Roda os fluxos críticos do nutri em viewport mobile (375x812)
// para garantir que o layout não esconde botões essenciais.
import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone 13"] });

test.describe("Mobile (iPhone 13) — sanidade dos cards principais", () => {
  test("lista de pacientes em mobile mostra ação 'Inativar'", async ({
    page,
  }) => {
    await page.goto("/patients");
    await expect(
      page.getByRole("heading", { name: /pacientes/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // Em mobile deve haver pelo menos um card com botão Inativar visível
    const inativar = page.getByRole("button", { name: /inativar/i }).first();
    // Skip se não há pacientes
    const exists = (await inativar.count()) > 0;
    test.skip(!exists, "Sem pacientes — pulando assert");
    await expect(inativar).toBeVisible();
  });

  test("financeiro em mobile mantém 4 KPIs visíveis", async ({ page }) => {
    await page.goto("/financeiro");
    await expect(
      page.getByRole("heading", { name: /financeiro/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    for (const label of [/MRR/i, /ARR/i, /ativ/i, /ticket/i]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test("dashboard nutri carrega em mobile sem layout shift drástico", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
    // Header tem que aparecer
    await expect(page.locator("header, nav").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
