import { test, expect } from "@playwright/test";

test.describe("Fluxo crítico: lista de pacientes", () => {
  test("nutricionista acessa /patients e vê lista (ou estado vazio)", async ({
    page,
  }) => {
    await page.goto("/patients");

    // Não pode ter redirecionado para login.
    await expect(page).not.toHaveURL(/\/app$/);

    // Aguarda render — título "Pacientes" ou empty state.
    await expect(
      page.getByRole("heading", { name: /pacientes/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
