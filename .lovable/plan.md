
# Plano — FitJourney v2.0: Onboarding do Paciente + Sistema Real

Vou entregar em **5 fases independentes**, cada uma testável e publicável separadamente. Você aprova a sequência ou reordena.

---

## Fase 1 — Banco de Alimentos Real (TACO/IBGE) + Medidas Caseiras

**Objetivo:** transformar `food-catalog.ts` (mock) em tabela `foods` real no banco, populada com padrão TACO/IBGE, com medidas caseiras fidedignas.

**Mudanças de banco (migration):**
- Nova tabela `foods`: `id`, `name`, `category`, `source` (`taco`|`ibge`|`custom`), `kcal_per_100g`, `protein_g`, `carb_g`, `fat_g`, `fiber_g`, `scale_group`, `tags` (gluten_free, lactose_free, fodmap_safe, gastrite_safe — array), `default_qty`, `default_unit`.
- Nova tabela `food_household_measures`: `food_id`, `measure_name` ("colher de sopa cheia", "filé médio", "fatia"), `grams_equivalent`, `is_default`.
- RLS: leitura pública para `authenticated` (catálogo é compartilhado), escrita só `service_role`.

**Seed:**
- Script de seed com ~200 alimentos TACO mais usados nos templates atuais, cada um com 2-4 medidas caseiras.
- Marcadores de protocolo: `gluten_free`, `lactose_free`, `fodmap_safe`, `gastrite_safe`.

**Frontend:**
- `FoodPickerDialog` passa a ler de `foods` via server fn (não mais do `food-catalog.ts`).
- Modal de substituição mostra medidas caseiras (`"50g de tapioca = 3 colheres de sopa"`).
- `food-catalog.ts` vira fallback de leitura legada apenas (marcado deprecated).

---

## Fase 2 — Acoplamento kcal ↔ gramas no Editor

**Objetivo:** quando o nutri ajusta kcal, gramas recalculam proporcionalmente (e vice-versa). Nada de campos independentes.

**Mudanças (frontend, editor clínico apenas):**
- No `FoodItemRow` (editor): kcal e gramas viram **derivados um do outro** via `kcal_per_100g` do alimento.
  - Editou gramas → recalcula kcal, protein, carb, fat.
  - Editou kcal → recalcula gramas proporcionalmente, mantém o `food_id`.
- Macros (P/C/G) sempre derivados de `grams × per_100g`. Travados (não editáveis manualmente).
- Patient App e PDF **não mudam** — continuam render burro do snapshot.

---

## Fase 3 — Templates Reais no Banco + Novos Protocolos

**Objetivo:** migrar `template-data.ts` (mock, 813 linhas) para registros reais na tabela `templates` já existente, e criar os faltantes.

**Templates a popular (cada um com 7 dias, substituições, orientações):**
- Os atuais (emagrecimento, hipertrofia, manutenção, etc. — mantém estrutura).
- **Novos:** sem glúten, sem lactose, sem glúten **e** sem lactose, FODMAP, gastrite.
- Cada novo protocolo: filtra `foods` pelas tags correspondentes + traz bloco de **orientações personalizadas** (campo `content.guidelines` no JSONB) — ex: gastrite sem cítricos/café/pimenta, FODMAP fase de eliminação etc.

**Como vou popular:**
- Gero os JSONs dos templates (a partir do `template-data.ts` atual + variações para cada protocolo) e faço seed via `supabase--insert`.
- `nutritionist_id` dos templates seed = um "system" nutricionista (template global) OU cópia para cada nutri novo. Sugestão: **system templates** (nutritionist_id = NULL allowed, RLS permite leitura por todos), nutri pode duplicar e editar.
- Migration adiciona suporte a `nutritionist_id NULL` = template global.

---

## Fase 4 — Onboarding do Paciente (link de convite → anamnese)

**Objetivo:** experiência premium do paciente. Nutri gera link (já existe `referral_codes`), paciente clica, cadastra, preenche anamnese guiada em steps, fica disponível para o nutri.

**Fluxo:**
1. Nutri gera código em `/patients` → link `app/onboarding/{code}`.
2. Rota pública `signup/patient/$code.tsx` — paciente cria conta (email/senha + Google).
3. Após signup → redireciona para `_authenticated/onboarding/patient` (anamnese multi-step, premium).
4. Steps da anamnese:
   - Dados pessoais (idade, peso, altura, sexo, atividade)
   - Objetivo (emagrecer / hipertrofia / manutenção / saúde)
   - Restrições alimentares (glúten, lactose, FODMAP, gastrite, vegetariano, alergias livres)
   - Rotina (horários, refeições/dia)
   - Histórico/saúde
   - Preferências e aversões alimentares
5. Salva em `anamneses.data` (JSONB, schema_version=1). Vincula `patient_id` + `nutritionist_id` (resolvido pelo `referral_code`).
6. Nutri recebe na lista de pacientes com badge "Anamnese pronta".

**Mudanças de código:**
- Server fn `signupPatientViaReferral` (em `src/domain/write/patient.functions.ts`, seguindo regra do `domain/write`).
- Server fn `submitPatientAnamnese`.
- Rotas: `signup/patient.$code.tsx`, `_authenticated/onboarding/patient.tsx`, `_authenticated/patients/$id/anamnese.tsx` (visualização nutri).

**Importante:** NÃO há engine automática classificando e copiando template. O nutri **vê a anamnese pronta**, escolhe o template manualmente, ajusta no editor clínico, publica. Engine automática fica para v3.

---

## Fase 5 — Limpeza dos Mocks

- Remover/marcar deprecated: `src/lib/mock-data.ts`, `src/lib/template-data.ts` (depois que tudo migrou).
- Garantir que nenhum componente do app importa mock-data em runtime.
- Testes de fumaça: nutri novo → cria paciente manual → cria template do zero → publica plano → paciente vê.

---

## Detalhes técnicos

**Stack respeitada:**
- Toda mutação em `nutritionists`/`patients`/`referral_codes`/`anamneses` passa por `src/domain/write/` com `withDomainGate` (já é regra do projeto).
- Server fns com `requireSupabaseAuth` para nutri; signup do paciente usa fluxo público com validação do referral code via `supabaseAdmin`.
- `plans.snapshot` continua imutável após publicação (trigger já existe).
- Patient App / PDF não recalculam nada (regra soberana mantida).

**Ordem recomendada de execução:** 1 → 2 → 3 → 4 → 5. Posso fazer Fase 1+2 juntas (afetam o mesmo módulo: editor + catálogo). Fases 3, 4, 5 separadas.

**Tempo estimado por fase:** cada fase = 1 conversa dedicada. Não tente empilhar tudo em um turno só — vai estourar contexto e quebrar coisas que hoje funcionam.

---

## O que NÃO está no plano (confirma se quer adicionar)

- Engine automática de classificação anamnese→template (você disse que confundi — confirmado, fora).
- Login social do paciente (incluo Google por padrão no signup do paciente? sim/não).
- Notificação para o nutri quando paciente termina anamnese (email? in-app badge? ambos?).

**Aprova para eu começar pela Fase 1?**
