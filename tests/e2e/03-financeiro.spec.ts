// FLUXO 3 — Financeiro: KPIs (MRR/ARR/Ativos/Ticket) + listas
// Valida que a página financeira carrega com nomes (não IDs) e os
// 4 KPIs em grid 2x2.
import { test, expect } from "@playwright/test";

test.describe("Financeiro — KPIs e listagem", () => {
  test("/financeiro renderiza KPIs e seções", async ({ page }) => {
    await page.goto("/financeiro");

    await expect(
      page.getByRole("heading", { name: /financeiro/i }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // 4 KPIs principais visíveis (texto, não valor)
    for (const label of [/MRR/i, /ARR/i, /ativ/i, /ticket/i]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }

    // Não deve aparecer UUID puro (regex) na listagem — devemos ver nomes
    const bodyText = await page.locator("body").innerText();
    const uuidExposed = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(
      bodyText,
    );
    expect(uuidExposed, "UUID de paciente vazando na UI do financeiro").toBe(
      false,
    );

    // Bloco "Vencendo em 30d" e "Distribuição por plano"
    await expect(page.getByText(/vencendo em 30/i).first()).toBeVisible();
    await expect(page.getByText(/distribuição|por plano/i).first()).toBeVisible();
  });
});
