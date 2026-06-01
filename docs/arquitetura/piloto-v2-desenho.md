# Piloto V2 — Desenho Técnico e Matriz de Impacto

> Status: **RASCUNHO — aguardando aprovação**.
> Escopo: PROVA DE CONCEITO isolada. **Zero alteração em produção.**
> Regra de ouro: se qualquer passo exigir tocar nos 20 templates atuais, no schema atual, em snapshots publicados ou no Patient App em produção → **parar e reportar**.

---

## 1. Princípio operacional

Produção e piloto **coexistem sem se enxergar**:

```
PRODUÇÃO (intocada)                       PILOTO V2 (isolado)
─────────────────────                     ──────────────────────
20 templates atuais                       1 template: esp-hipertrofia-v2-piloto
template-data.ts                          template-data.v2.ts (novo arquivo)
PlannerTemplate (atual)                   PlannerTemplateV2 (novo tipo)
my-plan.tsx                               my-plan.v2-preview.tsx (rota nova oculta)
snapshot.schema.ts                        snapshot.v2.schema.ts (novo arquivo)
```

Nenhum arquivo de produção é editado. Nenhum import de produção passa a depender de V2. V2 importa de V1 apenas tipos read-only (`PlannerFoodItem`, `PlannerMeal`) sem modificá-los.

---

## 2. Escopo (e o que está fora)

### Dentro
1. **Item soberano** — campos opcionais no item: `measures`, `substitutions`, `notes`.
2. **Regra Matriz** — função pura `validateMatrix(item, substitution)` que devolve `ok | violation`. Sem persistência, sem UI nova em produção.
3. **Snapshot V2** — schema novo que aceita os campos do item soberano e **continua aceitando snapshots V1 inalterados** (via `passthrough`).
4. **Patient App leitura** — rota nova oculta `/my-plan-v2-preview` que lê um snapshot V2 e exibe medidas/substituições/observações **sem nenhum cálculo runtime**.

### Fora (proibido nesta fase)
- ❌ Editar `src/lib/template-data.ts`.
- ❌ Editar `src/lib/plans/snapshot.schema.ts`.
- ❌ Editar `src/routes/_authenticated/my-plan.tsx`.
- ❌ Migration de banco.
- ❌ Tocar em qualquer snapshot já publicado.
- ❌ Alterar `meal-planner.ts`, `substitution-rules.ts`, `getSubstitutionsFor`.
- ❌ PDF, WhatsApp, finance, anamnese.
- ❌ Backfill, scripts de migração, qualquer ferramenta de conversão V1→V2.

---

## 3. Arquivos a CRIAR (somente novos)

| Arquivo | Propósito |
|---|---|
| `src/lib/v2/template.v2.types.ts` | Tipos: `ItemMeasureV2`, `ItemSubstitutionV2`, `ItemNoteV2`, `PlannerFoodItemV2`, `PlannerMealV2`, `PlannerTemplateV2`. |
| `src/lib/v2/template-data.v2.ts` | Exporta APENAS `espHipertrofiaV2Piloto` — cópia manual e independente do template atual de hipertrofia, enriquecida com `measures`/`substitutions`/`notes` em 2-3 itens de exemplo. Não importa nem deriva do `template-data.ts`. |
| `src/lib/v2/matrix.v2.ts` | Função pura `validateMatrix(itemScaleGroup, substitutionScaleGroup): { ok: boolean; reason?: string }`. Zero side-effects. |
| `src/lib/v2/snapshot.v2.schema.ts` | `SnapshotV2Schema` (zod, `passthrough`) que aceita `item.measures`, `item.substitutions`, `item.notes` como **opcionais**. Re-exporta tipo `SnapshotV2`. Não toca em `snapshot.schema.ts`. |
| `src/routes/_authenticated/my-plan-v2-preview.tsx` | Rota oculta (sem link em nav). Carrega `espHipertrofiaV2Piloto` em memória, valida com `SnapshotV2Schema`, renderiza leitura burra. |
| `src/lib/v2/__tests__/matrix.v2.test.ts` | Testes da matriz: P↔P ok, C↔C ok, G↔G ok, P↔C violation, etc. |
| `src/lib/v2/__tests__/snapshot.v2.test.ts` | Testes: snapshot V1 atual passa em `SnapshotV2Schema` sem erros; snapshot V2 com campos novos também passa; campos extras desconhecidos não quebram. |

## 4. Arquivos a EDITAR

**Apenas um, e apenas para registrar a rota nova:**

- `src/routeTree.gen.ts` — regenerado automaticamente pelo plugin do TanStack Router ao criar `my-plan-v2-preview.tsx`. **Não editar manualmente.**

Nenhum outro arquivo existente é tocado.

---

## 5. Schema afetado

**Banco: nenhum.** Sem migration, sem DDL, sem alteração em `plans.snapshot`.

**Schema de aplicação:**
- `snapshot.schema.ts` (V1) — **intacto**.
- `snapshot.v2.schema.ts` (novo) — superset compatível: todos os campos V1 são aceitos; `item.measures`, `item.substitutions`, `item.notes` são `.optional()`. Snapshots V1 passam sem alteração.

---

## 6. Componentes afetados

| Componente | Afetado? |
|---|---|
| `my-plan.tsx` (produção) | ❌ Não |
| `patients/$id/diet.tsx` | ❌ Não |
| `SendShareDialog`, PDF, WhatsApp | ❌ Não |
| `FoodPickerDialog` | ❌ Não |
| `meal-planner.ts`, `substitution-rules.ts` | ❌ Não |
| `my-plan-v2-preview.tsx` (novo) | ✅ Único consumidor V2 |

---

## 7. Convivência V1 ↔ V2

```
┌─────────────────────────────────────────┐
│ PRODUÇÃO                                │
│   template-data.ts ──► PlannerTemplate  │
│       │                                 │
│       ▼                                 │
│   my-plan.tsx ──► snapshot.schema.ts    │
│       │                                 │
│       ▼                                 │
│   plans.snapshot (banco) — V3 atual     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ PILOTO (em memória, sem banco)          │
│   template-data.v2.ts ──► PlannerTemplateV2
│       │                                 │
│       ▼                                 │
│   my-plan-v2-preview.tsx                │
│       │                                 │
│       ▼                                 │
│   snapshot.v2.schema.ts (validação)     │
│       │                                 │
│       ▼                                 │
│   render burro (sem persistir)          │
└─────────────────────────────────────────┘
```

- Os dois mundos **não compartilham estado mutável**.
- V2 não escreve em `plans`. Nada do piloto é publicado.
- V2 não aparece para nenhum paciente real — rota `/my-plan-v2-preview` é acessada manualmente para validação.

---

## 8. Risco de regressão

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Quebrar produção editando arquivo errado | **Baixa** | Lista do §3/§4 é exaustiva. Code review confere que nenhum arquivo de produção apareceu no diff. |
| `routeTree.gen.ts` confunde rota nova com existente | Baixa | Nome único `my-plan-v2-preview`. Plugin regenera idempotente. |
| Snapshot V1 falhar no `SnapshotV2Schema` | Baixa | Teste obrigatório em `snapshot.v2.test.ts` carrega 1 snapshot V1 real e valida. |
| Dependência circular V1↔V2 | Baixa | V2 só importa tipos de V1 (read-only). Lint impede o inverso. |
| Bundle size do paciente em produção crescer | Mínima | Rota V2 está sob `_authenticated` e é code-split por rota (TanStack). Pacientes não baixam o chunk se não acessarem. |
| Confusão operacional ("este é o template real?") | Média | Nome `esp-hipertrofia-v2-piloto` + badge visual "PILOTO V2 — NÃO PUBLICAR" na rota preview. |

---

## 9. Rollback

V2 inteiro é **deletável em um único commit**:

```
rm -r src/lib/v2/
rm src/routes/_authenticated/my-plan-v2-preview.tsx
```

Plugin TanStack regenera `routeTree.gen.ts` sem a rota. Zero impacto em produção, porque nenhum arquivo de produção foi tocado.

---

## 10. Critérios de sucesso

A arquitetura V2 é considerada **validada** quando, e somente quando, **todos** os itens abaixo passarem:

1. **Compatibilidade retroativa** — `SnapshotV2Schema.safeParse(snapshotV1Real)` retorna `success: true` para pelo menos 3 snapshots V1 reais do banco (lidos, não modificados).
2. **Item soberano** — `espHipertrofiaV2Piloto` carrega em memória com `measures`/`substitutions`/`notes` em pelo menos 2 itens.
3. **Matriz** — `validateMatrix('protein', 'protein').ok === true`, `validateMatrix('protein', 'carb').ok === false`, idem para carb e fat. 100% dos testes passam.
4. **Patient App leitura** — `/my-plan-v2-preview` renderiza o template piloto exibindo medidas, substituições e observações **sem nenhuma chamada a motor, hidratação, normalização ou cálculo runtime**. Grep no arquivo da rota não encontra: `getSubstitutionsFor`, `normalizeMealPlan`, `calculatePrimaryTotals`, `meal.equivalents` derivado.
5. **Produção intacta** — `git diff main -- src/lib/template-data.ts src/lib/plans/snapshot.schema.ts src/routes/_authenticated/my-plan.tsx src/lib/meal-planner.ts src/lib/plans/substitution-rules.ts` retorna **vazio**.
6. **Banco intacto** — `git log -- supabase/migrations/` desde o início do piloto retorna **zero commits novos**.

Se qualquer critério falhar, o piloto é considerado inconclusivo e nada avança.

---

## 11. O que NÃO é decidido aqui

- Como migrar os 20 templates para V2 (fora de escopo).
- UI do editor para preencher `measures`/`substitutions`/`notes` (fora de escopo).
- PDF/WhatsApp em V2 (fora de escopo).
- Schema final de banco para V2 (fora de escopo — piloto é em memória).

Tudo isso só entra em discussão **depois** dos 6 critérios acima passarem e o usuário aprovar explicitamente próxima fase.

---

## 12. Próximo passo

Aguardando **`APPROVED FOR EXECUTION`** para criar os 7 arquivos novos listados no §3. Nenhuma linha de código será escrita antes disso.
