
# Fase 2 — Motor de Cálculo + Template Matcher

Objetivo: construir o **coração clínico** do FitJourney (TDEE → Macros → Matcher → Validação) sem alterar o layout/editor atual. Tudo determinístico, puro, testável, server-side.

---

## Escopo desta entrega

Entregar 4 blocos **isolados e puros**, prontos para serem plugados depois no fluxo do editor:

1. **TMB/TDEE Engine** — Mifflin-St Jeor + fatores de atividade
2. **Macro Engine** — distribuição por objetivo (cut/bulk/manutenção)
3. **Template Matcher** — score ponderado kcal/macros/restrições
4. **Clinical Gate** — validação pré-publicação

**Não escopo desta fase:** integração visual no editor, UI de seleção de template, recálculo no editor existente. Isso vem em fase posterior, sem desfazer nada.

---

## Matriz de Impacto

**Módulo alterado:** novo módulo `phase2/engine` + adição de colunas em `templates` (metadados de matching).

**Tipo:** DDL aditivo (colunas nullable) + código novo puro.

**Dependências diretas:** nenhuma. Colunas são opcionais, default null. Editor atual ignora.

**Dependências indiretas:** nenhuma. Engines são funções puras server-side, não chamadas pelo render do paciente nem pelo PDF.

**Risco de cascata:** zero. Nada existente lê essas colunas. Nada existente chama os engines.

**Rollback:** drop colunas + delete pasta `src/lib/engine/`.

**Checklist de não-regressão (Templates):**
- Planos antigos permanecem idênticos (snapshot intacto) — OK, não tocamos em plans
- Render do plano não faz JOIN com templates — OK, inalterado
- `source_template_id` continua apenas rastreabilidade — OK
- Editor atual continua funcional — OK, nenhuma alteração em `templates.tsx`

---

## 1. Schema (migration aditiva)

```sql
ALTER TABLE public.templates
  ADD COLUMN kcal_target          numeric,
  ADD COLUMN kcal_range_min       numeric,
  ADD COLUMN kcal_range_max       numeric,
  ADD COLUMN protein_g_target     numeric,
  ADD COLUMN carb_g_target        numeric,
  ADD COLUMN fat_g_target         numeric,
  ADD COLUMN meals_per_day        smallint,
  ADD COLUMN constraints_tags     text[] NOT NULL DEFAULT '{}',
  ADD COLUMN goal_tag             text;  -- 'cut' | 'bulk' | 'maintain' | null
```

Todas nullable (exceto array com default). Templates existentes seguem funcionando. Backfill manual depois.

---

## 2. Engines (código puro)

```
src/lib/engine/
├── tdee.ts            # mifflin-st jeor + fatores
├── macros.ts          # distribuição por goal
├── matcher.ts         # score 40/40/20
├── clinical-gate.ts   # validações pré-publicação
├── types.ts           # AnamneseInput, MacroTarget, MatchResult, GateResult
└── __tests__/         # vitest puro, sem mocks
    ├── tdee.test.ts
    ├── macros.test.ts
    ├── matcher.test.ts
    └── clinical-gate.test.ts
```

**Contratos:**

```ts
// tdee.ts
type Sex = 'male' | 'female';
type Activity = 'sedentary' | 'light' | 'moderate' | 'high' | 'extreme';
calcTMB({ sex, weightKg, heightCm, ageYears }): number
calcTDEE(tmb, activity): number

// macros.ts
type Goal = 'cut' | 'bulk' | 'maintain';
calcMacroTarget({ tdee, weightKg, goal }): { kcal, proteinG, fatG, carbG }

// matcher.ts
matchTemplates(target: MacroTarget, restrictions: string[], mealsPerDay: number, templates: TemplateMeta[]): MatchResult[]
// retorna ordenado por score desc, com score: number (0-100), reasons: string[]
// templates com score < 80 são marcados como `autoSelectable: false`

// clinical-gate.ts
validatePlan({ snapshot, target, weightKg }): { errors: GateIssue[], warnings: GateIssue[], blocked: boolean }
// regras: prot > 2.5g/kg, déficit > 25% TDEE, monotonia > 4x/sem, desvio macro > 10%
```

**Puro:** zero IO, zero supabase, zero React. Só funções → entrada/saída.

---

## 3. Server function (exposição controlada)

`src/lib/engine/engine.functions.ts` — uma única serverFn `computeNutritionTargets({ anamneseId })` que:
- lê anamnese via supabase autenticado
- roda TDEE → Macros
- retorna `{ tdee, target }`

Sem efeito colateral. Sem persistência. Sem mudar nada existente.

---

## 4. O que NÃO vou fazer

- Não toco em `src/routes/_authenticated/templates.tsx`
- Não toco em `src/lib/template-data.ts`
- Não toco em renderers do paciente
- Não toco em PDF
- Não crio UI nova
- Não altero snapshot/plans
- Não removo nem renomeio nada

---

## Detalhes técnicos

- TypeScript strict, funções puras com `Readonly<T>` nos inputs
- Vitest para todos os engines (TDD-friendly)
- Fórmulas conferidas: Mifflin-St Jeor padrão, fatores 1.2/1.375/1.55/1.725/1.9
- Matcher: kcal compatível se |kcal_target - target.kcal| ≤ (range_max - range_min)/2; macros compatíveis se desvio ≤ 10%; restrições: todas devem estar em `constraints_tags`
- Gate: roda só no servidor, retorna estrutura; UI de exibição vem em fase posterior

---

## Próximos passos (fora desta entrega)

1. UI de "Calcular alvo" na anamnese do paciente
2. UI de "Sugerir template" no fluxo de criação de plano
3. UI de validação clínica no editor (banner de alerta antes de publicar)
4. Backfill dos metadados dos templates atuais

Cada um desses entra em PR separado, sem desfazer nada do que existe.

---

**Aprova para eu executar a migration + criar os engines?**
