## Objetivo
Quebrar o monolítico `src/lib/template-data.ts` (~1012 linhas) em arquivos organizados por categoria dentro de `src/lib/templates/`, criando também uma pasta `pilotos/` para testes. Manter 100% de compatibilidade com todos os imports existentes via barrel file.

## Estrutura final

```text
src/lib/templates/
  templates.functions.ts      (já existe — inalterado)
  types.ts                    (FoodItem, MealSlot, DietTemplate)
  foods-catalog.ts            (catálogo F + helpers item/meal)
  orientacoes.ts              (defaultOrientacoes, templateOrientacoes, orientacoesFor)
  esportivo.ts                (3 templates: hipertrofia, endurance, cutting)
  clinico.ts                  (10 templates: lowcarb, diabetes, colesterol, figado, hipertensao, renais, vesicula, sem-gluten, sem-lactose, sem-gluten-lactose, fodmap, gastrite)
  regional.ts                 (1 template: paraense)
  gestante.ts                 (1 template: gestante)
  pre-pos-oper.ts             (2 templates: pre-op, pos-op)
  bariatrica.ts               (1 template: pos-bariatrica)
  pilotos/
    index.ts                  (barrel para pilotos/testes; re-exporta espHipertrofiaV2Piloto)
  index.ts                    (templates[], categories, re-exports de tudo)

src/lib/template-data.ts      (vira barrel: re-exporta tudo de src/lib/templates/index.ts)
```

## Compatibilidade
- Nenhum import existente quebra. `template-data.ts` continua exportando `templates`, `categories`, `orientacoesFor`, `DietTemplate`, `FoodItem`, `MealSlot` e todos os demais símbolos.
- Sem alteração de schema de banco.
- Sem alteração de comportamento em runtime.

## Critério de rollback
- Deletar os novos arquivos em `src/lib/templates/` (exceto `templates.functions.ts`) e restaurar o conteúdo original de `src/lib/template-data.ts`.