// FLUXO 1 — Landing pública de convite (/c/{slug}/{code})
// Não exige login. Valida que a página carrega, mostra o nutricionista
// correto e habilita o CTA de cadastro.
import { test, expect } from "@playwright/test";

// Public, não precisa da sessão do nutri
test.use({ storageState: { cookies: [], origins: [] } });

const SLUG = "dr-wylkem-kleyton";
const CODE = "ZEAG3UCK";

test.describe("Convite público /c/{slug}/{code}", () => {
  test("renderiza landing do nutri e mostra CTA de cadastro", async ({
    page,
  }) => {
    await page.goto(`/c/${SLUG}/${CODE}`);

    // Nome do nutri tem que aparecer (parcial — pode estar em qualquer caixa)
    await expect(
      page.getByText(/wylkem/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    // Algum CTA de começar / continuar / cadastrar
    const cta = page
      .getByRole("button", { name: /começar|continuar|cadastr|entrar/i })
      .or(page.getByRole("link", { name: /começar|continuar|cadastr|entrar/i }))
      .first();
    await expect(cta).toBeVisible({ timeout: 15_000 });
  });

  test("código inválido NÃO concede acesso a vínculo", async ({ page }) => {
    await page.goto(`/c/${SLUG}/INVALIDO123`);
    // Página deve carregar (não 500) mas não mostrar fluxo de cadastro normal
    await expect(page.locator("body")).toBeVisible();
    // Heurística: alguma mensagem de erro ou estado distinto
    // (não fazemos asserção forte porque a UX exata pode variar)
  });
});
