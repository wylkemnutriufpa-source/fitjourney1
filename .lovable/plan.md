# Plano — Corrigir geração de imagens e substituições nos templates

Aplica as regras da skill `fitjourney-template-rules` no código. Sem mudar UI, sem mudar contrato de snapshot, sem tocar planos já publicados.

## Fix 1 — Acompanhamentos do almoço/jantar com `foodKey` canônico (CRÍTICO)

**Onde:** `src/lib/meal-planner.ts`, função `withLunchSides` (linhas 661–681).

**Problema:** os 4 itens injetados (Arroz, Feijão, Salada, Fruta) não têm `foodKey`. O `scaleItem` faz fallback para a `imageKey` da opção (a proteína), o que confunde `recalcMaterializedEquivalents` e gera ruído no QA.

**Correção:** declarar `foodKey` canônico para cada acompanhamento, alinhado ao catálogo TACO:

```ts
{ foodKey: "arroz-cozido",        name: "Arroz cozido",           ... scaleGroup: "carb" }
{ foodKey: "feijao-cozido",       name: "Feijão cozido",          ... scaleGroup: "protein" }
{ foodKey: "salada-verde-livre",  name: "Salada verde (livre)",   ... scaleGroup: "vegetable" }
{ foodKey: "fruta-sobremesa",     name: "Fruta de sobremesa",     ... scaleGroup: "fruit" }
```

Acompanhamento **não gera imagem própria** (regra 2 da skill) — o QA já ignora itens não-âncora.

## Fix 2 — `recalcMaterializedEquivalents` só roda em itens-âncora

**Onde:** `src/lib/meal-planner.ts`, função `materializeOptionEquivalents` (caminho que itera `option.items`).

**Problema:** hoje tenta materializar substituições para todo item, inclusive acompanhamento/recheio/bebida/fruta — gera 169 falsos positivos "sub sem imagem" e "âncora sem cobertura".

**Correção:** materializar somente:
- almoço/jantar → primeiro item `scaleGroup === "protein"` que não seja acompanhamento (feijão/salada/fruta);
- café/lanche → primeiro item do bloco (carboidrato base).

Demais itens ficam sem `materializedEquivalents` (paciente não vê "Trocar" neles, o que é o comportamento desejado: acompanhamento livre, recheio acompanha base).

## Fix 3 — Imagens: âncora apenas, sem compostos

**Onde:** `src/lib/food-images.ts` (fallbacks categóricos) + renderers.

**Problema:** QA reporta 130 itens sem imagem porque cai em recheios/acompanhamentos.

**Correção:**
1. Manter fallback categórico só para **proteínas** (almoço/jantar) e **carboidratos base** (café/lanche). Lista já existe — apenas garantir cobertura completa do pool oficial:
   - Carb base: pão, tapioca, cuscuz, wrap, bolo-de-milho, bolo-de-macaxeira, panqueca-de-banana, vitamina-de-frutas.
   - Proteínas faltantes detectadas no QA: `carne-moida-refogada` → fallback `carne-grelhada`; `queijo-minas` → sem imagem (recheio, não âncora) — remover do warning; `inhame` → adicionar como carb base se aparecer no pool.
2. Renderers do café/lanche resolvem imagem a partir do **primeiro item** do bloco (carb base), não de slug composto.
3. Não criar nenhum arquivo `pao-com-*.jpg` / `tapioca-com-*.jpg`.

## Fix 4 — Rotação de café/lanche: pool oficial garantido

**Onde:** `src/lib/substitutions/taco-catalog.ts` + `src/lib/substitutions/equivalents.ts`.

**Correção:** garantir que o pool de carboidrato base em café/lanche tenha **8 opções** (pão, tapioca, cuscuz, wrap, bolo-de-milho, bolo-de-macaxeira, panqueca-de-banana, vitamina-de-frutas) com `scaleGroup="carb"` e `subGroup="cafe-lanche-base"`. Motor já rotaciona por offset — só precisa do pool completo.

## Validação

Após cada fix, rodar:
```
bun run scripts/qa-templates.ts
```

Meta:
- 0 issues CRÍTICAS
- 0 `anchor-image-missing` em proteína de almoço/jantar
- 0 `anchor-image-missing` em carb base de café/lanche
- `rotation-pool-too-small` zerado nos 18 smart-seeds
- Ruído de acompanhamento/recheio desaparece (não é reportado)

## Não-regressão (Matriz de Impacto)

- Planos publicados: intactos (snapshot V3 imutável; só mudamos geração futura).
- Patient App: continua render-burro; resolve imagem a partir do primeiro item do bloco.
- V2 Piloto: não materializa substituições por design — fica fora do escopo deste fix.
- PDF: idêntico (consome snapshot).
- Sem migration de banco. Sem mudança de RLS. Sem mudança em vínculo paciente↔nutricionista.

## Ordem de execução

1. Fix 1 (`withLunchSides` com `foodKey`).
2. Fix 2 (materialização só na âncora).
3. Fix 4 (pool de carb base completo).
4. Fix 3 (fallbacks de imagem revisados).
5. Rodar QA e reportar contagem final por severidade.
