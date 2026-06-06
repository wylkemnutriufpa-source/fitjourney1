---
name: fitjourney-template-rules
description: Regras fixas de FitJourney para templates de refeição e substituições — rotação de café/lanche, regra de imagem (somente proteína principal / primeiro item), agrupamento de proteínas por imagem genérica. Aplicar sempre que mexer em templates, smart-seeds, motor de equivalentes, food-images ou render de refeição.
---

# Regras Soberanas de Templates e Substituições — FitJourney

Estas regras são **invariantes do produto**. Valem para templates de Biblioteca, smart-seeds, geração de novas substituições e qualquer renderer (editor, Patient App, PDF).

## 1. Rotação fixa de Café da Manhã e Lanches

Café da manhã e lanches **devem** rotacionar entre estas opções (pool oficial). Não inventar fora da lista; não restringir abaixo dela.

- Pão com ovo
- Pão com queijo
- Pão com frango desfiado
- Pão com picadinho (carne moída)
- Tapioca com queijo
- Tapioca com ovo
- Tapioca com frango desfiado
- Tapioca com carne moída
- Cuscuz com queijo
- Cuscuz com ovo
- Wrap/Rap10 com ovo
- Wrap/Rap10 com frango
- Bolo de milho
- Bolo de macaxeira
- Panqueca de banana
- Vitamina de frutas com aveia (a fruta pode variar dentro do plano)

Quando o profissional clica em **"Gerar nova substituição"** em um café/lanche, o motor **deve** rotacionar dentro deste pool — múltiplas opções, não uma só. O bug histórico de "só gera uma e não rotaciona" era falta de pool; agora há opções suficientes, então rotação real é obrigatória.

## 2. Regra de Imagem da Refeição (e da Substituição)

A imagem **sempre** vem do alimento âncora da refeição. Acompanhamentos **nunca** carregam imagem própria nem influenciam a escolha.

- **Almoço / Jantar:** imagem = **proteína principal**. Arroz, macarrão, quinoa, feijão, grão de bico, salada, fruta de sobremesa **não** geram imagem própria — entram como acompanhamento textual.
- **Café da manhã / Lanche:** imagem = **primeiro alimento** do bloco (em geral o composto: "Pão com ovo", "Tapioca com queijo", etc.).

Mesma regra para substituições: ao gerar opção alternativa, a imagem da opção segue o mesmo critério (proteína principal em refeição grande; primeiro alimento em café/lanche). Acompanhamento substituído **não** precisa de imagem — não cai em fallback genérico.

## 3. Agrupamento de Proteínas por Imagem Genérica

Variações de preparo da **mesma proteína** compartilham a mesma imagem do banco. Não criar/exigir foto por método de cocção.

- **Frango** (frito, cozido, assado, de forno, grelhado, desfiado) → imagem única `frango-grelhado`.
- **Carne bovina:** o banco já tem múltiplas imagens (contrafilé, patinho, alcatra, acém, picanha, maminha, fraldinha, coxão, músculo, picadinho/moída). Mapear por corte real; nunca por método de cocção.
- **Carne suína:** mesma regra. Cortes específicos (lombo, pernil, costela, file, picanha suína) mapeiam para a foto do corte; método de cocção é irrelevante para imagem.
- **Peixes:** preparo (grelhado, assado, ao forno) não troca imagem; corte/espécie sim.

## 4. O que NÃO é bug

Itens que **não** devem aparecer em relatórios de QA como "imagem faltando" ou "sem substituição":
- Acompanhamentos de almoço/jantar (feijão, arroz, salada, fruta de sobremesa) — por regra, sem imagem própria.
- Substituições de acompanhamento — por regra, sem imagem própria.
- Variações de preparo da mesma proteína sem foto específica — usam a imagem genérica do grupo.

O QA deve auditar apenas:
- Proteína principal sem imagem (bug real).
- Primeiro alimento de café/lanche sem imagem (bug real).
- Café/lanche com pool de rotação menor que o oficial (bug de cobertura).
- Imagem trocada (slug não bate com nome — ex.: "Frango grelhado" com `peixe-grelhado.jpg`).

## 5. Origem dos dados

- Composição nutricional: tabela TACO (`taco_foods` no Cloud + seed local com `subGroup` clínico).
- Imagens: banco curado em `src/assets/foods/*.jpg` mapeado via `src/lib/food-images.ts`. Fallbacks por categoria existem só para casos legítimos (variação de preparo da mesma família) — **não** para mascarar falta de pool.
- Compostos de café/lanche (pão com X, tapioca com X, cuscuz com X, wrap com X, bolo de milho, bolo de macaxeira, panqueca de banana, vitamina com aveia) são **itens próprios** no catálogo, não combinações dinâmicas em runtime.

## 6. Onde aplicar

Ao alterar qualquer um destes arquivos, reler esta skill primeiro:
- `src/lib/substitutions/taco-catalog.ts` (pool + subGroup)
- `src/lib/substitutions/equivalents.ts` (motor de rotação)
- `src/lib/substitutions/planner-bridge.ts` / `src/components/meal-editor/recalc.ts`
- `src/lib/food-images.ts` (fallbacks categóricos)
- `src/lib/meal-planner.ts` (`toPlannerTemplate`, `withLunchSides`, materialização)
- `src/lib/templates/smart-seeds.ts` e `src/lib/template-data.ts`
- Renderers do editor, Patient App e PDF (só consomem; nunca recalculam).
