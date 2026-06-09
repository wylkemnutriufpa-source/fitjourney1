## O que vamos entregar

Duas coisas que conversam entre si:

1. **Calculadora de Água dentro do Perfil do Paciente** — usando os dados clínicos reais daquele paciente (peso atual por recência + nível de atividade da anamnese aprovada), com modo "simular" igual à do paciente.
2. **Jornada nova: Perfil do Paciente → Protocolos com contexto** — botão dourado "Aplicar Protocolo" no perfil leva ao catálogo já carregando o paciente em escopo. A partir daí, em todas as telas de protocolo (lista, detalhe do protocolo, fases), o sistema sabe quem é o paciente e:
  - Mostra um banner persistente "Comparando com {Nome do Paciente}".
  - Exibe o card de diagnóstico clínico × protocolo (já existe, é o `ProtocolDiagnosticCard`) dentro do detalhe do protocolo — ajustes sugeridos aparecem automaticamente.
  - Quando o nutri clicar em "Aplicar Fase", o seletor de paciente já vem pré-selecionado — um clique de confirmação aplica. ( Aproveite e jogue o Botão protocolo ativo do sidebar do paciente para cima do Dashboard..em opcao de destaque e faça como fez no profissional ..destaque para chamar atenção. )

## Arquivos / mudanças

### 1. Calculadora de Água no perfil

- Novo: `src/components/patient/WaterCalculatorCard.tsx` já existe para o paciente (lê `getMyClinicalContext`). Vamos refatorar para aceitar prop opcional `patientId`:
  - Sem prop → usa `getMyClinicalContext` (uso atual no app do paciente, sem regressão).
  - Com `patientId` → usa `getClinicalContext({ patientId })` (uso pelo nutri).
- Embed no `src/routes/_authenticated/patients/$id/index.tsx` logo após `PhysicalAssessmentCard`.

### 2. CTA "Aplicar Protocolo" no perfil

- No mesmo perfil, na toolbar de ações, adicionar Link dourado para `/protocolos?patientId={id}&patientName={nome}`.

### 3. Rotas de protocolo aceitam patientId

- `protocolos.tsx` (layout): `validateSearch` para `patientId?: string`, `patientName?: string`; renderiza banner persistente "Comparando com {Nome}" quando presentes.
- `protocolos.index.tsx`: propaga `patientId/patientName` no `search` de cada `<Link>` para `/protocolos/$protocolId`.
- `protocolos.$protocolId.tsx`:
  - `validateSearch` aceita `patientId`, `patientName` além de `module`.
  - Quando `patientId` presente, renderiza `<ProtocolDiagnosticCard patientId={patientId} />` no topo do detalhe (já é não-bloqueante e mostra sugestões de ajuste).
  - Propaga `patientId/patientName` em todos os links internos (módulo, fase).
  - Na hora de "Aplicar Fase", o `RealPatientPicker` recebe `defaultSelectedId={patientId}` (passa por prop ou um `initialPatient` simples) — se já existe paciente em escopo, o dialog confirma direto com 1 clique.

### 4. Pré-seleção no RealPatientPicker

- Adicionar prop opcional `initialPatientId` e, se presente, pré-popular o estado de seleção interno na abertura. Sem regressão para outros callers.

## Itens fora deste escopo

- Não vou criar uma "Calculadora de Água" separada como rota nova; o card vai direto no perfil.
- Não vou alterar regra de negócio do diagnóstico/comparação — ele já existe (`diagnose.ts` + `ProtocolDiagnosticCard`); só vou exibi-lo no detalhe do protocolo quando há paciente em contexto.
- Não toco em motores clínicos, RLS, migrations.

## Confirmação que peço antes de codar

Só uma: ok manter o **botão "Aplicar Protocolo"** no perfil ao lado dos botões dourados de plano (mesmo padrão visual), e o **banner "Comparando com {Nome}"** fixo no topo das telas de protocolo enquanto o paciente estiver em escopo? Se sim, executo direto. (Perfeito..pode executar.)