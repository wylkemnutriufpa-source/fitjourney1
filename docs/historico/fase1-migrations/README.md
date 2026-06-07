# Migrations Fase 1 — APENAS HISTÓRICO

⚠️ **NÃO RODAR. NUNCA.**

Estes 3 arquivos são artefatos históricos da Fase 1 do projeto. O schema que eles criam **já está aplicado em produção** há muito tempo (nutritionists, patients, templates, anamneses, plans, triggers de imutabilidade, view de órfãos).

## O que cada arquivo faz (e por que não rodar)

- **`001_phase1_up.sql`** — `CREATE TABLE` do schema base. Rodar hoje **quebra o banco**: todas as tabelas já existem com dados reais; o `CREATE TABLE` falharia, e mesmo se não falhasse sobrescreveria estrutura viva.
- **`001_phase1_down.sql`** — Rollback que faz `DROP TABLE` em tudo. Rodar **apaga 100% dos dados clínicos**. Só fazia sentido antes de qualquer dado real entrar — esse momento passou.
- **`001_phase1_seed.sql`** — Insere 5 linhas fake com UUIDs fixos para a bateria de testes destrutivos da Fase 1. Polui o banco de produção. Os testes correspondentes já foram executados e arquivados.

## Por que existem aqui

Documentação da decisão arquitetural original (imutabilidade de snapshot, FKs `RESTRICT` vs `SET NULL`, view de órfãos, etc). Útil para auditoria e onboarding técnico.

Qualquer mudança futura no schema deve ser feita via **nova migration** (`supabase--migration`), nunca reaproveitando estes arquivos.
