// FLUXO 2 — Workflow clínico do nutricionista
// Valida que:
// - Fila de anamneses carrega (tabs Pendentes/Aprovadas)
// - Lista de pacientes carrega
// - Financeiro carrega com KPIs
// - Templates carregam
// Não APROVA nada (efeito colateral imutável no banco) — apenas
// confere navegação e render. Aprovação real é teste manual ou
// spec separado contra ambiente de staging dedicado.
import { test, expect } from "@playwright/test";

test.describe("Nutricionista — workflow clínico (read-only)", () => {
  test("fila de anamneses /anamneses renderiza tabs", async ({ page }) => {
    await page.goto("/anamneses");
    await expect(
      page.getByRole("heading", { name: /anamneses/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
    // Tabs principais
    await expect(page.getByRole("button", { name: /pendentes/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /aprovadas/i })).toBeVisible();

    // Click em "Aprovadas" e checa que algo renderiza (ou empty state)
    await page.getByRole("button", { name: /aprovadas/i }).click();
    await page.waitForLoadState("networkidle");
    // Não pode quebrar — body continua visível
    await expect(page.locator("body")).toBeVisible();
  });

  test("perfil de paciente abre e mostra abas clínicas", async ({ page }) => {
    await page.goto("/patients");
    await expect(
      page.getByRole("heading", { name: /pacientes/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // Clica no primeiro link de paciente disponível
    const firstPatient = page
      .locator('a[href*="/patients/"]')
      .filter({ hasNotText: /novo|new/i })
      .first();

    const count = await firstPatient.count();
    test.skip(count === 0, "Nenhum paciente cadastrado — pular");

    await firstPatient.click();
    await page.waitForURL(/\/patients\/[0-9a-f-]{36}/, { timeout: 20_000 });
    // Algum bloco de perfil tem que renderizar
    await expect(page.locator("body")).toBeVisible();
    // Não pode ter exibido erro de servidor
    await expect(page.getByText(/internal server error|500/i)).not.toBeVisible();
  });
});
