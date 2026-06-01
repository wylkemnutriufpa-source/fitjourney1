# Piloto V2 — Wireframe do Template Builder (Editor do Nutricionista)

> **Status:** Wireframe. NÃO é implementação. NÃO toca produção. NÃO altera schema.
> Objetivo: alinhar a **experiência de edição** antes de qualquer código real.

---

## 1. Diferença que motivou este documento

| Snapshot Viewer (entregue antes) | Template Builder (o que falta) |
|---|---|
| Render burro de leitura | Componente de manipulação |
| Lista estática item → dados | Blocos colapsáveis com edição inline |
| Prova que o snapshot V2 carrega tudo | Prova que o nutricionista consegue criar/editar/manter |
| `/my-plan-v2-preview` | `/templates-v2-editor-preview` (mockup) |

Os dois são necessários. Um é o **destino imutável** (snapshot publicado). O outro é o **ateliê** onde o nutricionista trabalha antes de publicar.

---

## 2. Hierarquia visual do editor

```
TEMPLATE: Esportivo — Hipertrofia (V2)            [Salvar rascunho] [Publicar]
─────────────────────────────────────────────────────────────────────
Meta: 2800 kcal · P 180 / C 320 / G 80           Tags: esportivo, hipertrofia

▼ 07:00 — Café da manhã                                       [+ item]
─────────────────────────────────────────────────────────────────────
  ▶ Pão francês · 50 g · 135 kcal                  [editar] [⋮]
  ▶ Ovo inteiro · 2 un · 140 kcal                  [editar] [⋮]
  ▶ Mamão · 150 g · 60 kcal                        [editar] [⋮]

▼ 12:30 — Almoço                                              [+ item]
─────────────────────────────────────────────────────────────────────
  ▼ Frango grelhado · 180 g · 297 kcal             [recolher] [⋮]
  ┌───────────────────────────────────────────────────────────────┐
  │ NOME           [ Frango grelhado                            ] │
  │ QUANTIDADE     [ 180 ]  UNIDADE [ g ▾ ]                       │
  │ GRUPO          ( ) carb  (•) protein  ( ) fat  ( ) mixed      │
  │ MACROS         P [40]  C [0]  G [12]  kcal [297]              │
  │                                                               │
  │ ── Medidas caseiras ─────────────────────────── [+ adicionar] │
  │   • 1 filé médio (≈150 g)                          [×]        │
  │   • 1 filé grande (≈200 g)                         [×]        │
  │   [ digite uma medida livre... ] [salvar]                     │
  │                                                               │
  │ ── Substituições ────────────────────────────── [+ adicionar] │
  │   • Patinho 130 g · 180 kcal · protein            [edit] [×]  │
  │   • Tilápia 200 g · 200 kcal · protein            [edit] [×]  │
  │   [ + buscar no catálogo ]                                    │
  │                                                               │
  │ ── Observações ──────────────────────────────────────────────│
  │ [ Peso cru. Grelhar sem óleo.                              ] │
  │                                                               │
  │ ── Imagem ───────────────────────────────────────────────────│
  │ [ thumb ]  [trocar imagem]                                    │
  └───────────────────────────────────────────────────────────────┘
  ▶ Arroz integral · 120 g · 156 kcal              [editar] [⋮]
  ▶ Feijão preto · 80 g · 60 kcal                  [editar] [⋮]
  ▶ Salada verde · livre                           [editar] [⋮]

▶ 16:00 — Lanche da tarde                                     [+ item]
▶ 20:00 — Jantar                                              [+ item]
▶ 22:00 — Ceia                                                [+ item]

[ + adicionar refeição ]
```

### Estados de cada nível

- **Refeição**: `▶` recolhida (só título + horário) · `▼` aberta (lista de itens visíveis).
- **Item**: `▶` recolhido (nome + qty + kcal + ações) · `▼` aberto (painel completo de edição).
- Apenas **um item aberto por vez** dentro de uma refeição (UX foco). Refeições podem ficar todas abertas.

### Menu `[⋮]` por item

```
Duplicar item
Mover para ↑ ↓
Mover para outra refeição ▸
Remover
```

---

## 3. Fluxos críticos

### 3.1 Adicionar item a uma refeição
1. Click em `[+ item]` no header da refeição.
2. Abre **FoodPickerDialog** (já existe no projeto) → escolhe alimento do catálogo.
3. Item entra recolhido, com macros calculados a partir da quantidade default do catálogo.
4. Nutricionista pode abrir e ajustar.

### 3.2 Adicionar medida caseira
- Lista de medidas já cadastradas no catálogo do alimento aparece como checkboxes (importar).
- Input livre `[ digite uma medida... ]` permite criar medida custom (`label` + `gramsEquivalent` opcional).
- Cada medida vira chip removível.

### 3.3 Adicionar substituição
- Botão `[+ buscar no catálogo]` abre picker filtrado por `scaleGroup` igual ao item atual (ou `mixed`).
- Matriz V2 valida no salvamento (protein↔protein, carb↔carb, fat↔fat, mixed↔qualquer).
- Tentativa de adicionar substituição fora da matriz → toast vermelho bloqueando.

### 3.4 Recalcular macros
- Toda mudança de `qty` ou `unit` em modo **rascunho** recalcula kcal/P/C/G no editor.
- **Após publicar**: snapshot congela. Editor passa a mostrar banner `🔒 PUBLICADO — abra um novo rascunho para editar`.

### 3.5 Salvar / publicar
- **Salvar rascunho** → persiste sem congelar. Pode reabrir e mexer.
- **Publicar** → valida (todos os itens têm macros, matriz ok, sem refeição vazia) → gera snapshot V2 imutável → Patient App passa a ler dali.

---

## 4. Componentes (mapa, ainda não código)

```
<TemplateBuilderV2>
  <TemplateHeader />              ← nome, meta, kcal alvo, tags, ações salvar/publicar
  <MealList>
    <MealBlock> (colapsável)
      <MealHeader />              ← horário, label, [+ item], [⋮]
      <ItemList>
        <ItemRowCollapsed />      ← linha enxuta + [editar] + [⋮]
        <ItemEditorExpanded>      ← painel completo, um por vez
          <ItemBasicsForm />      ← nome, qty, unit, grupo, macros
          <MeasuresEditor />      ← chips + input livre + import catálogo
          <SubstitutionsEditor /> ← picker filtrado pela matriz
          <NotesField />          ← textarea
          <ImagePicker />         ← thumb + trocar
        </ItemEditorExpanded>
      </ItemList>
    </MealBlock>
  </MealList>
  <AddMealButton />
</TemplateBuilderV2>
```

Nenhum desses componentes existe ainda. Este wireframe **não os cria** — apenas nomeia para alinhar vocabulário.

---

## 5. O que este wireframe NÃO faz (regra de ouro reafirmada)

- ❌ Não cria os componentes acima.
- ❌ Não altera `template-data.ts` nem nenhum dos 20 templates de produção.
- ❌ Não toca em `meal-planner.ts`, `snapshot.schema.ts`, ou no Patient App.
- ❌ Não cria migrations.
- ❌ Não substitui o `/my-plan-v2-preview` (Snapshot Viewer continua sendo a prova de leitura).

A única coisa que acompanha este doc é a rota visual `/templates-v2-editor-preview` — **HTML/Tailwind estático**, zero estado real, zero handler que persista nada. Serve para você clicar e validar a UX antes de autorizar implementação.

---

## 6. Próxima decisão (sua)

1. **Aprovar wireframe como está** → eu detalho cada sub-componente (`MeasuresEditor`, `SubstitutionsEditor`, etc.) em specs antes de qualquer código.
2. **Pedir ajustes na UX** → eu refaço este doc + o mockup visual.
3. **Pedir variações** → posso entregar 2–3 direções visuais via prototype previews.

Nada será implementado de verdade até você dizer “APPROVED FOR EXECUTION — IMPLEMENTAÇÃO”.
