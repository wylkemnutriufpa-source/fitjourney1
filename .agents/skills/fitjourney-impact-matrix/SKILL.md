---
name: fitjourney-impact-matrix
description: Governança permanente do FitJourney. Aplica-se SEMPRE que houver migration de banco, alteração de schema, alteração de módulo (Auth, Nutritionists, Patients, Anamneses, Planos, Templates, PDFs, Referral, Dashboard, Pagamentos), refactor que cruze fronteiras de módulo, ou qualquer mudança que possa gerar efeito cascata. Exige Matriz de Impacto Obrigatória antes da execução e antes de declarar sucesso. Critério de aceite NÃO é "funciona?", é "o que deixou de quebrar?".
---

# Matriz de Impacto Obrigatória — FitJourney

Regra permanente. Nenhuma migration, refactor cross-módulo ou alteração estrutural pode ser executada sem esta matriz aprovada pelo usuário. Nenhuma alteração pode ser declarada concluída sem o checklist de não-regressão verificado.

## Quando aplicar

SEMPRE que a mudança envolver:
- migration de banco (DDL, RLS, triggers, functions)
- alteração em qualquer módulo: Auth, Nutritionists, Patients, Anamneses, Planos, Templates, PDFs, Referral/Convites, Dashboard, Pagamentos
- refactor que cruza fronteira de módulo
- alteração em contrato JSONB (`anamneses.data`, `plans.snapshot`)
- alteração em FK, política RLS, ou trigger

NÃO precisa aplicar para: ajuste puramente visual em um único componente sem tocar dados, correção de typo, ajuste de copy.

## Formato obrigatório do relatório (antes da execução)

```
MATRIZ DE IMPACTO

Módulo alterado:
- {nome do módulo}

Tipo de mudança:
- {DDL / RLS / Trigger / Function / Refactor / Outro}

Dependências diretas afetadas:
- {lista de módulos que têm FK ou leitura direta do que mudou}

Dependências indiretas afetadas:
- {lista de módulos que podem quebrar sem relação aparente — renderers, jobs, integrações}

Risco de cascata:
- {descrição honesta. "nenhum" só se realmente nenhum}

Rollback:
- {como reverter se quebrar}
```

## Checklist de não-regressão (por módulo alterado)

Responder TODOS os itens do módulo afetado. "Não verificado" = bloqueio.

### Se alterar Planos
- [ ] Plano publicado continua visível no Patient App?
- [ ] PDF continua gerando idêntico?
- [ ] Paciente continua acessando o plano?
- [ ] Histórico de planos anteriores continua acessível?
- [ ] Snapshot imutável continua bloqueado contra UPDATE?

### Se alterar Templates
- [ ] Planos antigos permanecem idênticos (snapshot intacto)?
- [ ] Render do plano não faz JOIN com templates?
- [ ] `source_template_id` continua apenas rastreabilidade?

### Se alterar Referral / Convites
- [ ] Pacientes ativos continuam vinculados via `nutritionist_id`?
- [ ] Login dos pacientes continua funcionando?
- [ ] `source_referral_code` continua sendo só histórico, não vínculo?

### Se alterar Onboarding / Anamneses
- [ ] Pacientes ativos permanecem operacionais?
- [ ] Anamneses antigas continuam legíveis (via `schema_version`)?
- [ ] Parser da versão antiga ainda funciona?

### Se alterar Auth
- [ ] Perfis (`patients`, `nutritionists`) existentes continuam acessíveis?
- [ ] Não gera órfãos em `auth.users` sem `patients`/`nutritionists`?
- [ ] Job de detecção de órfãos continua operacional?
- [ ] FK `SET NULL` (não CASCADE) preservada?

### Se alterar Dashboard
- [ ] Continua read-only puro (zero escrita)?
- [ ] Falha de leitura não bloqueia operações de outros módulos?

### Se alterar PDFs
- [ ] PDF continua sendo função pura do snapshot (não fonte)?
- [ ] Dados clínicos no banco intactos?

### Se alterar Pagamentos
- [ ] Histórico financeiro preservado?
- [ ] Dados clínicos não foram tocados?

## Invariantes que NUNCA podem ser quebrados

1. Nenhuma FK usa `ON DELETE CASCADE`.
2. Dados clínicos usam `RESTRICT`. Vínculos administrativos usam `SET NULL`.
3. `plans.snapshot` é imutável após `published_at`.
4. Templates não são fonte de verdade de planos publicados.
5. Referral não é vínculo ativo — apenas histórico.
6. `anamneses.schema_version` e `plans.schema_version` existem desde o nascimento.
7. PDF é saída, nunca fonte.
8. Dashboard é read-only.
9. Renderers não recalculam/inferem/normalizam (ver `fitjourney-renderer-contracts`).
10. Sem dependência circular. Grafo é DAG.

Qualquer migration que viole um destes itens é rejeitada automaticamente, mesmo que a feature nova funcione.

## Critério de aceite

A pergunta NÃO é "funciona?".

A pergunta é "o que deixou de quebrar?".

Resposta exigida: lista explícita dos módulos não relacionados que foram verificados e continuam operando. Sem essa lista, sem aprovação.

## Após a execução

Reportar:
- Arquivos alterados
- Comportamento alterado
- Sistemas intocados (verificados)
- Itens do checklist marcados como OK
- O que NÃO foi verificado (com justificativa)

Vale a regra do user-memory: não afirmar que corrigiu/funciona sem validação visual no fluxo reportado.
