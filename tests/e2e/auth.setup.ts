import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const STORAGE = path.resolve("tests/e2e/.auth/nutritionist.json");

setup("authenticate as nutritionist", async ({ page }) => {
  const email = process.env.E2E_NUTRITIONIST_EMAIL;
  const password = process.env.E2E_NUTRITIONIST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Defina E2E_NUTRITIONIST_EMAIL e E2E_NUTRITIONIST_PASSWORD em .env.test (ou nos secrets do CI).",
    );
  }

  fs.mkdirSync(path.dirname(STORAGE), { recursive: true });

  await page.goto("/app");

  // Email pode vir pré-preenchido — limpa antes.
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill(email);

  await page.locator('input[type="password"]').fill(password);

  await page.getByRole("button", { name: /entrar/i }).click();

  // Aguarda redirect pós-login (dashboard nutri / my-dashboard paciente / onboarding).
  await page.waitForURL(/\/(dashboard|my-dashboard|onboarding|patients)/, {
    timeout: 30_000,
  });

  // Sanity: não estamos mais na tela de login.
  await expect(page).not.toHaveURL(/\/app$/);

  await page.context().storageState({ path: STORAGE });
});
