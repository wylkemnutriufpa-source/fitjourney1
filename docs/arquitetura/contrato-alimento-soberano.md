# Contrato do Alimento Soberano (Etapa 0 — CONGELADO)

> Status: **APROVADO — 8 decisões fechadas. Base para Etapa 1 (revisão dos 20 templates) e Etapa 2 (schema).**
> Qualquer mudança neste contrato exige nova rodada de aprovação.

## 1. Princípio

> **Nutricionista pensa. Snapshot registra. Paciente lê.**

Toda informação exibida dentro de um bloco de refeição nasce no editor do nutricionista e é persistida no snapshot. Patient App, PDF, WhatsApp (e futuros consumidores: desktop, API) são leitores burros do mesmo snapshot.

## 2. Hierarquia oficial

```
Template
 └─ Refeição (Meal)
     ├─ observações da refeição        (meal.notes)
     └─ Alimento (Item)                ← unidade soberana
         ├─ identidade                 (foodKey, name)
         ├─ porção                     (qty, unit, kcal, macros)
         ├─ papel clínico              (scaleGroup → proteína | carbo | gordura | mista)
         ├─ medidas caseiras           (item.measures — lista + livre)
         ├─ substituições              (item.substitutions — com macros)
         └─ observações do alimento    (item.notes)
```

Regras:
- O alimento é a **unidade mínima soberana**. Tudo que o paciente vê ao expandir um item nasce dentro do item.
- A refeição (Meal) carrega apenas `notes` próprias. `meal.equivalents` (refeições alternativas inteiras) deixa de ser criada em planos novos — legado tolerado em planos antigos.
- O snapshot continua imutável após `published_at` (trigger `plans_snapshot_immutable`).

## 3. Origem dos dados

| Dado | Origem (sugestão) | Quem decide | Persiste em |
|---|---|---|---|
| identidade + porção + macros | catálogo `foods` | nutri (edita porção) | `item` |
| medidas caseiras | catálogo `food_household_measures` | nutri (lista + livre) | `item.measures` |
| substituições | `substitution-rules.ts` (**só no workspace**) | nutri (revisa, edita, remove, adiciona) | `item.substitutions` (com macros) |
| observações do alimento | livre | nutri (texto) | `item.notes` |
| observações da refeição | livre | nutri (texto) | `meal.notes` |
| papel clínico | catálogo `foods.scale_group` | imutável no catálogo | `item.scaleGroup` |

Pré-população assistida = **sugestão de workspace, nunca verdade clínica**. O que entra no snapshot é o que o nutri salvou explicitamente.

## 4. As 8 decisões congeladas

### 4.1 Granularidade da substituição → **POR ITEM**
Substituição é sempre alimento-a-alimento. Frango 130g → Peixe 130g → Patinho 110g. A refeição não muda. Substituição por refeição inteira não é criada em planos novos.

### 4.2 Medidas caseiras → **LISTA + LIVRE**
Sistema sugere a partir de `food_household_measures`. Nutri pode aceitar, editar, remover ou adicionar entradas livres ("1 posta média", "1 pegador", "1 xícara rasa"). Persiste em `item.measures` como lista final.

### 4.3 Observações → **AMBOS OS NÍVEIS**
- `meal.notes` — escopo da refeição ("Consumir em até 30 minutos após preparo").
- `item.notes` — escopo do alimento ("Preferir sem caldo").
- São campos independentes. Nenhum substitui o outro.

### 4.4 Regra Matriz → **SUGESTÃO + OVERRIDE**
Sistema sugere equivalências respeitando a matriz (proteína↔proteína, carbo↔carbo, gordura↔gordura). Nutri pode aceitar, editar ou substituir por equivalência fora da matriz. Snapshot grava a decisão final, sem marcar override.

### 4.5 PDF → **DOIS MODOS**
- **Resumido** (default): identidade + porção. Comportamento atual.
- **Expandido**: identidade + porção + medidas + substituições + observações (refeição + alimento).
Escolha por geração. Ambos consomem o mesmo snapshot.

### 4.6 Substituição carrega macros → **SIM, OBRIGATÓRIO**
Cada entrada em `item.substitutions` persiste: `foodKey`, `name`, `qty`, `unit`, `kcal`, `proteinG`, `carbG`, `fatG`, `note?`. Macros podem ficar ocultos na UI inicial, mas nascem no snapshot. Sem isso, qualquer auditoria de equivalência clínica futura vira migração retroativa.

### 4.7 WhatsApp → **LINK + RESUMO**
Mensagem contém:
- linha de status ("Seu plano alimentar está disponível.")
- resumo curto (nº de refeições, kcal totais)
- link para o app
O link continua sendo a fonte. O resumo é derivado do snapshot no momento do envio, nunca recalculado depois.

### 4.8 Soberania → **EDITOR → SNAPSHOT → CONSUMIDORES**
```
Editor do nutricionista (único lugar que calcula/sugere/infere)
        ↓
Snapshot publicado (imutável, fonte única)
        ↓
Consumidores: Patient App, PDF, WhatsApp, Desktop futuro, API futura
```
Nenhum consumidor calcula, infere, corrige, normaliza, hidrata ou "ajuda". Apenas exibe. Esta decisão encerra qualquer discussão sobre `getSubstitutionsFor` no paciente, PDF divergente do app, ou lógica paralela em consumidores futuros.

## 5. Experiência (Patient App)

```
CAFÉ DA MANHÃ
─────────────
ℹ Consumir em até 30 min após preparo.   ← meal.notes

▼ Frango grelhado 130g
   Medidas caseiras
   • 1 filé médio
   • 2 filés pequenos
   • 1 posta média                       ← livre
   Substituições
   • Peixe grelhado 130g
   • Patinho 110g
   • Ovos 3 un
   Observações
   • Preferir grelhado                   ← item.notes
▼ Arroz 100g
▼ Feijão 80g
```

- Seções vazias **não aparecem** (degradação elegante, invariante #9).
- Zero chamada a motor em runtime no Patient App.

## 6. Proibições explícitas

- ❌ Patient App, PDF ou WhatsApp chamar `getSubstitutionsFor()`, `substitution-rules`, `food_household_measures` em runtime.
- ❌ Inferência runtime de papel clínico em qualquer consumidor.
- ❌ `meal.equivalents` em planos novos.
- ❌ Override da matriz sem passar pelo editor.
- ❌ Substituição sem macros no snapshot.
- ❌ Schema novo antes da Etapa 2.

## 7. Plano após congelamento

1. ✅ **Etapa 0** — este documento aprovado.
2. **Etapa 1** — revisão dos 20 templates atuais (observação de uso real, sem código).
3. **Etapa 2** — schema: `item.measures`, `item.substitutions` (com macros), `item.notes`, `meal.notes` em `snapshot.schema.ts` (`.optional().passthrough()` para não quebrar snapshots antigos).
4. **Etapa 3** — UI do editor (per-item + per-meal notes).
5. **Etapa 4** — backfill assistido dos 20 templates (sugestão automática + revisão nutri + publish).
6. **Etapa 5** — PDF (dois modos) e WhatsApp (link + resumo) espelham snapshot.
7. **Etapa 6** — Patient App vira leitor burro (remove `getSubstitutionsFor` e lookups runtime).

Ordem é deliberada: Patient App é o **último** a mudar para nenhum paciente ver tela vazia.

## 8. Rollback

Documento é texto. Rollback = git revert. Nenhum sistema produtivo é tocado nesta etapa.

---

**Próximo passo:** iniciar Etapa 1 (revisão dos 20 templates). Aguardando `APPROVED FOR EXECUTION` para começar.
