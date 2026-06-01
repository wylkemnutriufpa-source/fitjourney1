
# A1 + A2 — Versão Revisada (4 ajustes incorporados)

Aprovação recebida foi **condicional**. Esta versão incorpora os 4 ajustes obrigatórios. Não executo nada até receber `APPROVED FOR EXECUTION` sobre este plano revisado.

---

## Ajuste 1 — Separar `ready` de `calculable`

`ClinicalContext` passa a expor dois conceitos distintos.

```ts
export interface ClinicalContext {
  // ... (campos atuais inalterados)
  /** Contexto 100% completo: todos os campos atuais + futuros preenchidos. */
  readonly ready: boolean;
  /** Motores podem rodar (TMB+TDEE+Macros). Subset mínimo obrigatório. */
  readonly calculable: boolean;
  readonly missing: ReadonlyArray<MissingField>;
  /** Campos que faltam APENAS para calculable=true. */
  readonly missingForCalc: ReadonlyArray<CalcField>;
}

type CalcField = "weight" | "sex" | "ageYears" | "heightCm" | "activity" | "goal";
```

Regra de `calculable`:
```ts
calculable =
  currentWeight != null &&
  demographics.sex != null &&
  demographics.ageYears != null &&
  demographics.heightCm != null &&
  demographics.activity != null &&
  currentGoal != null;
```

Regra de `ready` permanece como hoje (atualmente coincide com `calculable`, mas **vai divergir** quando adicionarmos `waistCm`, `bodyFatPercent`, `leanMassKg`, etc. ao contexto — esses campos vão para `ready`, **nunca** para `calculable`).

**Impacto em `runNutritionEngines`:** troca `if (!ctx.ready)` por `if (!ctx.calculable)`. Comportamento idêntico hoje; preparado para amanhã.

**Invariante reforçado:** #9 (degradação elegante) — adicionar campos novos ao contexto nunca mais bloqueia publicação por engano.

---

## Ajuste 2 — Publicação bloqueia em `calculable`, não em `ready`

`publishPlanToPatient`:

```ts
const ctx = await loadClinicalContext(patientId, supabase);
if (!ctx.calculable) {
  throw new Error(
    `CLINICAL_CONTEXT_INCOMPLETE: missing=[${ctx.missingForCalc.join(",")}]`
  );
}
const engineOut = runNutritionEngines(ctx); // garantido != null
```

---

## Ajuste 3 — Clinical Gate bloqueia apenas `blockers`

`validatePlan` hoje retorna `{ blocked, issues[] }` onde `issues` já tem `severity: 'block' | 'warn'`. Refino a saída para deixar a separação explícita e não ambígua:

```ts
export interface GateResult {
  readonly blocked: boolean;
  readonly blockers: ReadonlyArray<GateIssue>;   // severity=block
  readonly warnings: ReadonlyArray<GateIssue>;   // severity=warn
  readonly issues: ReadonlyArray<GateIssue>;     // retrocompat (= blockers ∪ warnings)
}
```

Publish:
```ts
const gate = validatePlan({ weightKg, tdee, target, dailyTotals, foodOccurrences });
if (gate.blockers.length > 0) {
  throw new Error(`CLINICAL_GATE_BLOCKED: ${gate.blockers.map(b=>b.code).join(",")}`);
}
// warnings NÃO impedem publicação — entram no snapshot.
```

**Sem mudança nas regras existentes do gate.** Apenas reorganização do retorno. Os testes atuais (`clinical-gate.test.ts`) continuam válidos — `blocked` continua sendo `blockers.length > 0`.

---

## Ajuste 4 — Snapshot persiste contexto + versões

`snapshot.schema.ts` ganha bloco de auditoria clínica:

```ts
export const ClinicalAuditSchema = z.object({
  clinicalContextSnapshot: z.object({
    currentWeight: z.object({
      weightKg: z.number(),
      observedAt: z.string(),
      source: z.enum(["anamnesis", "feedback", "physical_assessment"]),
      sourceId: z.string(),
    }).nullable(),
    currentGoal: z.object({
      kind: z.string(),
      sourceAnamnesisId: z.string(),
    }).nullable(),
    demographics: z.object({
      sex: z.string().nullable(),
      ageYears: z.number().nullable(),
      heightCm: z.number().nullable(),
      activity: z.string().nullable(),
      sourceAnamnesisId: z.string().nullable(),
    }),
    calculable: z.literal(true), // sempre true em snapshot publicado
  }),
  engineOutput: z.object({
    tmb: z.number(),
    tdee: z.number(),
    target: z.object({ kcal: z.number(), proteinG: z.number(), carbG: z.number(), fatG: z.number() }),
    clinicalGoalKind: z.string(),
    engineGoal: z.string(),
  }),
  gateWarnings: z.array(z.object({ code: z.string(), message: z.string() })),
  engineVersion: z.string(),  // ex: "engine@1.0.0"
  gateVersion: z.string(),    // ex: "gate@1.0.0"
  publishedAt: z.string(),
});
```

Versões ficam em constantes:
```ts
// src/lib/engine/version.ts
export const ENGINE_VERSION = "engine@1.0.0";
export const GATE_VERSION = "gate@1.0.0";
```

Bump manual a cada mudança comportamental nos motores ou no gate. Auditoria clínica futura responde: "este plano foi publicado com qual motor?".

---

## Arquivos alterados (escopo cirúrgico)

| Arquivo | Mudança | Risco |
|---|---|---|
| `src/lib/clinical/context.ts` | adicionar `calculable` + `missingForCalc` | baixo (aditivo) |
| `src/lib/clinical/__tests__/context.test.ts` | casos novos para calculable vs ready | n/a |
| `src/lib/clinical/run-nutrition-engines.ts` | `ctx.ready` → `ctx.calculable` | baixíssimo |
| `src/lib/clinical/__tests__/run-nutrition-engines.test.ts` | atualizar 1 caso | n/a |
| `src/lib/engine/clinical-gate.ts` | retorno ganha `blockers`/`warnings`; `issues` retrocompat | baixo |
| `src/lib/engine/__tests__/clinical-gate.test.ts` | reforçar checagens de `blockers`/`warnings` | n/a |
| `src/lib/engine/version.ts` | **NOVO** — constantes ENGINE_VERSION/GATE_VERSION | nulo |
| `src/lib/plans/snapshot.schema.ts` | adicionar `clinicalAudit` opcional na raiz | baixo (opcional pra não quebrar snapshots antigos) |
| `src/lib/plans/plans.functions.ts` | novo `loadClinicalContext` + refactor `publishPlanToPatient` | **médio** |
| `src/lib/plans/__tests__/publish.test.ts` | **NOVO** — 10 casos | n/a |

---

## Casos de teste de `publish.test.ts`

1. ctx sem peso → `CLINICAL_CONTEXT_INCOMPLETE: missing=[weight]`
2. ctx sem goal → `CLINICAL_CONTEXT_INCOMPLETE: missing=[goal]`
3. ctx sem activity → `CLINICAL_CONTEXT_INCOMPLETE: missing=[activity]`
4. ctx calculable mas snapshot sem dias → `CLINICAL_GATE_BLOCKED: NO_DAILY_TOTALS`
5. ctx ok + plano com proteína 3 g/kg → `CLINICAL_GATE_BLOCKED: PROTEIN_OVER_LIMIT`
6. ctx ok + plano com monotonia (warning) → **publica** + `gateWarnings: [FOOD_MONOTONY]` no snapshot
7. publicação bem-sucedida → snapshot contém `clinicalAudit.clinicalContextSnapshot.calculable === true`
8. publicação bem-sucedida → snapshot contém `engineVersion` e `gateVersion`
9. publicação bem-sucedida → `engineOutput.target` bate com `runNutritionEngines(ctx)`
10. ctx tem campo "novo" (mock) faltando que afeta `ready` mas não `calculable` → publica normalmente

---

## Checklist de invariantes (matriz de impacto)

- [x] AF não bloqueia (não tocado)
- [x] Motor consome só ClinicalContext (preservado)
- [x] Peso por recência (preservado)
- [x] Anamnese aprovada = verdade (reforçado)
- [x] Sem LLM (preservado)
- [x] Timeline não vira fonte (não tocado)
- [x] Degradação elegante (**reforçado** pela separação ready/calculable)
- [x] Orbital sem schema novo (não tocado)
- [x] Snapshot imutável após published_at (preservado)
- [x] FK sem CASCADE (não tocado)
- [x] Patient App read-only (não tocado)
- [x] PDF não recalcula (não tocado — passará a usar `clinicalAudit.engineOutput.target` se quiser exibir; opcional)

## Não-regressão verificada (a executar antes de marcar concluído)

- Planos publicados antigos (sem `clinicalAudit`) continuam legíveis no Patient App — campo é opcional no schema.
- Editor de templates / planner não é tocado (continua usando `runNutritionEnginesManual`).
- Dashboard do paciente não é tocado.
- RLS não é tocada.

## Fora de escopo (confirmar)

- B1 (dashboard mock), B2 (e2e), C1 (FK audit), C2 (RLS smoke)
- `patients.height_cm` (P1)
- Exibir warnings na UI do editor (P1)
- PDF passar a consumir `clinicalAudit.engineOutput` (P2)

---

## Aguardando

`APPROVED FOR EXECUTION` sobre esta versão revisada para iniciar. Qualquer ajuste adicional, reviso o plano antes.
