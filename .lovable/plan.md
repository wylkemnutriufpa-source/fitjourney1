## Contexto

Hoje o catálogo `foods` armazena tudo em **g/ml** (`default_qty`, `default_unit`). As "medidas caseiras" existem em `food_household_measures` (ex.: *Ovo cozido — 1 unidade = 50 g*), mas o editor de plano e o motor de equivalências **só calculam quando `unit ∈ {g, ml}**`:

- `recalc.ts` linha 33: se a unidade não for g/ml, devolve `defaultQty` cru (não escala).
- `equivalents.ts` linha 99: `nutrientPer100g` assume base em 100 g; itens em "unidade" não entram na fórmula.
- Macros do item (`EditItem`) são derivados de `kcal_per_100g * qty/100` — quebra para "unid".

Resultado: ovo, banana, maçã, tangerina, mamão, laranja em unidade ficam com macros zerados e nunca geram bloco de equivalentes.

## Objetivo

Permitir que o nutri escolha **unidade** como a forma natural de prescrever ovo e frutas, mantendo gramas como alternativa, e que **todo o motor** (macros do item, alvos do plano, blocos de equivalentes, snapshot) **calcule corretamente** convertendo unidade → gramas via medida caseira padrão.

Sem migration de banco — todos os dados necessários (`food_household_measures.grams_equivalent` + `is_default`) já existem. Só falta o frontend/motor usarem.

## Mudanças

### 1. Helper único de conversão — `src/lib/foods/unit-bridge.ts` (novo)

```ts
gramsFromQty(food, qty, unit) → number   // unid → g via measure default
qtyFromGrams(food, grams, unit) → number // g → unid (round 0.5 p/ ovo, 1 p/ fruta)
```

Regra: se `unit === "unid"` e existe `householdMeasures` com `isDefault`, usa `gramsEquivalent`. Senão, fallback para `defaultQty` (compat retro).

### 2. `src/lib/foods.functions.ts`

`FoodDTO.kcal` (e demais por-porção exibidos) hoje só consideram g/ml. Estender para `unid`: usar `gramsEquivalent` da medida default para calcular `kcal/protein/carb/fat` da porção padrão (1 unidade).

### 3. `src/components/meal-editor/recalc.ts`

- `equivalentQtyFromPlannerQty`: quando base é `unid`, converter para gramas via `gramsFromQty` antes de passar para o motor.
- Após `calculateEquivalents`, se o candidato original é "unid" (ovo etc.), reconverter `qty` final de g para unidades via `qtyFromGrams` (preservando step de 0,5 unid para ovo, 1 unid para fruta inteira).

### 4. `src/lib/substitutions/equivalents.ts`

Trocar a guarda `isMassOrVol` por: **se a base tem `gramsEquivalent` (próprio ou via measure), normalizar internamente para gramas** e rodar a fórmula como hoje. A saída usa a unidade do candidato (g ou unid, com conversão de volta).

Sem mudar a fórmula nem o arredondamento clínico (ceil p/ proteína, floor p/ carb/fruta) — esses já estão certos, só passam a operar sobre o equivalente em gramas.

### 5. Editor do plano — `src/routes/_authenticated/patients/$id/diet.tsx`

- No seletor de unidade do `EditItem`, oferecer `unid` quando o alimento tem ao menos uma medida caseira com `is_default` e `gramsEquivalent`.
- Ao trocar entre `g` ↔ `unid`, converter a `qty` automaticamente (não zerar) e **recalcular macros** do item via novo helper.
- Default para ovo (`scaleGroup=protein` + nome contém "ovo") e frutas inteiras (banana, maçã, tangerina, laranja, pera, mamão): preselecionar `unid`.

### 6. Snapshot — `src/lib/v2/snapshot/build.ts`

Garantir que o item persiste `qty` + `unit` consistentes (em unidades se assim foi prescrito) e que `gramsEquivalent` da medida usada vai no snapshot — Patient App e PDF apenas renderizam, sem recalcular (invariante #4 do pipeline soberano).

### 7. Testes

- `src/lib/substitutions/__tests__/equivalents.test.ts`: novo caso "ovo cozido 2 unid ↔ ovo mexido X unid", "banana 1 unid ↔ maçã 1 unid".
- `src/components/meal-editor/__tests__/recalc.test.ts` (se existir; senão criar): macros do item em unidade.

## Fora de escopo

- Adicionar novas frutas/medidas no catálogo (já tem o que importa; falta UI/motor usar).
- Mexer em planos já publicados (snapshot é imutável).
- Mudar TACO/USDA — continuam fonte por 100 g; só adicionamos a camada de conversão.

## Risco / Rollback

- Helper isolado + guarda nova no engine. Itens hoje em g continuam idênticos (fallback).
- Rollback: reverter os 4 arquivos do motor/editor; banco intacto.

## Validação (checklist)     

- Angela: editar ovo cozido → trocar para `2 unid` → macros aparecem corretos (≈156 kcal, 13 g prot).
- Bloco de equivalentes do ovo gera opções em unid (ex.: claras, ovo mexido).
- Banana 1 unid → equivalente em maçã ≈ 1 unid (não 90 g).
- Item em gramas (frango 120 g) continua exatamente como antes.
- Plano publicado antigo continua renderizando idêntico (snapshot imutável).