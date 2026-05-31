// Labels Pt-BR para os campos de feedback.
// Centralizado para garantir consistência entre paciente e nutricionista.

export type AdherenceRating =
  | "muito_dificil"
  | "dificil"
  | "neutro"
  | "facil"
  | "muito_facil";

export type ResultRating = "piores" | "abaixo" | "dentro" | "acima";

export const ADHERENCE_OPTIONS: ReadonlyArray<{
  value: AdherenceRating;
  label: string;
  short: string;
}> = [
  { value: "muito_dificil", label: "Muito difícil", short: "Mt. difícil" },
  { value: "dificil", label: "Difícil", short: "Difícil" },
  { value: "neutro", label: "Neutro", short: "Neutro" },
  { value: "facil", label: "Fácil", short: "Fácil" },
  { value: "muito_facil", label: "Muito fácil", short: "Mt. fácil" },
];

export const RESULT_OPTIONS: ReadonlyArray<{
  value: ResultRating;
  label: string;
  short: string;
}> = [
  { value: "piores", label: "Piores que esperado", short: "Piores" },
  { value: "abaixo", label: "Abaixo do esperado", short: "Abaixo" },
  { value: "dentro", label: "Dentro do esperado", short: "Dentro" },
  { value: "acima", label: "Acima do esperado", short: "Acima" },
];

export function adherenceLabel(v: AdherenceRating): string {
  return ADHERENCE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

export function resultLabel(v: ResultRating | null | undefined): string {
  if (!v) return "—";
  return RESULT_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

// IMC = peso(kg) / altura(m)^2
export function computeImc(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
): number | null {
  if (!weightKg || !heightCm) return null;
  const h = Number(heightCm) / 100;
  if (h <= 0) return null;
  const imc = Number(weightKg) / (h * h);
  if (!Number.isFinite(imc)) return null;
  return Math.round(imc * 10) / 10;
}
