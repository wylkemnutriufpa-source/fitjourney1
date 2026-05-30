# Fase 2 — Plano de Execução por Estados de Identidade

Não é lista de endpoints. É máquina de consistência sob identidade incompleta.

## 1. Matriz de Estados (canônica)

| # | Estado | `auth.users` | `email_confirmed_at` | Profile (`patients`/`nutritionists`) | Sessão válida |
|---|---|---|---|---|---|
| S1 | UNVERIFIED_AUTH_USER | existe | NULL | não | não |
| S2 | VERIFIED_NO_PROFILE | existe | NOT NULL | não | sim |
| S3 | ACTIVE_DOMAIN_USER | existe | NOT NULL | sim | sim |
| S4 | ORPHAN_AUTH_USER | existe | qualquer | nunca existiu / perdido | irrelevante |

**Invariante global:** RLS deve operar corretamente em S1, S2, S3. S4 é responsabilidade do cleanup, não do runtime.

## 2. Transições Permitidas

```text
                signUp(email,pw)
        ∅ ─────────────────────────► S1
                                      │
                  confirm email       │
                                      ▼
                                     S2 ──── createProfile(role) ────► S3
                                      │                                  
                                      │ TTL expira / abandono           
                                      ▼                                  
                                     S4 ──── cleanup_orphan_auth_user ──► ∅
```

Transições proibidas:
- S1 → S3 (nunca cria profile sem email confirmado)
- S3 → S2 (profile não pode ser destruído sem destruir auth)
- S3 → S4 (profile ativo nunca vira órfão silenciosamente)

## 3. Pontos de Falha por Transição

| Transição | Falha possível | Detecção | Recuperação |
|---|---|---|---|
| ∅→S1 | email já existe | Supabase retorna erro | UI: "use login" |
| ∅→S1 | HIBP bloqueia senha | erro de signup | UI: nova senha |
| S1→S2 | link expirado | confirm 401 | reenvio de confirmação |
| S1→S2 | usuário abandona | TTL job | → S4 → cleanup |
| S2→S3 | referral inválido/consumido | server fn 409 | UI: pedir novo código |
| S2→S3 | race em referral (2 pacientes simultâneos) | `UPDATE...WHERE status='active'` retorna 0 rows | 409 atômico, segundo perde |
| S2→S3 | profile insert falha após referral lock | rollback transação | código volta a `active` |
| S3 estável | profile órfão por bug futuro | job de auditoria | alerta + cleanup manual |

## 4. Contratos de RLS sob Estados Incompletos

Regras que TODA policy nova precisa respeitar:

1. **Nenhuma policy faz JOIN obrigatório com profile.** Use `EXISTS` (já é o padrão atual) — retorna `false` graciosamente em S2, não quebra.
2. **`auth.uid()` pode existir sem linha em `patients`/`nutritionists`.** Policies já escritas (`auth_user_id = auth.uid()`) toleram isso: retornam zero linhas, não erro.
3. **Server functions distinguem 3 respostas em S2:**
   - sem token → `401`
   - token mas `email_confirmed_at IS NULL` (S1) → `403 EMAIL_NOT_CONFIRMED`
   - token confirmado sem profile (S2) → `409 PROFILE_REQUIRED` (UI redireciona pra onboarding)

Helper obrigatório no middleware: `assertState(allowed: ('S2'|'S3')[])`.

## 5. Server Functions (ordem por estado, não por CRUD)

**Bloco A — operam em S2 (verified, no profile):**
- `createNutritionistProfile({ full_name, crn? })` — S2→S3 nutricionista
- `redeemReferralAndCreatePatient({ code, full_name, birth_date? })` — S2→S3 paciente, atômico:
  - 1 transação: `UPDATE referral_codes SET status='consumed', consumed_by=auth.uid(), consumed_at=now() WHERE code=$1 AND status='active' RETURNING nutritionist_id`
  - se 0 rows → 409
  - `INSERT INTO patients(...)` com `nutritionist_id` retornado
  - falha no insert → transação reverte código

**Bloco B — operam em S3 (nutricionista ativo):**
- `generateReferralCode({ expires_in_days? })` — cria código active
- `listMyReferralCodes()` — leitura
- `revokeReferralCode({ code })` — UPDATE status='revoked' WHERE status='active'

**Bloco C — operam em S1/S4 (limpeza):**
- `requestEmailResend({ email })` — passthrough Supabase
- não exposto publicamente: `cleanup_orphan_auth_user` (já existe como função SQL, chamado só pelo harness/job)

## 6. Test Harness — Bateria por Estado

Arquivo: `src/lib/__phase2_harness__/` (apenas dev, gated por `process.env.PHASE2_HARNESS === '1'`).

| # | Teste | Estado inicial | Estado final esperado | Invariante validado |
|---|---|---|---|---|
| T1 | signUp `@phase2.test` | ∅ | S1 | auto_confirm OFF, sem sessão |
| T2 | admin confirm via `updateUserById` | S1 | S2 | bypass só no harness |
| T3 | createNutritionistProfile | S2 | S3 nutri | RLS permite, profile criado |
| T4 | generateReferralCode | S3 nutri | código active | RLS scope correto |
| T5 | signUp paciente + confirm | ∅ | S2 paciente | identidade isolada |
| T6 | redeemReferralAndCreatePatient (ok) | S2 paciente | S3 paciente | atomicidade |
| T7 | redeemReferral concorrente (2x) | S2 + S2 | 1×S3, 1×409 | race vencida pelo DB |
| T8 | redeemReferral com código revogado | S2 | 409 | status guard |
| T9 | RLS isolation: nutri A não vê pacientes de nutri B | S3×2 | leituras vazias | tenant scope |
| T10 | tentar criar profile sem confirmar (S1) | S1 | 403 | estado bloqueado |
| T11 | abandono → órfão → cleanup | S1 não confirmado | ∅ | cleanup_orphan_auth_user |
| T12 | cleanup recusa S3 | S3 | erro "has profile" | proteção do cleanup |
| T13 | Cleanup final: DELETE todos `@phase2.test` | qualquer | ∅ | protocolo de destruição |

T13 é **obrigatório** ao fim de cada bateria. Sem T13, bateria não é considerada executada.

## 7. Ordem de Implementação (sequencial, não paralela)

1. Helper de estado (`assertState`, leitura de `email_confirmed_at` via admin no middleware quando necessário) + códigos de erro padronizados (`401`, `403_EMAIL_NOT_CONFIRMED`, `409_PROFILE_REQUIRED`, `409_REFERRAL_INVALID`).
2. Server fns Bloco A (`createNutritionistProfile`, `redeemReferralAndCreatePatient`) — com transação atômica via `supabaseAdmin` para o redeem (RLS não cobre lock atômico em UPDATE+INSERT cruzado).
3. Server fns Bloco B (referral codes CRUD).
4. Harness T1–T6 (caminho feliz por estado).
5. Harness T7–T10 (falhas e races).
6. Harness T11–T12 (ciclo de vida órfão).
7. Harness T13 + script de cleanup global.
8. UI mínima de signup/login/onboarding (apenas o suficiente para acionar os fluxos manualmente — não é Fase 3).

Cada passo só avança após o anterior passar nos testes da sua faixa.

## 8. Invariantes da Matriz de Impacto (checklist Fase 2)

- [ ] Nenhuma FK nova com CASCADE
- [ ] Nenhuma alteração em `plans`, `templates`, `anamneses` (snapshot intacto)
- [ ] Patient App read-only preservado (Fase 2 não toca renderer)
- [ ] `referral_codes` continua histórico após consumo (não é vínculo ativo — `patients.nutritionist_id` é)
- [ ] Dashboard intocado
- [ ] Cleanup `@phase2.test` validado em remoto após cada bateria
- [ ] Nenhum dado fora do escopo `@phase2.test` criado no projeto

## 9. Critério de Conclusão da Fase 2

Não é "auth funciona". É:

1. Todas as 4 transições válidas executam em ambiente remoto com identidade real.
2. Todas as transições inválidas falham com código de erro determinístico.
3. Race condition do referral foi reproduzida e vencida pelo DB (não pela aplicação).
4. T13 executa zerando `@phase2.test` sem deixar resíduo em `auth.users`, `nutritionists`, `patients`, `referral_codes`.
5. Nenhum módulo fora do escopo (planos, templates, anamneses, PDF, dashboard) sofreu regressão — verificado por leitura direta no banco.

## 10. O que NÃO entra na Fase 2

- Google OAuth (Fase 2.5)
- Reset de senha UI completo (Fase 2.5 — só `requestEmailResend` server fn entra)
- Onboarding clínico do paciente (Fase 3)
- Convites por email com template próprio (Fase 2.5 com domínio transacional)
- Roles/admin além do que já existe em `user_roles`

---

**Decisão necessária antes de codar:**

A transação atômica do `redeemReferralAndCreatePatient` precisa de `supabaseAdmin` (RLS sozinha não garante o lock UPDATE+INSERT cruzado entre `referral_codes` e `patients` sem race). Isso significa uma server fn admin-elevated com guard explícito: só roda se `auth.uid()` == token confirmado E o INSERT em `patients` usa `auth_user_id = userId` do contexto.

Aprovas esse uso pontual de `supabaseAdmin` como mecanismo de atomicidade (não de bypass de autorização) ou preferes resolver via função SQL `SECURITY DEFINER` chamada por RPC (mantém tudo em policy + função, sem admin client no caminho)?
