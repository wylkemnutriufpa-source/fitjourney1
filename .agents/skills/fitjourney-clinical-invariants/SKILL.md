---
name: fitjourney-clinical-invariants
description: Invariantes arquiteturais OFICIAIS do FitJourney. Têm precedência sobre qualquer implementação. Aplicar SEMPRE que tocar em motores (tdee, macros, matcher, clinical-gate, plan-builder), ClinicalContext, anamnese, avaliação física, peso, meta clínica, timeline, dashboard do paciente ou anamnese orbital.
---

# FitJourney — Invariantes Arquiteturais Oficiais

Estas regras têm precedência sobre qualquer implementação futura. Violar uma destas regras é violação arquitetural — não é trade-off, não é "por enquanto". Se um requisito novo aparenta exigir violação, **pare e renegocie o requisito**.

## 1. Avaliação Física NUNCA é bloqueante

A ausência de avaliação física jamais pode impedir:
- cadastro de paciente
- anamnese
- aprovação clínica
- geração de plano
- publicação de plano
- feedbacks
- motores determinísticos

AF é camada **adicional** de coleta. Melhora precisão. Nunca impede operação.

Padrões PROIBIDOS:
```ts
if (!physicalAssessment) throw ...
if (!physicalAssessment) redirect ...
if (!physicalAssessment) return <Blocked />
```

Gate, redirect obrigatório, bloqueio de publicação, bloqueio de plano ou bloqueio de motor por ausência de AF = rejeitado.

## 2. Anamnese aprovada é a verdade clínica

Motores **nunca** consomem `draft`, `submitted`, `needs_changes`.

Apenas `latestApprovedAnamnesis` (a última com `review_status = 'approved'` e `approved_at != null`). Sempre.

## 3. Peso é resolvido por RECÊNCIA

Origem **não** define prioridade. Data define.

Fontes válidas: `anamnesis`, `feedback`, `physical_assessment`.

A leitura mais recente vence. Sempre. Sem janelas de validade por fonte ("AF expira em 90d" = proibido).

A origem é armazenada apenas para auditoria. **Nunca** para decisão clínica. Tiebreaker em empate de timestamp é puramente técnico (`physical_assessment > feedback > anamnesis`), não clínico.

Implementação única: `src/lib/clinical/resolve-weight.ts`.

## 4. ClinicalContext é a ÚNICA porta de entrada dos motores

Nenhum motor (`tdee`, `macros`, `matcher`, `clinical-gate`, `plan-builder`) pode consultar diretamente:
- `anamneses`
- `patient_feedbacks`
- `patients`
- `physical_assessments`

Todos recebem `ClinicalContext` e apenas ele. Objetivo: evitar múltiplas fontes de verdade.

Se um motor precisa de dado novo, **adicione ao ClinicalContext** — não abra atalho.

## 5. Timeline NÃO é fonte de verdade

Timeline existe para: auditoria, dashboards, histórico, visualização.

Timeline **nunca**:
- alimenta cálculos
- alimenta motores
- substitui ClinicalContext
- persiste eventos derivados (`weight_change`, `goal_change` são runtime-only)

Timeline é projeção lógica read-only de `anamneses`, `patient_feedbacks`, `plans`, `physical_assessments`.

## 6. Dashboard do paciente é o centro da experiência

O paciente **não** entra diretamente em "Meu Plano".

Fluxo:
```
Dashboard → Plano → Feedback → Histórico
```

O plano alimentar é uma ferramenta, não a tela principal.

## 7. Anamnese Orbital é APENAS interface

Anamnese Orbital:
- não cria tabela
- não cria schema
- não cria runner novo
- não cria adapter novo
- não cria motor
- não altera `CanonicalAnamnesis`

Reusa integralmente o Runner V2. Saída final = `CanonicalAnamnesis` idêntica à da anamnese manual. A diferença é apenas visual e de experiência de preenchimento.

Qualquer duplicação de modelo clínico é proibida.

## 8. IA clínica é DETERMINÍSTICA

Por padrão são 100% determinísticos:
- TDEE
- Macros
- Matcher
- Clinical Gate
- Plan Builder

**Nenhum LLM** participa do cálculo.

Se um LLM for usado no futuro:
- deve ser explicitamente solicitado
- deve ficar isolado
- nunca pode alterar cálculo clínico
- nunca pode substituir motores determinísticos

## 9. Dados clínicos degradam com elegância

Ausência de dado:
- não quebra sistema
- não bloqueia profissional
- não gera erro fatal

O sistema opera com:
```ts
{ ready: false, missing: [...] }
```
e informa o que está faltando. Jamais trava. Jamais inventa default silencioso ("assumi 70kg") — só sinaliza degradação explícita.

## 10. Objetivo final

O sistema deve continuar funcional mesmo que o paciente tenha:
- zero avaliação física
- zero feedback
- apenas uma anamnese aprovada

Coleta de dados **melhora precisão**. Nunca vira dependência operacional.

---

## Checklist obrigatório antes de qualquer PR/patch

- [ ] Não introduzi gate por ausência de AF?
- [ ] Motor consome apenas `ClinicalContext`?
- [ ] Peso é decidido por recência (sem priorização por fonte)?
- [ ] Anamnese consumida é a aprovada mais recente?
- [ ] Nenhum cálculo clínico passa por LLM?
- [ ] Timeline não foi usada como fonte de cálculo?
- [ ] Sem fallback silencioso — campos ausentes sinalizam `ready: false`?
- [ ] Anamnese Orbital (se tocada) não criou schema/runner/adapter novo?
