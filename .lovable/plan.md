## Ajuste arquitetural aceito

Editor **nunca** alimenta o preview diretamente. A única ponte entre os dois é um **Snapshot V2 serializado (JSON)** — mesmo contrato que um paciente consumiria.

```
┌─────────────────────────┐
│  Editor V2 (Zustand)    │   ← estado mutável, só vive aqui
│  draft: PlannerTemplateV2│
└───────────┬─────────────┘
            │ [Gerar Snapshot]
            ▼
┌─────────────────────────┐
│  buildSnapshotV2(draft) │   ← função pura, src/lib/v2/snapshot/build.ts
│  + SnapshotV2Schema.parse│   ← valida ANTES de servir
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  Snapshot V2 (JSON)     │   ← imutável, congelado
│  sessionStorage:        │
│  "v2.pilot.snapshot"    │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  /my-plan-v2-preview    │   ← render burro, lê SÓ do storage
│  (zero import da store) │   ← zero recálculo, zero hidratação
└─────────────────────────┘
```

**Regra de import (testada automaticamente):**
- `my-plan-v2-preview.tsx` **proibido** de importar `src/lib/v2/editor/store.ts` ou qualquer componente do editor.
- Teste `src/lib/v2/__tests__/preview-isolation.test.ts` faz grep AST e falha o build se a regra for quebrada.

---

## O que muda no plano anterior

### Adicionado
- `src/lib/v2/snapshot/build.ts` — `buildSnapshotV2(template: PlannerTemplateV2): SnapshotV2`. Função pura. Serializa days→meals→items, copia macros já calculados pelo editor, congela. Sem inferência, sem fallback.
- `src/lib/v2/snapshot/storage.ts` — wrapper minimalista sobre `sessionStorage` com chave fixa `v2.pilot.snapshot`. `saveSnapshot(snap)` / `loadSnapshot(): SnapshotV2 | null`. Valida com `SnapshotV2Schema` na leitura também (defesa em profundidade — se schema mudar, preview quebra explicitamente em vez de renderizar lixo).
- Botão **`[Gerar Snapshot → Preview]`** no header do editor. Fluxo:
  1. `buildSnapshotV2(draft)`
  2. `SnapshotV2Schema.parse(snap)` — erros viram toast vermelho com o caminho do campo inválido (sem mascarar).
  3. `saveSnapshot(snap)`
  4. `window.open('/my-plan-v2-preview', '_blank')`
- Botão secundário **`[Baixar snapshot.json]`** — exporta o JSON cru. Útil para você inspecionar o contrato sem abrir DevTools.
- Banner no preview: `Snapshot gerado em HH:MM:SS · [Atualizar]` (recarrega do storage). Se storage vazio: `Nenhum snapshot gerado. Abra o editor e clique em "Gerar Snapshot".`

### Reforçado
- Preview **não** importa nada de `src/lib/v2/editor/**`. Só `snapshot/storage.ts`, `snapshot.v2.schema.ts` e os componentes de render.
- Preview **não** recalcula macros, **não** normaliza, **não** hidrata. Se faltar campo no snapshot, mostra erro vermelho com o nome do campo. Renderer burro, conforme contrato.
- Store do editor **não** persiste em storage. Recarregar o editor zera o rascunho. O snapshot é a única coisa que sobrevive entre abas — e ele é imutável por construção (congelado via `Object.freeze` recursivo em `buildSnapshotV2`).

### Removido do escopo anterior
- ~~"Preview lê os 7 dias direto dos dados V2"~~. Agora preview só lê snapshot serializado.
- `template-data.v2.ts` continua existindo, mas vira **seed** opcional do editor (`[Carregar template seed Hipertrofia]`), não fonte do preview.

---

## Validações que a trava habilita

| Validação | Como o piloto cobre |
|---|---|
| Schema V2 aguenta o template real | `SnapshotV2Schema.parse` no `[Gerar Snapshot]` |
| Serialização não perde dados | Diff visual editor ↔ preview (mesmas medidas, mesmas subs, mesmas notas) |
| Render burro funciona sem hidratação | Preview rejeita snapshot com campo faltando, em vez de inventar |
| Substituições matriz-válidas sobrevivem | Aparecem no preview exatamente como salvas |
| Imagens resolvem por `heroKey` | `imgFor()` aplicado só no render, sobre `heroKey` do snapshot |
| Contrato é estável | `[Baixar snapshot.json]` permite versionar o JSON entre iterações |

---

## Arquivos (delta sobre o plano anterior)

**Novos:**
- `src/lib/v2/snapshot/build.ts`
- `src/lib/v2/snapshot/storage.ts`
- `src/lib/v2/__tests__/build-snapshot.test.ts` — round-trip: `buildSnapshotV2` produz objeto que passa em `SnapshotV2Schema`; mudanças no rascunho após build **não** afetam snapshot (freeze).
- `src/lib/v2/__tests__/preview-isolation.test.ts` — grep AST garante que `my-plan-v2-preview.tsx` não importa nada de `editor/**`.

**Modificados (vs plano anterior):**
- `my-plan-v2-preview.tsx` — lê de `loadSnapshot()`, não de `template-data.v2.ts`.
- Header do `TemplateBuilder` — adiciona os dois botões.

**Inalterado:** todo o resto do plano (store, componentes do editor, 9 fluxos UX, isolamento dos 20 templates de produção).

---

## Critério de "pronto" (atualizado)

- `bun vitest run src/lib/v2` verde, incluindo `preview-isolation.test.ts` e `build-snapshot.test.ts`.
- Editar item no editor → `[Gerar Snapshot]` → preview reflete exatamente o que foi editado.
- `[Baixar snapshot.json]` produz JSON que passa em `SnapshotV2Schema`.
- Remover um campo obrigatório do snapshot no storage manualmente → preview mostra erro vermelho explícito, **não** renderiza com fallback.
- Grep automático: zero import de `src/lib/v2/editor/**` fora do editor e dos próprios testes.
- `git diff src/lib/template-data.ts src/lib/meal-planner.ts src/lib/plans/snapshot.schema.ts src/lib/plans/substitution-rules.ts` vazio.

---

## Confirmação

Mesmo escopo, mesmos arquivos, mesma fronteira de produção — **mais** a trava de contrato (`editor → buildSnapshotV2 → storage → preview`). Confirma e eu executo de uma vez (editor + snapshot serializado + testes de isolamento)?