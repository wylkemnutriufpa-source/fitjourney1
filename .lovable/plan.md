## Continuação Lote 1 → Lote 2 → Lote 3

Foco: terminar o que falta, incluindo o **modal do avatar** que você destacou (resumo + atalhos diferenciados por papel).

---

### Bloco A — Fechar Lote 1 (rápido, baixo risco)

**A.1 Modal do Avatar (substitui o atalho atual para Configurações)**

- Local: `src/components/layout/AppShell.tsx` (botão do avatar no header).
- Mudança: clicar no avatar **não navega mais** para `/configuracoes`. Abre um `Dialog` (shadcn) com:
  - **Cabeçalho:** avatar + nome + email + papel (Nutricionista / Paciente / Admin).
  - **Resumo (paciente):** plano ativo (nome + dias restantes da assinatura), próxima janela de feedback (reaproveita lógica do `FeedbackCountdown`), status da anamnese (rascunho / aguardando revisão / aprovada).
  - **Resumo (profissional/nutricionista):** total de pacientes, pacientes com plano pendente, feedbacks pendentes de leitura nos últimos 7 dias.
  - **Atalhos paciente:** "Meu plano", "Feedback", "Minha anamnese", "Configurações", "Sair".
  - **Atalhos profissional:** "Dashboard", "Pacientes", "Configurações", **"Copiar link da minha landing"** (`/n/{slug}`), **"Gerar link de convite"** (`/c/{slug}` ou `/c/{slug}/{code}` se já houver código ativo), "Sair".
  - **Admin:** mantém atalhos atuais + "Sair".
- Dados: usa server fns já existentes (`getMyActiveSubscription`, `getMyFeedbackStatus`, `listPatients`, `getMyNutritionistProfile` para `slug`). Sem migração.
- Invariantes: não toca vínculo paciente↔nutricionista, não toca snapshot, não toca anamnese.

**A.2 Normalização de telefone**

- `src/lib/phone-mask.ts`: adicionar `normalizeBRPhone(raw)` (puro, sem efeito colateral).
- Aplicar **apenas em runtime** nos pontos de entrada (form de cadastro de paciente, edição de perfil). Não roda backfill aqui (vai pro Bloco B).

**A.3 Validação visual do Lote 1**

- Verificar no preview: countdown na página de feedback, seção de anamnese no perfil do paciente, modal do avatar abrindo com resumo correto por papel.

---

### Bloco B — Lote 2 (médio, requer migração)

**B.1 Trigger `plans_snapshot_immutable` — afrouxamento controlado**

- Migração: reescrever o trigger para permitir UPDATE **apenas** nas colunas `delivered_at`, `delivered_by`, `delivered_note`. Qualquer outra coluna continua imutável após `published`.
- Adicionar colunas `delivered_at timestamptz`, `delivered_by uuid`, `delivered_note text` em `plans`.

**B.2 Botão "Marcar plano como entregue"**

- `src/lib/plans.functions.ts`: nova `markPlanAsDelivered({ planId })` com `requireSupabaseAuth`, valida que o usuário é o nutricionista dono e que o plano está `published` sem `delivered_at`.
- UI: botão na tela de detalhe do plano (visível só ao nutricionista, só quando `status='published'` e `delivered_at IS NULL`).

**B.3 Reabrir plano publicado como rascunho**

- `reopenPublishedPlanAsDraft({ planId })`: clona o snapshot para nova linha `status='draft'`, **preserva** a linha publicada (sem editar). Patient app continua vendo a versão entregue até a próxima publicação.
- UI: botão "Editar como novo rascunho" no plano publicado.

**B.4 Filtro "Planos pendentes" — refinar**

- Atualizar critério para `anamnesisStatus='approved' AND NOT EXISTS plan WHERE status IN ('published') AND delivered_at IS NOT NULL`. Agora usa o `delivered_at` real (substitui o proxy do Lote 1).

**B.5 Backfill telefone normalizado**

- Migração aditiva: coluna `phone_normalized` em `patients`, populada via `UPDATE`. Sem remover `phone` original.

**B.6 Indicadores de assinatura no modal do avatar**

- Após B.1 estar de pé, adicionar badge "vence em X dias" no resumo do paciente (já preparado em A.1, só liga o dado).

---

### Bloco C — Lote 3 (discovery)

**C.1 Avaliação Física unificada**

- **Bloqueado por discovery.** Antes de qualquer código, mapear:
  - Tabela canônica (ou se precisa criar `physical_assessments`).
  - De onde vêm os dados hoje (anamnese? feedback? campo solto no plano?).
  - Quem escreve, quem lê, como entra no snapshot.
- Entrego um sub-plano específico depois do mapeamento.

---

### Ordem de execução

1. Bloco A inteiro (modal avatar + telefone runtime + validação visual).
2. Bloco B (migração primeiro, depois código).
3. Bloco C (discovery → sub-plano → execução).

### Invariantes preservadas

- Anamnese aprovada imutável (edição cria nova versão).
- Snapshot V3 imutável exceto pelos 3 campos `delivered_*` no Bloco B.
- Vínculo paciente↔nutricionista intocado.
- Patient App permanece read-only.
- Sem CASCADE, sem fallback silencioso, sem refactor não solicitado.

### Decisões pendentes (preciso de confirmação antes do Bloco B)

1. **Link de convite no modal do avatar (A.1)**: gerar um código novo a cada clique, ou reusar o último código ativo do nutricionista? (recomendo: reusar se existir ativo, senão gerar).
2. **Reabrir publicado (B.3)**: o draft clonado deve aparecer na lista de planos do paciente? (recomendo: **não**, só aparece pro nutricionista até publicar).
3. **Marcar entregue (B.2)**: precisa de campo de observação obrigatório, opcional, ou nenhum? (recomendo: opcional). Eu faria um ajuste importante antes de você dar o "Implement plan".
  O item mais perigoso desse plano é justamente o 2.1 Plano publicado editável (versionamento).
  Porque ele ainda está pensando como engenheiro.
  Você está pensando como nutricionista.
  São duas coisas diferentes.
  Hoje ele propõe:
  > Publicado → Clona → Cria Draft → Edita Draft → Republica
  Você está pedindo:
  > Publicado → Edita → Salva
  Sem intermediários.
  ---
  O que eu mandaria para ele antes de autorizar:
  Antes de iniciar o Lote 2 preciso alinhar uma mudança de direção.
  Não quero que a edição de um plano publicado gere automaticamente um novo draft, clone ou fluxo paralelo.
  A regra de negócio do FitJourney é:
  - O nutricionista pode editar qualquer plano do próprio paciente a qualquer momento.
  - O paciente sempre vê a versão mais recente salva.
  - O sistema não deve obrigar o nutricionista a recriar plano, clonar plano ou republicar plano para fazer ajustes.
  Se houver necessidade técnica de histórico, versionamento ou auditoria, isso deve acontecer em segundo plano, invisível para o usuário.
  Para o nutricionista existe apenas um conceito:
  "Plano do paciente".
  Ele abre.
  Edita.
  Salva.
  Fim.
  Antes de implementar o item 2.1 quero uma proposta arquitetural baseada nesse princípio.
  Não quero reproduzir o problema do sistema 1.0 onde o profissional era constantemente bloqueado por triggers, snapshots, drafts, estados ou regras técnicas.
  O sistema deve proteger os dados.
  Não deve controlar o nutricionista.
  ---
  Sobre o restante do plano:
  Eu aprovaria imediatamente
  Sidebar fechar após navegação
  Countdown de feedback
  Anamnese dentro do perfil do paciente
  Correção do filtro de planos pendentes
  Normalização de telefone
  Dashboard com plano contratado
  Modal do avatar
  Tudo isso é melhoria real de UX.
  ---
  Eu seguraria
  Afrouxar trigger de plano publicado
  Clone de plano publicado
  ReopenPublishedPlanAsDraft
  Qualquer coisa envolvendo draft/republicação
  Porque vocês acabaram de descobrir que o fluxo mais simples funciona melhor:
  Anamnese
  ↓
  Sugestão
  ↓
  Nutricionista ajusta
  ↓
  Salvar
  ↓
  Paciente vê
  Toda vez que aparece:
  draft
  clone
  reopen
  republish
  é um sinal de que a arquitetura está começando a servir ao sistema em vez de servir ao profissional.
  E pelo histórico que você contou do FitJourney 1.0, esse foi exatamente o caminho que levou ao excesso de travas e à perda de velocidade operacional.

Confirma o plano e responde as 3 decisões para eu seguir com `APPROVED FOR EXECUTION`? 