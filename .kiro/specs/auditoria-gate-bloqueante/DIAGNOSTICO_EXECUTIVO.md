# DIAGNÓSTICO EXECUTIVO: Clinical Gate Bloqueante

## TL;DR

**Problema:** O sistema está bloqueando publicação de planos com erro "não passou nas regras clínicas obrigatórias"

**Causa Raiz:** A arquitetura de validação (clinical-gate) está implementada como **bloqueador obrigatório**, não como **alerta sugestivo**

**Violação:** Contradiz decisão aprovada de produto: "O sistema sugere. O nutricionista decide."

**Risco:** Regressão para o mesmo padrão que destruiu a experiência do sistema 1.0

**Status:** 🔴 CRÍTICO — Deve ser corrigido antes de escalar

---

## O QUE ESTÁ ACONTECENDO

### Fluxo Atual (ERRADO)

```
Nutricionista publica plano
           ↓
Sistema valida contra regras hardcoded
           ↓
Se falha em proteína/déficit/macros → ERRO
           ↓
Publicação é BLOQUEADA
           ↓
Nutricionista fica preso
```

### Fluxo Aprovado (CORRETO)

```
Nutricionista publica plano
           ↓
Sistema calcula e gera avisos
           ↓
Exibe avisos ao nutricionista
           ↓
Nutricionista clica "Publicar mesmo assim"
           ↓
Sistema publica com auditoria completa
```

---

## POR QUE É CRÍTICO

### 1. Violação da Filosofia do Produto

Decisão aprovada:
> "Para o nutricionista existe apenas uma entidade: Plano do paciente.
> Fluxo: Abre → Edita → Salva → Paciente vê. SEM bloqueios."

Realidade:
> Clinical Gate bloqueia publicação se validação falha.

**Impacto:** Nutricionista não tem controle; sistema é o gatekeeper.

### 2. Repetição do Erro do Sistema 1.0

O sistema 1.0 fracassou porque:
- Criou regras ocultas ← **PRESENTE AQUI**
- Impôs fluxos obrigatórios ← **PRESENTE AQUI**
- Não deixava o profissional trabalhar ← **PRESENTE AQUI**

Sintoma de regressão: "O plano não passou nas regras"

### 3. Nutricionista Não Escolheu Essas Regras

Regras hardcoded em `src/lib/engine/clinical-gate.ts`:

- Proteína: 2.5 g/kg
- Déficit: 25% do TDEE  
- Macros: 10% do alvo
- Monotonia: 4 repetições/semana

**Problema:** Sem configuração, sem documentação acessível, sem override.

---

## NÚMEROS

**Regras de bloqueio:**
- 3 tipos de erro (severity="error") que impedem publicação
- 0 maneiras de nutricionista configurar limites
- 0 documentação que explique por quê

**Impacto UX:**
- Nutricionista recebe erro genérico
- Não sabe quais são os limites
- Não sabe por quê
- Não sabe como contornar

---

## SOLUÇÃO PROPOSTA

### Mudança de Paradigma

De: **"O sistema bloqueia planos inválidos"**

Para: **"O sistema alerta sobre desvios, nutricionista decide"**

### Implementação

1. **Clinical Gate como ALERTA:**
   - Remover `if (gate.blockers.length > 0) throw Error`
   - Mover todos os "blockers" para "warnings"
   - Sempre permitir publicação

2. **Auditoria Completa:**
   - Registrar que nutricionista foi alertado
   - Registrar que escolheu publicar mesmo assim
   - Timestamp + ID de quem publicou

3. **UX Transparente:**
   - Mostrar avisos antes do botão "Publicar"
   - Opção clara: "Publicar mesmo assim" vs "Voltar e editar"
   - Contexto: "Proteína: 140g para 60kg = 2.33 g/kg (limite: 2.5 g/kg)"

4. **Documentação (futuro):**
   - Tornar regras configuráveis por nutricionista
   - Documentar cada limite e razão clínica

---

## COMPARAÇÃO

| Aspecto | Sistema 1.0 (RUIM) | Atual (PROBLEMA) | Proposto (CORRETO) |
|---------|---|---|---|
| Bloqueia publicação | ✅ Sim | ✅ Sim | ❌ Não |
| Nutricionista controla | ❌ Não | ❌ Não | ✅ Sim |
| Regras ocultas | ✅ Sim | ✅ Sim | ❌ Não |
| Auditoria | ❌ Não | ❌ Fraca | ✅ Completa |
| Transparência | ❌ Não | ❌ Não | ✅ Sim |

---

## IMPACTO SE NÃO CORRIGIR

### Curto Prazo
- Nutricionista fica frustrado
- Começa a procurar bypass/workaround
- Confiança no sistema cai

### Médio Prazo
- Surgem requests: "deixe configurar", "adicione exceção"
- Código fica cheio de condicionalidades
- Debt técnico cresce

### Longo Prazo
- Sistema volta a servir à arquitetura, não ao profissional
- Mesma morte do sistema 1.0
- Produto inviabilizado

---

## RECOMENDAÇÃO

**✅ CORRIGIR AGORA**

Antes de:
- Escalar para mais nutricionistas
- Adicionar mais features
- Publicar nova versão

**Riscos de esperar:**
- Cada nova feature amplifica o problema
- Debt técnico exponencial
- Refactor futuro será mais caro

---

## PRÓXIMOS PASSOS

1. ✅ **Análise Crítica** — CONCLUÍDA (este documento)
2. ⏳ **Aprovação de Redesenho** — Aguardando decisão
3. ⏳ **Design Spec** — Detalhar implementação
4. ⏳ **Implementação** — Corrigir clinical-gate
5. ⏳ **Testes** — Validar com nutricionistas
6. ⏳ **Deploy** — Atualizar sistema

---

## DOCUMENTOS RELACIONADOS

- `docs/arquitetura/analysis.md` — Análise completa com detalhes técnicos
- `docs/arquitetura/contrato-alimento-soberano.md` — Decisão original aprovada
- `src/lib/plans/plans.functions.ts` — Código atual que bloqueia
- `src/lib/engine/clinical-gate.ts` — Regras de validação

