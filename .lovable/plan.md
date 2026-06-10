## Bugs reportados no editor (paciente Lucas)

### Bug 1 — Queijo minas aparecendo como substituição de proteína no almoço

**Causa provável:** o item base de almoço do Lucas tem `foodKey` que não existe no catálogo TACO (ou nome livre). O `findCandidateIn` faz fuzzy match e acaba grudando em `frango-desfiado`/`queijo-minas` (subGroup `protein-snack`). A partir daí o filtro `subGroup === base.subGroup` libera todo o pool de lanche.

**Fix:** Reforçar trava clínica em `src/lib/substitutions/equivalents.ts`:

- Quando `base.scaleGroup === "protein"` E não houver `subGroup` no base, inferir `protein-meal` se a refeição for almoço/jantar, `protein-snack` se for café/lanche.
- Encaminhar `mealKind` (ou um hint `proteinContext: "meal" | "snack"`) do `recalc.ts` até `calculateEquivalents` para que mesmo com fuzzy match o filtro respeite o contexto da refeição.
- Em `recalc.ts`, sobrescrever `eqBase.subGroup` conforme o contexto antes de calcular.

Observação minha: temos muita variedade de proteina..nao trm pq ficar rotacionando com poucas opcoes como estou percebendo..clico em gerar nova opcao repete 2..3x a mesma opção.. oq podemos introduzir tbm eh uma trapinho para profissionais clicar e tipo travar aquela opcao..e quando clicar em gerar so gera 2 pq tem uma travada..dai ele tava a 2a..e quando do clicar em gerar gera apenas uma até chegar na opcao perfeita sacou a jogada? Aplicar esse mecanismos em todas as opcoes de refeição a trava e rotacionamento sem travar..respeitando as gramas do item principal. 

### Bug 2 — Jantar não abre opção de edição da proteína

**Causa provável:** a proteína do jantar caiu em um caminho onde `householdMeasures` ou `kcalPer100g` está ausente, e o `Select` de unidade fica oculto (linha 871: `if (it.unit === "ml" || ...)`). Preciso ver o item real do snapshot do Lucas antes de afirmar — a hipótese mais barata é que o item foi salvo sem `kcal`/`unit` válidos e o botão de editar é renderizado condicional a `kcalPer100g`.

**Fix:** Investigar com o snapshot atual; tornar o botão de editar sempre visível (mesmo sem `kcalPer100g` permitir editar `qty`/`unit` em modo livre).

### Bug 3 — Edição de quantidade vai para ML em vez de gramas

**Causa:** linha 871-872 de `diet.tsx`:

```ts
if (it.unit === "ml" || ...) opts.splice(1, 0, { value: "u:ml", label: "ml", kind: "u" });
```

Quando o item nasce com `unit: "ml"` errado (vindo do catálogo do alimento), a opção `ml` aparece e fica selecionada. Para itens cujo `scaleGroup ∈ { protein, carb, fruit }`, a unidade default tem que ser `g` (ou `unid` para ovo/frutas inteiras).

**Fix:**

- Em `addFoodToMeal` / no carregamento do snapshot, forçar `unit = "g"` quando o `scaleGroup` indica sólido e o catálogo não declara explicitamente `ml`.
- No seletor de unidades, esconder `ml` para `scaleGroup ∈ { protein, carb, fruit }`.

### Bug 4 — Ovo sempre em unidades

**Fix:** Em `addFoodToMeal` e na materialização de substituições (`recalc.ts` → `MaterializedEquivalentOption`):

- Detectar `foodKey === "ovo-galinha"` (ou alias: `omelete`, `ovos-mexidos`, `ovos-cozidos`) e força `unit = "unid"` com `qty = Math.max(1, round(grams / 50))`.
- Aplicar a mesma normalização ao snapshot ao abrir o editor (não só na adição), para corrigir o plano atual do Lucas sem precisar de migration.

## Ordem de execução

1. Bug 1 (catálogo): força `subGroup` por contexto da refeição em `equivalents.ts` + `recalc.ts`.
2. Bug 3 (ml → g): trava em `addFoodToMeal` + filtro de opções no `Select`.
3. Bug 4 (ovo em unid): normalização única reaproveitada em add/recalc/abertura do editor.
4. Bug 2 (jantar edição): vou abrir o snapshot do Lucas via DB antes de mexer no JSX — preciso ver o item real para não chutar.

## Validação

Sem afirmação de "corrigido" antes de:

- Abrir o plano do Lucas no preview.
- Editar proteína do almoço → ver opções (sem queijo minas).
- Editar proteína do jantar → confirmar que abre.
- Trocar quantidade de proteína do almoço → unidade fica em g (não ml).
- Adicionar/editar ovo em qualquer refeição → fica em unid.

## Risco / rollback

- Mudanças isoladas em 2 arquivos (`equivalents.ts`, `recalc.ts`) + 1 arquivo de UI (`diet.tsx`).
- Sem migration, sem mudança em snapshot publicado.
- Reverso = git.

Posso seguir nessa ordem?