# Testes E2E — FitJourney

Suite Playwright cobrindo os fluxos críticos do nutricionista.

## Setup (uma vez)

```bash
# 1. Instalar browsers do Playwright
bunx playwright install chromium

# 2. Copiar template e preencher credenciais
cp .env.test.example .env.test
# edite .env.test com:
#   E2E_NUTRITIONIST_EMAIL=<seu email>
#   E2E_NUTRITIONIST_PASSWORD=<sua senha>
#   E2E_BASE_URL=https://id-preview--<project-id>.lovable.app   (opcional)
```

`.env.test` está no `.gitignore`. Nunca commitar.

## Rodar

```bash
# Todos os specs
bun run test:e2e

# UI interativa (debug visual)
bun run test:e2e:ui

# Spec específico
bunx playwright test tests/e2e/03-financeiro.spec.ts

# Ver relatório HTML após falhas
bun run test:e2e:report
```

## Estrutura

| Spec | Cobre |
|---|---|
| `auth.setup.ts` | Login do nutri → salva sessão em `.auth/nutritionist.json` |
| `login.spec.ts` | Sanidade: sessão persiste + credenciais inválidas mostram erro |
| `01-public-invite.spec.ts` | Landing pública `/c/{slug}/{code}` (sem login) |
| `02-nutri-workflow.spec.ts` | Fila de anamneses + perfil de paciente (read-only) |
| `03-financeiro.spec.ts` | KPIs MRR/ARR/Ativos/Ticket + ausência de UUIDs vazando |
| `04-mobile-smoke.spec.ts` | Mesmos fluxos em viewport iPhone 13 |
| `patient-flow.spec.ts` | Smoke da lista de pacientes |

## O que NÃO está coberto (e por quê)

- **Aprovar anamnese / publicar plano**: efeito imutável no banco real.
  Precisaria de ambiente de staging dedicado com seed isolado. Hoje é
  validação manual.
- **Onboarding de paciente novo**: requer signup Google interativo
  (OAuth real). Coberto parcialmente pela landing pública.
- **Geração de PDF**: depende de assets pesados; melhor cobrir em
  teste unitário do gerador.

## Convenções

- Specs são resilientes a banco vazio (usam `test.skip()` quando não há
  dados).
- Asserts focam em **invariantes** (botão visível, sem erro 500, sem UUID
  vazando), não em pixel.
- Mobile usa preset `devices["iPhone 13"]` do Playwright.
