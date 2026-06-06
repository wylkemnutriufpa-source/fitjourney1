---
name: fitjourney-template-rules
description: Regras fixas de FitJourney para templates de refeição e substituições — rotação de café/lanche por carboidrato base + recheio, regra de imagem ilustrativa (proteína principal em almoço/jantar; carboidrato base em café/lanche), agrupamento de proteínas por imagem genérica. Aplicar sempre que mexer em templates, smart-seeds, motor de equivalentes, food-images ou render de refeição.
---

# Regras Soberanas de Templates e Substituições — FitJourney

Estas regras são **invariantes do produto**. Valem para templates de Biblioteca, smart-seeds, geração de novas substituições e qualquer renderer (editor, Patient App, PDF).

## 1. Rotação fixa de Café da Manhã e Lanches

Café/lanche são montados como **bloco de itens** (carboidrato base + recheio/proteína + bebida + fruta opcional), não como item composto único. Exemplo de bloco real:

- Pão
- Frango grelhado desfiado
- Café com leite (ou café preto)
- Fruta (se houver no plano)

O **carboidrato base** rotaciona dentro deste pool oficial:

- Pão (francês/integral)
- Tapioca
- Cuscuz
- Wrap / Rap10
- Bolo de milho
- Bolo de macaxeira
- Panqueca de banana
- Vitamina de frutas com aveia

O **recheio/proteína** do café/lanche rotaciona entre: ovo, queijo, frango desfiado, picadinho (carne moída), atum (quando fizer sentido). Combinações típicas: pão+ovo, pão+queijo, pão+frango desfiado, pão+picadinho, tapioca+queijo, tapioca+ovo, tapioca+frango, tapioca+carne moída, cuscuz+queijo, cuscuz+ovo, wrap+ovo, wrap+frango.

Quando o profissional clica em **"Gerar nova substituição"** em um café/lanche, o motor rotaciona o **carboidrato base** (e proporcionalmente o recheio quando aplicável) — múltiplas opções, não uma só.

## 2. Regra de Imagem da Refeição (e da Substituição)

A imagem é **ilustrativa** — serve para dar sensação premium ao plano, não para descrever o conteúdo exato.

- **Almoço / Jantar:** imagem = **proteína principal**. Arroz, macarrão, quinoa, feijão, grão de bico, salada, fruta de sobremesa **não** geram imagem própria.
- **Café da manhã / Lanche:** imagem = **carboidrato base** (Pão, Tapioca, Cuscuz, Wrap, Bolo de milho, Panqueca, Vitamina). Não importa se o recheio é ovo, queijo, frango desfiado ou picadinho — visualmente é indistinguível e a foto é só ilustração. Não exigir imagens compostas tipo "pão-com-frango-desfiado.jpg".

Acompanhamentos e recheios **não** geram imagem própria — não caem em fallback genérico. Substituições seguem a mesma regra: imagem da opção = proteína principal (almoço/jantar) ou carboidrato base (café/lanche).

## 3. Agrupamento de Proteínas por Imagem Genérica

Variações de preparo da **mesma proteína** compartilham a mesma imagem do banco. Não criar/exigir foto por método de cocção.

- **Frango** (frito, cozido, assado, de forno, grelhado, desfiado) → imagem única `frango-grelhado`.
- **Carne bovina:** o banco já tem múltiplas imagens (contrafilé, patinho, alcatra, acém, picanha, maminha, fraldinha, coxão, músculo, picadinho/moída). Mapear por corte real; nunca por método de cocção.
- **Carne suína:** mesma regra. Cortes específicos (lombo, pernil, costela, file, picanha suína) mapeiam para a foto do corte; método de cocção é irrelevante para imagem.
- **Peixes:** preparo (grelhado, assado, ao forno) não troca imagem; corte/espécie sim.

## 4. O que NÃO é bug

Itens que **não** devem aparecer em relatórios de QA como "imagem faltando" ou "sem substituição":
- Acompanhamentos de almoço/jantar (feijão, arroz, salada, fruta de sobremesa) — sem imagem própria.
- Recheios de café/lanche (ovo, queijo, frango desfiado, picadinho) — sem imagem própria; a imagem é do carboidrato base.
- Bebidas (café, leite, suco) e fruta do café — sem imagem própria.
- Substituições de acompanhamento/recheio — sem imagem própria.
- Variações de preparo da mesma proteína sem foto específica — usam a imagem genérica do grupo.
- Ausência de arquivos compostos (`pao-com-frango-desfiado.jpg`, `tapioca-com-carne-moida.jpg` etc.) — não devem existir; imagem vem do carboidrato base.

O QA deve auditar apenas:
- Proteína principal de almoço/jantar sem imagem (bug real).
- Carboidrato base de café/lanche sem imagem (bug real).
- Café/lanche com pool de carboidrato base ou recheio menor que o oficial (bug de cobertura).
- Imagem trocada (slug não bate com nome — ex.: "Frango grelhado" com `peixe-grelhado.jpg`).

## 5. Origem dos dados

- Composição nutricional: tabela TACO (`taco_foods` no Cloud + seed local com `subGroup` clínico).
- Imagens: banco curado em `src/assets/foods/*.jpg` mapeado via `src/lib/food-images.ts`. Não criar arquivos para combinações compostas — usar sempre o carboidrato base ou a proteína isolada.
- Café/lanche é **bloco de itens individuais** no catálogo (Pão + Frango desfiado + Café + Fruta), não item composto único. O renderer resolve a imagem a partir do primeiro item do bloco (carboidrato base).

## 6. Onde aplicar

Ao alterar qualquer um destes arquivos, reler esta skill primeiro:
- `src/lib/substitutions/taco-catalog.ts` (pool de carboidratos base + recheios + subGroup)
- `src/lib/substitutions/equivalents.ts` (motor de rotação)
- `src/lib/substitutions/planner-bridge.ts` / `src/components/meal-editor/recalc.ts`
- `src/lib/food-images.ts` (fallbacks categóricos)
- `src/lib/meal-planner.ts` (`toPlannerTemplate`, `withLunchSides`, materialização)
- `src/lib/templates/smart-seeds.ts` e `src/lib/template-data.ts`
- Renderers do editor, Patient App e PDF (só consomem; nunca recalculam).
