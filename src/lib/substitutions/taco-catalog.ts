// Catálogo TACO seed — Sprint 6 A.2.
//
// Fonte: Tabela Brasileira de Composição de Alimentos (TACO 4ª ed. UNICAMP/NEPA).
// Importado da planilha "Substituicoes_Inteligentes_Nutricao_App.xlsx" enviada
// pelo usuário (aba Alimentos_TACO).
//
// Cada item é um EquivalentCandidate consumível por `calculateEquivalents`.
// `scaleGroup` é o eixo de filtragem — só substituímos dentro do mesmo grupo.

import type { EquivalentCandidate } from "./equivalents";

/**
 * scaleGroup do app:
 *   protein  → carnes/peixes/ovos
 *   carb     → arroz/massas/raízes/pães
 *   dairy/fruit/fat/vegetable/beverage/mixed → tratados como "energy" no cálculo.
 */
export const tacoCatalog: readonly EquivalentCandidate[] = [
  // ------ Proteínas (carnes, aves, peixes) ------
  {
    foodKey: "peito-frango",
    name: "Peito de frango sem pele cru",
    scaleGroup: "protein",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 119,
    proteinPer100g: 21.5,
    carbPer100g: 0,
    fatPer100g: 3,
  },
  {
    foodKey: "patinho-bovino",
    name: "Patinho bovino sem gordura cru",
    scaleGroup: "protein",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 136,
    proteinPer100g: 21.9,
    carbPer100g: 0,
    fatPer100g: 4.9,
  },
  {
    foodKey: "contrafile-bovino",
    name: "Contrafilé bovino sem gordura cru",
    scaleGroup: "protein",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 150,
    proteinPer100g: 22,
    carbPer100g: 0,
    fatPer100g: 6,
  },
  {
    foodKey: "lombo-suino",
    name: "Lombo suíno cru",
    scaleGroup: "protein",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 145,
    proteinPer100g: 21.3,
    carbPer100g: 0,
    fatPer100g: 5.7,
  },
  {
    foodKey: "merluza-file",
    name: "Filé de merluza cru",
    scaleGroup: "protein",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 82,
    proteinPer100g: 17,
    carbPer100g: 0,
    fatPer100g: 0.7,
  },
  {
    foodKey: "tilapia-file",
    name: "Tilápia filé cru",
    scaleGroup: "protein",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 96,
    proteinPer100g: 20.1,
    carbPer100g: 0,
    fatPer100g: 1.7,
  },
  {
    foodKey: "atum-fresco",
    name: "Atum fresco cru",
    scaleGroup: "protein",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 128,
    proteinPer100g: 23,
    carbPer100g: 0,
    fatPer100g: 2.1,
  },

  // ------ Carboidratos de refeição ------
  {
    foodKey: "arroz-branco",
    name: "Arroz branco cozido",
    scaleGroup: "carb",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 130,
    proteinPer100g: 2.7,
    carbPer100g: 28.1,
    fatPer100g: 0.3,
  },
  {
    foodKey: "macarrao-espaguete",
    name: "Macarrão (espaguete) cozido",
    scaleGroup: "carb",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 158,
    proteinPer100g: 5,
    carbPer100g: 30.5,
    fatPer100g: 0.9,
  },
  {
    foodKey: "pure-batata",
    name: "Purê de batata cozido",
    scaleGroup: "carb",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 90,
    proteinPer100g: 2,
    carbPer100g: 18,
    fatPer100g: 1.5,
  },
  {
    foodKey: "macaxeira",
    name: "Macaxeira (mandioca) cozida",
    scaleGroup: "carb",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 160,
    proteinPer100g: 1.5,
    carbPer100g: 38,
    fatPer100g: 0.3,
  },
  {
    foodKey: "batata-doce",
    name: "Batata doce cozida",
    scaleGroup: "carb",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 77,
    proteinPer100g: 0.6,
    carbPer100g: 18.4,
    fatPer100g: 0.1,
  },
  {
    foodKey: "inhame",
    name: "Inhame cozido",
    scaleGroup: "carb",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 97,
    proteinPer100g: 2.1,
    carbPer100g: 23.2,
    fatPer100g: 0.2,
  },
  {
    foodKey: "pao-frances",
    name: "Pão francês",
    scaleGroup: "carb",
    unit: "g",
    defaultQty: 50,
    kcalPer100g: 300,
    proteinPer100g: 8,
    carbPer100g: 58.6,
    fatPer100g: 3.1,
  },
  {
    foodKey: "tapioca",
    name: "Tapioca (goma hidratada)",
    scaleGroup: "carb",
    unit: "g",
    defaultQty: 50,
    kcalPer100g: 240,
    proteinPer100g: 0.2,
    carbPer100g: 59,
    fatPer100g: 0,
  },

  // ------ Proteínas adicionais (ovo, leguminosas, ricota) ------
  {
    foodKey: "ovo-galinha",
    name: "Ovo de galinha inteiro cru",
    scaleGroup: "protein",
    unit: "g",
    defaultQty: 50,
    kcalPer100g: 143,
    proteinPer100g: 13,
    carbPer100g: 1.6,
    fatPer100g: 8.9,
  },
  // Salmão removido deliberadamente: o usuário pediu evitar promover salmão
  // (caro/inviável para a maioria) — usar o termo genérico "peixe" coberto
  // por merluza, tilápia e atum já presentes no catálogo.
];

/** Normaliza nome/foodKey para casamento aproximado. */
export function normalizeTacoName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const indexByFoodKey = new Map<string, EquivalentCandidate>();
const indexByNormalizedName = new Map<string, EquivalentCandidate>();
for (const c of tacoCatalog) {
  indexByFoodKey.set(c.foodKey, c);
  indexByNormalizedName.set(normalizeTacoName(c.name), c);
}

/**
 * Versão pura: resolve um item para o candidato correspondente dentro de
 * uma lista de candidatos fornecida (ex: catálogo carregado do Cloud).
 * Sprint 6 A.4.3.
 */
export function findCandidateIn(
  candidates: readonly EquivalentCandidate[],
  input: { foodKey?: string; name: string },
): EquivalentCandidate | null {
  if (input.foodKey) {
    const hit = candidates.find((c) => c.foodKey === input.foodKey);
    if (hit) return hit;
  }
  const norm = normalizeTacoName(input.name);
  if (!norm) return null;
  const exact = candidates.find((c) => normalizeTacoName(c.name) === norm);
  if (exact) return exact;
  for (const c of candidates) {
    const candNorm = normalizeTacoName(c.name);
    const firstWord = candNorm.split(" ")[0];
    if (firstWord.length >= 4 && norm.includes(firstWord)) return c;
  }
  return null;
}

/**
 * Atalho que resolve contra o seed embutido (`tacoCatalog`).
 * Mantido para retrocompatibilidade com chamadas que não recebem a lista.
 */
export function findTacoCandidate(input: {
  foodKey?: string;
  name: string;
}): EquivalentCandidate | null {
  if (input.foodKey) {
    const hit = indexByFoodKey.get(input.foodKey);
    if (hit) return hit;
  }
  const norm = normalizeTacoName(input.name);
  if (!norm) return null;
  const exact = indexByNormalizedName.get(norm);
  if (exact) return exact;
  for (const c of tacoCatalog) {
    const candNorm = normalizeTacoName(c.name);
    const firstWord = candNorm.split(" ")[0];
    if (firstWord.length >= 4 && norm.includes(firstWord)) return c;
  }
  return null;
}

