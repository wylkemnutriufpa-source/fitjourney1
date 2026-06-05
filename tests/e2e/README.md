# Testes E2E (Playwright)

## Setup local

1. `cp .env.test.example .env.test`
2. Preencha `E2E_NUTRITIONIST_EMAIL` / `E2E_NUTRITIONIST_PASSWORD` com uma
   conta de teste real (não use credenciais de produção compartilhadas).
3. `bunx playwright install chromium` (1ª vez)
4. `bun run test:e2e` — roda headless contra `bun run dev` (porta 5173).
5. `bun run test:e2e:ui` — abre o Playwright UI mode.

## Estrutura

- `auth.setup.ts` — faz login uma vez e salva storageState em
  `tests/e2e/.auth/nutritionist.json` (gitignored). Todos os specs reutilizam.
- `login.spec.ts` — valida persistência da sessão e fluxo de erro.
- `patient-flow.spec.ts` — fluxo crítico (lista de pacientes).

## CI

`.github/workflows/e2e.yml` roda em PR. Credenciais via GitHub Secrets:
- `E2E_NUTRITIONIST_EMAIL`
- `E2E_NUTRITIONIST_PASSWORD`

## Rodar contra preview publicado

```bash
E2E_BASE_URL=https://id-preview--61ea7b22-72bd-452d-9f74-74ffe941d313.lovable.app \
  bun run test:e2e
```

Quando `E2E_BASE_URL` está definido, o Playwright NÃO sobe `bun run dev`.
