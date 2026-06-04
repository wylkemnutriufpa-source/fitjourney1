# FITJOURNEY — PRINCÍPIO CANÔNICO DE SOBERANIA DO PROFISSIONAL

## REGRA MESTRA
O FitJourney é um sistema de apoio à decisão. Não é um sistema de autorização profissional.
O sistema calcula, sugere, audita e alerta. O sistema **nunca** decide pelo nutricionista.

---

## REGRA Nº 1 — NENHUM BLOQUEIO OPERACIONAL
O profissional nunca pode ser impedido pelo sistema de executar ações clínicas ou administrativas.
São proibidos:
- Gates obrigatórios ou fluxos bloqueantes.
- Pré-requisitos ocultos ou dependências obrigatórias não solicitadas.
- Regras clínicas que impeçam o salvamento ou a publicação.
- Triggers que neguem operações válidas.
O sistema pode alertar, mas **nunca** impedir.

---

## REGRA Nº 2 — AÇÃO SEMPRE VENCE VALIDAÇÃO
Se existir conflito entre a execução do profissional e a validação automática, a execução vence.
A validação deve gerar alertas, avisos, auditorias ou recomendações, mas nunca bloqueios.

---

## REGRA Nº 3 — OPERAÇÕES QUE NUNCA PODEM SER BLOQUEADAS
As seguintes operações para **Paciente**, **Anamnese**, **Avaliação Física**, **Plano Alimentar**, **Feedback** e **Protocolos** nunca podem ser bloqueadas:
- Criar
- Salvar / Editar
- Publicar
- Excluir

Nenhuma dessas operações pode depender da existência de outra de forma obrigatória.
*Exemplo: "Plano criado; motores automáticos terão menos contexto" (Correto) vs "Não é possível criar plano sem anamnese" (Errado).*

---

## REGRA Nº 4 — VERSIONAMENTO INVISÍVEL
O sistema gerencia versões; o profissional gerencia entidades.
O nutricionista não trabalha com IDs de versão, snapshots, drafts ou estados internos. Ao salvar, o sistema arquiva a versão anterior e torna a nova ativa automaticamente.

---

## REGRA Nº 5 — SUBSTITUIÇÃO AUTOMÁTICA (TIPO A)
Entidades do **TIPO A (Substitutiva)** possuem apenas uma versão ativa.
Exemplos: Plano alimentar, Plano financeiro, Configurações, Metas atuais.
Regra: Salvar substitui o anterior. O sistema arquiva o antigo e o usuário não precisa gerenciar o histórico manualmente.

---

## REGRA Nº 6 — HISTÓRICO CLÍNICO PRESERVADO (TIPO B)
Entidades do **TIPO B (Histórica)** representam eventos cronológicos.
Exemplos: Avaliação física, Feedback, Evolução clínica, Consultas.
Regra: Salvar cria um novo registro. A cronologia é preservada e registros anteriores nunca são sobrescritos automaticamente.

---

## REGRA Nº 7 — O SISTEMA SERVE AO PROFISSIONAL
Pergunta obrigatória: "Isso facilita ou dificulta o trabalho do nutricionista?"
Se dificultar, a implementação está errada, mesmo que tecnicamente correta.

---

## TESTE FINAL
Antes de aprovar qualquer feature: "O nutricionista consegue concluir a tarefa imediatamente?"
Se a resposta for não, a feature deve ser redesenhada. A arquitetura deve se adaptar ao fluxo, não o contrário.
