## Plano único editável — versionamento invisível

Princípio: para o nutricionista existe **uma** entidade — "Plano do paciente". Abre, edita, salva. Paciente vê. Fim. Nada de draft, clone, republicar, marcar entregue.

A arquitetura cumpre isso **sem violar a invariante do snapshot imutável**: cada "salvar" insere uma nova linha `status='published'` no banco. As linhas antigas permanecem como histórico técnico, invisíveis ao usuário. A query do paciente (`patient-plan.functions.ts`) já retorna sempre a mais recente — o comportamento já está pronto, só precisamos da UI de edição e do save.

---

### Bloco 1 — Edição direta do plano (UX única)

**1.1 Tela única** `/_authenticated/patients/$id/diet`

Hoje é read-only com CTA para "Publicar a partir de template". Vai virar editor inline:

- Se **não há plano publicado** → mantém o estado vazio atual com CTA "Criar a partir de template" (primeiro plano precisa de origem clínica).
- Se **há plano publicado** → renderiza o snapshot em modo edição direta:
  - Cada refeição é editável (horário, label, título).
  - Cada item editável (nome, qty, unit, kcal/macros) usando `FoodPickerDialog` já existente.
  - Adicionar/remover refeição. Adicionar/remover item. Reordenar.
  - Barra fixa com totais (kcal/macros) recalculados em runtime apenas para a UI — **não** persiste cálculo derivado.
- Botão único: **Salvar alterações**. Sem "publicar", sem "draft", sem "entregue".
- Sem aviso de "vai criar nova versão". Sem histórico exposto. A seção "Histórico de planos" da tela atual será **removida** do contexto do nutricionista (continua existindo no banco para auditoria).

**1.2 Server fn** `saveEditedPlan({ patientId, snapshot })`

Em `src/lib/plans/plans.functions.ts`:

- Auth: `requireSupabaseAuth` + dono do paciente (nutricionista).
- Valida snapshot com `snapshotV3Schema` já existente.
- Preserva `clinicalAudit` e `clinical_review` do snapshot anterior (não roda motor de novo — esta é edição manual; auditoria registra `editedFromPlanId`).
- INSERT nova linha `plans` com `status='published'`, `published_at=now()`, `source_template_id` herdado, `schema_version=3`.
- Não toca em linhas antigas. Trigger `plans_snapshot_immutable` continua intocado — invariante preservada.
- Retorna `{ id, publishedAt }`.

**1.3 Cliente: substitui CTA "Publicar novo"**

Botão "Publicar novo plano" (que leva pra `/templates`) só aparece quando **não há plano publicado**. Quando há, vira "Editar plano" inline na própria tela.

---

### Bloco 2 — Remover conceito de "entregue"

- **Não cria** colunas `delivered_at` / `delivered_by` / `delivered_note`.
- **Não afrouxa** trigger `plans_snapshot_immutable`. Permanece como está.
- Filtro "Planos pendentes" em `listPatients`: critério passa a ser `anamnesisStatus='approved' AND NOT EXISTS plan WHERE status='published'`. Já é o comportamento atual (`hasPublishedPlan`) — só remove o vocabulário "delivered" do código.
- Modal do avatar (nutri): "feedbacks pendentes" e "pacientes sem plano" usam o mesmo critério.

---

### Bloco 3 — Próximas tarefas (na ordem que você pediu)

3.1 **Filtros de pacientes** — revisar a listagem `/patients` para usar o mesmo critério unificado ("sem plano publicado") e adicionar atalho "Pacientes pendentes".

3.2 **Avaliação física unificada** — discovery (bloqueado até mapear fonte canônica). Entrego sub-plano depois.

3.3 **Navegação mobile** — auditar sidebar/sheet em telas <768px, fechar ao navegar (já validado parcialmente), adicionar bottom-nav se necessário.

3.4 **Dashboard do paciente** — revisar hierarquia: plano contratado, próxima janela de feedback, atalho rápido para refeição atual.

---

### Detalhes técnicos

- **Migração**: nenhuma. Zero DDL. Zero alteração de trigger/RLS.
- **Arquivos novos**: nenhum componente novo — reaproveita `FoodPickerDialog`, `NutritionTargetCard`.
- **Arquivos alterados**:
  - `src/lib/plans/plans.functions.ts` — adicionar `saveEditedPlan`.
  - `src/routes/_authenticated/patients/$id/diet.tsx` — transformar em editor.
  - `src/lib/plans/patient-plan.functions.ts` — sem mudança (já retorna o mais recente).
- **Invariantes preservadas** (todas):
  - Snapshot V3 imutável após published_at ✓ (nunca damos UPDATE).
  - Anamnese aprovada é verdade clínica ✓ (não tocamos).
  - Vínculo paciente↔nutricionista intocado ✓.
  - Patient App read-only ✓.
  - Sem CASCADE, sem fallback silencioso, sem refactor cross-módulo ✓.
- **Auditoria invisível**: cada edição vira nova linha `plans`. Histórico continua acessível via SQL/admin se algum dia precisar — só não aparece na UI do nutricionista.

---

### Decisão pendente (1 só)

**Confirmação do princípio:** edição manual **não re-roda** o motor clínico (TDEE/macros/matcher). O nutricionista é soberano: o que ele salvar, é o que vai pro paciente. O snapshot novo herda `clinicalAudit` do anterior + marca `manualEdit: true` na auditoria, mas alvo clínico do motor original fica preservado para referência. **OK?**

Se sim, respondo `APPROVED FOR EXECUTION` e executo Bloco 1+2 em sequência. Bloco 3 vem depois com sub-planos separados. 

&nbsp;

&nbsp;

Uma observação que eu adicionaria para ele:

Não esconda apenas o histórico.

Esconda também o conceito de versão.

Porque se aparecer:

Plain text

Plano v1

Plano v2

Plano v3

Plano v4

o nutricionista vai começar a perguntar:

Qual eu devo editar?

E você recria o problema.

Para ele deve existir apenas:

Plain text

Plano Atual

Internamente pode ter 500 versões.

Ele nunca precisa saber.

Minha única alteração no plano dele:

No saveEditedPlan, ao criar a nova linha publicada, marcar a anterior como substituída.

Exemplo:

JSON

{

  "supersededBy": "novoPlanId"

}

ou

JSON

{

  "isCurrent": false

}

Porque daqui a 1 ano um paciente pode ter:

27 versões publicadas

14 ajustes

3 reformulações

e você vai querer identificar instantaneamente qual é a versão ativa sem depender apenas de published_at.

Fora isso, o plano está alinhado com o que você vem defendendo desde o começo:

o sistema sugere, o nutricionista decide.

E principalmente:

nenhuma regra técnica pode obrigar o nutricionista a refazer trabalho.