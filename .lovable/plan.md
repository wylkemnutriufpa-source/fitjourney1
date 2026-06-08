## Objetivo

Aplicar o mesmo padrão visual/interativo da página de protocolos (que você aprovou) em todas as telas onde o paciente vê o plano:

- `/my-plan` (plano publicado do paciente)
- `/c/{slug}/{code}` e `/c/{slug}` (visualização pública/compartilhada)
- `/my-plan-v2-preview` (preview V2)

Padrão alvo (idêntico ao de `protocolos.$protocolId` e `my-plan.protocolos`):

1. Tudo abre **retraído** (colapsado).
2. Card de refeição mostra: hora · nome · qtd de alimentos · kcal.
3. Clique na refeição → expande lista de alimentos.
4. Clique no alimento → expande as substituições daquele alimento.
5. Animações suaves + acessibilidade (`aria-expanded`).
6. Funciona muito bem no mobile.

## Escopo das mudanças

### 1. `/my-plan` (refator principal) aproveite e troque esse My-plan Para: Meu plano.

Substituir `MealCard` + `FoodItemReadonlyRow` + `EquivalentsButton` (modal/sheet de equivalentes inteiros) pelo padrão novo:

- `MealCard`: header colapsável simples (hora, nome, contagem, kcal). Mantém a imagem ilustrativa pequena.
- `FoodRow`: cada item do `main.items` vira linha colapsável. Substituições do item são derivadas por `getSubstitutionsFor()` (já existe) e renderizadas inline na expansão, com `Replace` icon + medida caseira + qtd + kcal.
- **Remover** o dialog/sheet "Ver equivalentes" — as substituições agora ficam embutidas por alimento (mesma UX dos protocolos).
- Manter expansão persistente em localStorage por plano (chave já existente `myplan:exp:${planId}`).
- Padrão inicial: tudo colapsado (mudar de "primeira refeição aberta" para tudo fechado, igual aos protocolos).
- Botão "Expandir/Recolher tudo" preservado.

### 2. `/c/{slug}/{code}` e `/c/{slug}`

Após confirmar que reusam o componente do my-plan, garantir que a mesma renderização aparece. Se forem renderers próprios, aplicar o mesmo padrão lá.

### 3. `/my-plan-v2-preview`

Substituir `V2MealCard` e linha de item por componentes equivalentes do novo padrão, usando o shape V2 (`day.meals[].items[].substitutions[]`).

## Itens preservados (não-regressão)

- Snapshot continua imutável (zero recálculo / normalização no renderer — invariante #2).
- Lista de compras (`ShoppingListCard`) continua consumindo `meals` no formato atual.
- `ClinicalAlerts`, `DailyProtocolBanner`, `WaterCalculatorCard`, orientações nutricionais — intocados.
- Persistência de expansão por plano mantida.
- Acessibilidade (`aria-expanded`, `aria-controls`, focus ring) mantida.

## Itens removidos

- Modal/Sheet "Ver equivalentes" do my-plan (substituído por expansão inline por alimento).
- `EquivalentsButton`, `EquivalentsSheet` (se existir) e Dialog de equivalentes ficam mortos — serão deletados se sem outros usos.

## Riscos

- O modal de equivalentes do my-plan hoje mostra a opção alternativa **inteira** (bloco completo). O novo padrão mostra substituições **por alimento individual**. Isso é uma mudança de semântica — é exatamente o que você aprovou na tela de protocolos.
- Se algum plano antigo só tiver `meal.equivalents` (blocos) e nenhum `item.substitutions`, a expansão do item virá vazia. Mitigação: derivar substituições do alimento via `getSubstitutionsFor()` (já é usado hoje no renderer) ou, na ausência, esconder o chevron do item.

## Validação pós-implementação

- Abrir `/my-plan` com um plano publicado real, verificar visualmente: tudo colapsado, expandir refeição, expandir alimento, ver substituições.
- Verificar console/network sem erros.
- Verificar mobile (384px).
- Verificar `/c/{slug}/{code}` com link real.
- Não declarar concluído sem validação visual (regra de accountability).

## Arquivos a alterar

- `src/routes/_authenticated/my-plan.tsx` (refator dos componentes de refeição)
- `src/routes/_authenticated/my-plan-v2-preview.tsx` (mesmo padrão sobre shape V2)
- `src/routes/c.$slug.$code.tsx` e `src/routes/c.$slug.tsx` (verificar e ajustar se renderer próprio)