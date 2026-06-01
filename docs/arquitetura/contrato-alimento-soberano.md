# Contrato do Alimento Soberano (Etapa 0 — Congelamento)

> Status: **RASCUNHO — aguardando decisões abertas (ver §6)**
> Sem código, sem schema, sem migration até este documento estar APPROVED.

## 1. Princípio

> **Nutricionista pensa. Snapshot registra. Paciente lê.**

Toda informação exibida dentro de um bloco de refeição nasce no editor do nutricionista e é persistida no snapshot. Patient App, PDF e WhatsApp são leitores burros do mesmo snapshot.

## 2. Hierarquia oficial

```
Template
 └─ Refeição (Meal)
     └─ Alimento (Item)              ← unidade soberana
         ├─ identidade               (foodKey, name)
         ├─ porção                   (qty, unit, kcal, macros)
         ├─ papel clínico            (scaleGroup → proteína | carbo | gordura | mista)
         ├─ medidas caseiras         (lista persistida no item)
         ├─ substituições            (lista persistida no item)
         └─ observações              (texto livre persistido no item)
```

Regras:
- O alimento é a **unidade mínima soberana**. Tudo que o paciente vê ao expandir um item nasce dentro do item.
- A refeição (Meal) deixa de carregar `equivalents` no sentido de "refeições alternativas inteiras". Equivalência passa a ser **item-a-item**.
- O snapshot continua imutável após `published_at` (trigger `plans_snapshot_immutable`).

## 3. Origem dos dados

| Dado | Onde nasce | Quem edita | Persiste em |
|---|---|---|---|
| identidade + porção + macros | catálogo `foods` + editor | nutri (edita porção) | `item` |
| medidas caseiras | catálogo `food_household_measures` (sugestão) + editor | nutri (revisa/edita/adiciona) | `item.measures` |
| substituições | `substitution-rules.ts` (sugestão **só no workspace**) + editor | nutri (revisa/edita/adiciona) | `item.substitutions` |
| observações | editor | nutri (texto livre) | `item.notes` |
| papel clínico | catálogo `foods.scale_group` | imutável no catálogo | `item.scaleGroup` (já existe) |

Pré-população assistida = **sugestão de workspace, nunca verdade clínica**. O que entra no snapshot é o que o nutri salvou explicitamente.

## 4. Experiência (Patient App)

```
CAFÉ DA MANHÃ
─────────────
▼ Frango grelhado 130g
   Medidas caseiras
   • 1 filé médio
   • 2 filés pequenos
   Substituições
   • Peixe grelhado 130g
   • Patinho 110g
   • Ovos 3 un
   Observações
   • Preferir grelhado
▼ Arroz 100g
▼ Feijão 80g
```

- Cada alimento é um bloco colapsável.
- Seções vazias **não aparecem** (degradação elegante).
- Zero chamada a motor em runtime no Patient App.

## 5. Proibições explícitas

- ❌ Patient App chamar `getSubstitutionsFor()`, `substitution-rules`, ou qualquer derivação runtime de substituição/medida.
- ❌ Inferência runtime de papel clínico no paciente.
- ❌ "Refeições alternativas inteiras" (`meal.equivalents`) como fonte para o paciente — passa a ser legado tolerado em planos antigos, não criado em planos novos.
- ❌ Schema novo antes deste documento ser APPROVED.

## 6. Decisões abertas (bloqueiam Etapa 2 — Schema)

Cada item precisa de uma resposta única antes de virar contrato.

### 6.1 Granularidade da substituição
- **Hipótese A:** substituição é sempre **por item** (frango → peixe, arroz → batata).
- **Hipótese B:** substituição por item + ainda existe substituição por refeição inteira (legado).
- **Recomendação técnica:** A. B mantém duas verdades.
- **Decisão:** _______

### 6.2 Medidas caseiras — editáveis ou só sugeridas?
- **A:** nutri sempre escolhe da lista do catálogo (não edita texto).
- **B:** nutri escolhe da lista **e** pode adicionar medidas livres por item.
- **C:** texto totalmente livre, catálogo é só atalho.
- **Recomendação:** B (catálogo como base, liberdade clínica preservada).
- **Decisão:** _______

### 6.3 Observação pertence ao alimento ou à refeição?
- **A:** só ao alimento.
- **B:** só à refeição.
- **C:** ambos (`meal.notes` + `item.notes`).
- **Recomendação:** C — são coisas diferentes ("almoço pós-treino" vs "frango grelhado, sem óleo").
- **Decisão:** _______

### 6.4 Equivalência segue futura Regra Matriz?
- **A:** livre (nutri decide sem regra mecânica).
- **B:** sugestão pré-populada pela Matriz (proteína↔proteína, carbo↔carbo) + nutri pode override.
- **C:** estrita Matriz (sem override).
- **Recomendação:** B — protege o iniciante, libera o sênior.
- **Decisão:** _______

### 6.5 PDF mostra expandido ou resumido?
- **A:** tudo expandido (todas as seções de todos os itens).
- **B:** resumido (só identidade + porção, sem medidas/substituições/observações).
- **C:** dois modos (resumido por padrão, expandido opcional).
- **Recomendação:** C.
- **Decisão:** _______

### 6.6 Substituição carrega macros ou só nome+porção?
- **A:** só nome, qty, unit, kcal (igual hoje).
- **B:** nome, qty, unit, kcal **+ macros** (proteína/carbo/gordura).
- **Recomendação:** B — sem macros, nutri não consegue auditar equivalência clínica.
- **Decisão:** _______

### 6.7 WhatsApp acompanha o PDF?
- **A:** WhatsApp = mesma mensagem do PDF resumido.
- **B:** WhatsApp = link para o app (não duplica conteúdo).
- **Recomendação:** B — evita divergência futura.
- **Decisão:** _______

## 7. Plano após congelamento

1. **Etapa 0** — este documento aprovado (sem código).
2. **Etapa 1** — revisão dos 20 templates atuais para entender padrão real de uso (sem código, só observação).
3. **Etapa 2** — schema (`item.measures`, `item.substitutions`, `item.notes` em `snapshot.schema.ts`).
4. **Etapa 3** — UI do editor (per-item).
5. **Etapa 4** — backfill assistido dos 20 templates.
6. **Etapa 5** — PDF/WhatsApp espelham snapshot.
7. **Etapa 6** — Patient App vira leitor burro (remove `getSubstitutionsFor`).

Ordem é deliberada: Patient App é o **último** a mudar para nenhum paciente ver tela vazia.

## 8. Rollback

Documento é texto. Rollback = git revert. Nenhum sistema produtivo é tocado nesta etapa.

---

**Aprovação necessária:** responder §6 (7 decisões). Sem isso, Etapa 2 não começa.
