# Auditoria Crítica: Gate Clínico Bloqueante vs. Filosofia do Produto

> **Status:** CRÍTICO — Risco de regressão para sistema 1.0
> **Data:** Análise arquitetural
> **Scope:** Clinical gate, pipeline de publicação, UX do nutricionista

---

## RESUMO EXECUTIVO

A arquitetura atual **repetindo padrão destrutivo do sistema 1.0**: engenharia criando controles bloqueantes que impedem o fluxo operacional do nutricionista.

**Problema concreto:**
Nutricionista tenta publicar um plano e recebe:
```
"O plano não passou nas regras clínicas obrigatórias. Revise as refeições e tente novamente."
```

**Por que isso é crítico:**
1. O nutricionista **nunca pediu validação bloqueante**.
2. A filosofia aprovada é: "sistema sugere, nutricionista decide".
3. O sistema está **impedindo** em vez de **alertar**.
4. Mesmo com templates (sugestão do sistema), o erro aparece.
5. Isso torna o sistema mais lento do que o Dietbox (não havia essas travessias).

---

## ANÁLISE: COMO CHEGAMOS AQUI

### 1. Filosofia aprovada para o FitJourney

```
Fluxo desejado (Dietbox):
1. Abre plano
2. Edita
3. Salva
4. Paciente vê
```

**Zero burocracia. Zero estados intermediários. Zero regras ocultas.**

### 2. O que foi implementado em `publishPlanToPatient()`

```typescript
// plans.functions.ts, linhas ~350-400

// ---- 5) Gate clínico — bloqueia APENAS em blockers (severity=error).
const gate = validatePlan({ ... });
if (gate.blockers.length > 0) {
  throw new Error(
    `CLINICAL_GATE_BLOCKED: ${gate.blockers.map((b) => b.code).join(",")}`
  );
}
```

**O que está bloqueando:**

Em `clinical-gate.ts`:
```typescript
// 1. Proteína > 2.5 g/kg                    → ERROR
// 2. Déficit calórico > 25% TDEE            → ERROR
// 3. Desvio de macros > 10% do alvo         → ERROR
// 4. Monotonia alimentar > 4 repetições     → WARNING
```

### 3. Por que as regras estão bloqueando

**Cenário típico:**
1. Nutricionista não tem anamnese aprovada do paciente.
2. Sistema gera draft automático usando template "esp-hipertrofia".
3. Nutricionista tenta publicar logo (workflow rápido).
4. **Sistema bloqueia:** "déficit calórico muito alto" ou "macros desviadas".

**Contexto:**
- Os templates são **genéricos** (não sabem o paciente específico).
- Sem peso/altura/idade confirmados, o contexto clínico é **incompleto**.
- Mas o sistema ainda **roda as regras** e **bloqueia publicação**.

---

## PROBLEMA ARQUITETURAL #1: CONFUSÃO DE SEVERIDADE

### O que deveria acontecer

| Caso | Severidade | Ação | UX |
|------|-----------|------|-----|
| Proteína > 2.5 g/kg | ⚠️ WARNING | Alerta visual | "⚠️ Atenção: proteína acima do recomendado" |
| Déficit > 25% | ⚠️ WARNING | Alerta visual | "⚠️ Atenção: déficit calórico alto" |
| Macros desviadas | ⚠️ WARNING | Alerta visual | "⚠️ Atenção: macros podem estar desalinhadas com o objetivo" |
| Monotonia > 4x | ℹ️ INFO | Info para auditoria | Não exibe para nutricionista |

### O que está acontecendo

| Caso | Severidade | Ação | UX |
|------|-----------|------|-----|
| Proteína > 2.5 g/kg | ❌ ERROR | **BLOQUEIA publicação** | Erro bloqueante |
| Déficit > 25% | ❌ ERROR | **BLOQUEIA publicação** | Erro bloqueante |
| Macros desviadas | ❌ ERROR | **BLOQUEIA publicação** | Erro bloqueante |
| Monotonia > 4x | ⚠️ WARNING | Continua | Alerta (correto) |

**Resultado:** O sistema virou **gatekeeper clínico**, não assistente.

---

## PROBLEMA ARQUITETURAL #2: BLOQUEIO SEM CONTEXTO

### Cenário real

Nutricionista com paciente novo:
1. **Sem anamnese aprovada** (contexto incompleto).
2. Usa template genérico.
3. Tenta publicar.

**O que deveria acontecer:**
- Sistema publica com `overrideMissingClinical: true`.
- Snapshot marca: `publishedWithoutClinicalContext: true`.
- Paciente recebe o plano.

**O que está acontecendo:**
- Sistema bloqueia em `CLINICAL_GATE_BLOCKED`.
- Nutricionista fica sem saber o quê mudar.
- Precisa investigar regras obscuras (2.5 g/kg? 25% déficit? 10% desvio?).

**UX result:** Pior que Dietbox. Mais lento. Mais frustrante.

---

## PROBLEMA ARQUITETURAL #3: REGRAS SEM FLEXIBILIDADE

### Em `clinical-gate.ts`, as constantes são hardcoded

```typescript
const PROTEIN_HARD_LIMIT_G_PER_KG = 2.5;
const CALORIC_DEFICIT_HARD_PCT = 0.25;
const MACRO_DEVIATION_HARD_PCT = 0.1;
const MONOTONY_HARD_COUNT = 4;
```

**Cenário:** Nutricionista quer prescrever 2.8 g/kg (para hipertrofia agressiva).
- Sistema bloqueia com `PROTEIN_OVER_LIMIT`.
- Nutricionista não consegue ignorar a regra.
- Precisa editar o plano de formas criativas (quebrar proteína entre múltiplos itens).

**UX result:** Nutricionista **contorna o sistema**, não o usa.

---

## PROBLEMA ARQUITETURAL #4: REGRAS NÃO ESTÃO NO SNAPSHOT

### Auditoria impossível

O snapshot tem `clinicalAudit`, que registra:
```typescript
gateWarnings: gate.warnings.map((w) => ({
  code: w.code,
  message: w.message,
})),
```

**Mas:**
- Não registra as **constantes** usadas (2.5 g/kg? 2.6? 2.7?).
- Não registra por **que** bloqueou (qual valor violou qual limite?).
- Não registra **como** o nutricionista contornou (se conseguir).

**Cenário futuro:**
- 6 meses depois, nutricionista revisa um plano publicado.
- Vê que tinha `gateWarnings`.
- Não consegue entender o contexto da decisão daquela época.

**Resultado:** Auditoria quebrada. Histórico clínico inacessível.

---

## COMPARAÇÃO: FitJourney vs. Dietbox vs. Sistema 1.0

| Aspecto | Dietbox | FitJourney Ideal | FitJourney Atual | Sistema 1.0 |
|--------|---------|------------------|------------------|------------|
| Nutricionista abre plano | ✅ 1 click | ✅ 1 click | ✅ 1 click | ✅ 1 click |
| Edita | ✅ Livre | ✅ Livre | ✅ Livre | ❌ Contornos |
| Salva | ✅ 1 click | ✅ 1 click | ⏸️ Bloqueado | ❌ Múltiplos estados |
| Paciente vê | ✅ Imediato | ✅ Imediato | ❌ Erro | ❌ Demora meses |
| Regras clínicas | ❌ Nenhuma | ⚠️ Alertas | ❌ Bloqueantes | ❌ Bloqueantes |
| Versioning | ❌ Não | ✅ Invisível | ✅ Invisível | ❌ Exposto |
| Auditoria | ❌ Não | ✅ Sim, invisível | ⚠️ Parcial | ❌ Chaotic |

**Conclusão:** FitJourney atual é **pior UX que Dietbox** no fluxo crítico.

---

## RAIZ DO PROBLEMA

### Por que isso aconteceu?

1. **Confusão entre "alertar" e "bloquear".**
   - Engenheiro pensou: "regra clínica → deve impedir".
   - Deveria ser: "regra clínica → deve informar".

2. **Falta de feedback loop com nutricionista.**
   - Ninguém testou o fluxo real.
   - Ninguém viu: "espera, preciso assinar um checkbox para ignorar?"

3. **Engenharia criando gatekeepers silenciosos.**
   - Código joga erro genérico.
   - Nutricionista não sabe o quê mudar.
   - Sistema 1.0 parte 2.

4. **Sem diálogo entre regra e ator.**
   - Nutricionista pode ter razão clínica válida.
   - Sistema não oferece opção de prosseguir com informação.

---

## RECOMENDAÇÕES CRÍTICAS

### Recomendação #1: Mudar TODOS os blockers para warnings

**Ação imediata:**

Em `clinical-gate.ts`, mudar severidade de **todos** os bloqueios:

```typescript
// ANTES:
if (offenders.length > 0) {
  issues.push({
    code: "PROTEIN_OVER_LIMIT",
    severity: "error",  // ❌ BLOQUEANTE
    message: `Proteína acima de ${PROTEIN_HARD_LIMIT_G_PER_KG} g/kg...`,
  });
}

// DEPOIS:
if (offenders.length > 0) {
  issues.push({
    code: "PROTEIN_OVER_LIMIT",
    severity: "warning",  // ✅ ALERTA
    message: `Proteína acima de ${PROTEIN_HARD_LIMIT_G_PER_KG} g/kg...`,
  });
}
```

**Efeito:**
- `gate.blockers.length` sempre será 0.
- `gate.warnings` receberá todos os avisos.
- Publicação **nunca bloqueará** por regra clínica.
- Warnings entram no snapshot para auditoria.

**Por quê:**
- Nutricionista é profissional responsável.
- Sistema fornece informação.
- Nutricionista decide.
- Fim.

---

### Recomendação #2: Adicionar "reason" aos warnings

Nutricionista precisa de contexto. Em `clinical-gate.ts`:

```typescript
gateWarnings: gate.warnings.map((w) => ({
  code: w.code,
  message: w.message,
  severity: w.severity,
  details: w.details,  // ✅ Adicionar
  suggestedAction: w.suggestedAction,  // ✅ Adicionar
})),
```

Exemplo:
```
{
  code: "PROTEIN_OVER_LIMIT",
  message: "Proteína acima de 2.5 g/kg",
  severity: "warning",
  details: { proteinPerKg: 2.8, limit: 2.5 },
  suggestedAction: "Se objetivo é hipertrofia agressiva, pode ser apropriado. Confirme clinicamente."
}
```

**Por quê:**
- Auditoria fica clara.
- Nutricionista vê por quê foi alertado.
- Pode documentar decisão se desejar.

---

### Recomendação #3: Registrar constantes no snapshot

Em vez de deixar constantes soltas em código, persistir em auditoria:

```typescript
clinicalAudit: {
  // ... (existente)
  gateConfiguration: {
    proteinHardLimitGPerKg: PROTEIN_HARD_LIMIT_G_PER_KG,
    caloricDeficitHardPct: CALORIC_DEFICIT_HARD_PCT,
    macroDeviationHardPct: MACRO_DEVIATION_HARD_PCT,
    monotonyHardCount: MONOTONY_HARD_COUNT,
  },
}
```

**Por quê:**
- Auditoria completa.
- Futuro: "qual regra se aplicava naquela época?"
- Se as constantes mudarem, histórico preserva contexto.

---

### Recomendação #4: UI deve exibir warnings, não bloquear

Quando nutricionista tenta publicar e há warnings:

**ANTES (atual):**
```
❌ Erro: O plano não passou nas regras clínicas.
```

**DEPOIS (recomendado):**
```
⚠️ ATENÇÃO — 3 avisos clínicos:
  • Proteína acima de 2.5 g/kg (2.8 g/kg detectado)
    Ação sugerida: confirmar se apropriado para objetivo de hipertrofia.
  • Déficit calórico de 30% (TDEE 2500 vs plano 1750)
    Ação sugerida: confirmar se é perda de peso agressiva.
  • Macros desviadas 12% do alvo
    Ação sugerida: ajustar quantidades ou revisar alvo.

[📝 Revisar plano]  [✅ Confirmar e publicar]
```

**Por quê:**
- Nutricionista vê alertas.
- Nutricionista escolhe revisar ou prosseguir.
- Sistema não impede.
- Filosofia respeitada: "sistema sugere, nutricionista decide".

---

### Recomendação #5: Permitir override clínico com documentação

Se nutricionista clica "Confirmar e publicar" com warnings presentes:

```typescript
const result = await publishPlanToPatient({
  patientId,
  snapshot,
  overrideGateWarnings: true,  // ✅ Novo campo
  clinicalNotes: "Paciente com objetivo de hipertrofia agressiva. Proteína e déficit confirmados com paciente em consulta.",
});
```

**Snapshot resultante:**
```typescript
clinicalAudit: {
  gateWarnings: [...],
  overrideNotes: "Paciente com objetivo de hipertrofia agressiva...",
  overriddenBy: "nutri_user_id",
  overriddenAt: "2025-01-15T10:30:00Z",
}
```

**Por quê:**
- Auditoria completa.
- Paciente sabe por quê o plano foi assim.
- Nutricionista não sente "o sistema me desconfia".

---

## IMPACTO: ANTES vs. DEPOIS

### Cenário: Nutricionista publica plano com déficit 30%

**ANTES (atual - BLOQUEADO):**
```
1. Publica plano
2. Sistema: "Erro: Déficit calórico muito alto"
3. Nutricionista: "?"
4. Tenta revisar plano (não sabe o quê)
5. Desiste ou contorna sistema
```

**DEPOIS (recomendado):**
```
1. Publica plano
2. Sistema: "⚠️ Déficit 30%. Quer confirmar?"
3. Nutricionista: Sim, clico confirmar com nota
4. Plano publicado, paciente vê
5. Snapshot registra contexto da decisão
```

---

## RISCO DE REGRESSÃO

### Sistema 1.0 tinha:
- ❌ Bloqueios sem feedback
- ❌ Estados intermediários
- ❌ Nutricionista contornava o sistema
- ❌ Auditoria quebrada
- ❌ UX pior que concorrentes

### FitJourney atual tem:
- ❌ Bloqueios sem feedback (NOVO PROBLEMA!)
- ✅ Versionamento invisível (correto)
- 🟡 Risco: Nutricionista vai começar a contornar
- 🟡 Risco: Auditoria vai ficar incompleta (falta contexto)

### Se não corrigir:
- 🚨 Em 3 sprints, nutricionista estará pedindo "apenas desabilite o gate"
- 🚨 Em 6 sprints, teremos politicking entre produto e clínica
- 🚨 Em 12 sprints, sistema 1.0 parte 2

---

## DECISÃO RECOMENDADA

### Aceitar as 5 recomendações acima como prioridade CRÍTICA

**Timeline:**
- **Sprint atual:** Implementar recomendações #1 e #2
- **Próximo sprint:** Recomendações #3, #4, #5
- **Teste:** 1 nutricionista real testando novo fluxo
- **Validação:** Conferir que UX melhora vs. Dietbox

**Critério de sucesso:**
1. Nenhum bloqueio de publicação por regra clínica
2. Todos os warnings aparecem com contexto
3. Nutricionista consegue publicar sem contorno
4. Auditoria completa no snapshot

---

## CONCLUSÃO

**A filosofia do produto é clara e correta:**
> "O sistema sugere. O nutricionista decide."

**A implementação atual viola essa filosofia.**

**O risco é real:** System 1.0 parte 2 se não corrigirmos agora.

**A correção é simples:** Mudar severidade de erro para aviso, adicionar contexto, permitir override.

**O impacto é grande:** Volta a ser fácil usar o sistema. Volta a ser melhor que Dietbox.

---

**Recomendação final:** Aceitar este diagnóstico e proceder com as 5 recomendações. **O problema não é engenharia ruim; é confusão entre "alertar" e "bloquear". Simples de consertar, crítico de deixar passar.**

