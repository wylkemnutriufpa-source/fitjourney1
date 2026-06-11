// Motor de diagnóstico — PURO. Sem IO, sem React, sem rede.
// Recebe respostas + gatilhos e devolve diagnóstico montado.

export type Sexo = "masculino" | "feminino" | "outro";

export interface QuizAnswers {
  nome: string;
  idade: number;
  sexo: Sexo;
  peso: number;
  altura: number; // cm
  objetivo: string;
  refeicoesPorDia: "menos_3" | "3a4" | "5_mais";
  aguaPorDia: "menos_1l" | "1a1_5l" | "2l" | "mais_2_5l";
  atividadeFisica: "sedentario" | "leve" | "moderado" | "intenso";
  sono: "menos_6h" | "6a7h" | "7a8h" | "mais_8h";
  condicoes: string[]; // slugs
  queixas: string[]; // slugs
}

export interface TriggerRow {
  slug: string;
  nome: string;
  prioridade: number;
  ativo: boolean;
  frases: string[];
  dicas?: string[];
}

export interface DicaDetalhada {
  slug: string;
  nome: string;
  frase: string;
  dica: string | null;
}

export interface Diagnosis {
  saudacao: string;
  analisePeso: string;
  imc: number;
  pesoIdeal: number;
  diferencaKg: number;
  classificacaoImc: "baixo" | "ideal" | "sobrepeso" | "obesidade";
  dicas: string[];
  dicasDetalhadas: DicaDetalhada[];
  triggersAcionados: string[];
  cta: string;
}

// IMC clássico
export function calcularImc(pesoKg: number, alturaCm: number): number {
  if (!pesoKg || !alturaCm) return 0;
  const m = alturaCm / 100;
  return pesoKg / (m * m);
}

// Peso ideal — fórmula de Lorentz adaptada
export function pesoIdealLorentz(alturaCm: number, sexo: Sexo): number {
  if (!alturaCm) return 0;
  const divisor = sexo === "feminino" ? 2.5 : 4;
  return alturaCm - 100 - (alturaCm - 150) / divisor;
}

export function classificarImc(imc: number): Diagnosis["classificacaoImc"] {
  if (imc < 18.5) return "baixo";
  if (imc < 25) return "ideal";
  if (imc < 30) return "sobrepeso";
  return "obesidade";
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function applyVars(frase: string, vars: Record<string, string>): string {
  return frase.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function gerarDiagnostico(
  answers: QuizAnswers,
  triggers: TriggerRow[],
  rng: () => number = Math.random,
): Diagnosis {
  const imc = calcularImc(answers.peso, answers.altura);
  const pesoIdeal = pesoIdealLorentz(answers.altura, answers.sexo);
  const diferencaKg = Number((answers.peso - pesoIdeal).toFixed(1));
  const classificacao = classificarImc(imc);

  const ativos = triggers.filter((t) => t.ativo && t.frases.length > 0);
  const byslug = (s: string) => ativos.find((t) => t.slug === s);

  const acionados: string[] = [];

  // IMC sempre dispara um
  const imcSlug =
    classificacao === "sobrepeso" || classificacao === "obesidade"
      ? "imc_sobrepeso"
      : classificacao === "baixo"
        ? "imc_abaixo"
        : "imc_ideal";
  if (byslug(imcSlug)) acionados.push(imcSlug);

  const matriz: Array<[string, boolean]> = [
    ["agua_baixa", answers.aguaPorDia === "menos_1l" || answers.aguaPorDia === "1a1_5l"],
    ["hipertensao", answers.condicoes.includes("hipertensao")],
    ["diabetes", answers.condicoes.includes("diabetes")],
    ["tireoide", answers.condicoes.includes("tireoide")],
    ["sop_insulina", answers.condicoes.includes("sop")],
    ["gastrite_refluxo", answers.condicoes.includes("gastrite_refluxo")],
    [
      "intestino_inchaco",
      answers.condicoes.includes("intestino") || answers.queixas.includes("inchaco"),
    ],
    [
      "compulsao",
      answers.condicoes.includes("compulsao") || answers.queixas.includes("compulsao"),
    ],
    ["energia_baixa", answers.queixas.includes("cansaco")],
    ["sedentarismo", answers.atividadeFisica === "sedentario"],
    ["sono_ruim", answers.sono === "menos_6h" || answers.sono === "6a7h"],
    ["refeicoes_poucas", answers.refeicoesPorDia === "menos_3"],
    ["objetivo_emagrecer", answers.objetivo === "emagrecer"],
    ["objetivo_ganhar_massa", answers.objetivo === "ganhar_massa"],
    ["objetivo_energia", answers.objetivo === "energia"],
  ];

  for (const [slug, ativou] of matriz) {
    if (ativou && byslug(slug)) acionados.push(slug);
  }

  // Ordena por prioridade e limita
  const ordenados = acionados
    .map((slug) => byslug(slug)!)
    .sort((a, b) => b.prioridade - a.prioridade)
    .slice(0, 5);

  const vars = {
    diferencaKg: Math.abs(diferencaKg).toString().replace(".", ","),
    imc: imc.toFixed(1).replace(".", ","),
    nome: answers.nome.split(" ")[0],
  };

  const dicas = ordenados
    .filter((t) => t.slug !== imcSlug)
    .map((t) => applyVars(pick(t.frases, rng), vars));

  const imcTrigger = byslug(imcSlug);
  const analisePeso = imcTrigger
    ? applyVars(pick(imcTrigger.frases, rng), vars)
    : `Seu IMC é ${vars.imc}.`;

  const primeiroNome = answers.nome.trim().split(" ")[0] || "tudo bem";

  return {
    saudacao: `Olá ${primeiroNome}! Analisamos seu perfil com o método clínico FitJourney.`,
    analisePeso,
    imc: Number(imc.toFixed(2)),
    pesoIdeal: Number(pesoIdeal.toFixed(1)),
    diferencaKg,
    classificacaoImc: classificacao,
    dicas,
    triggersAcionados: ordenados.map((t) => t.slug),
    cta: "Pronto para destravar de verdade? Tenha um plano clínico completo, revisado por um nutricionista e acompanhamento no app FitJourney.",
  };
}
