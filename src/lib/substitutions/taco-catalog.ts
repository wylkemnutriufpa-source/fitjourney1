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
  // ------ Proteínas de refeição (almoço/jantar) ------
  {
    foodKey: "peito-frango",
    name: "Peito de frango sem pele cru",
    scaleGroup: "protein",
    subGroup: "protein-meal",
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
    subGroup: "protein-meal",
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
    subGroup: "protein-meal",
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
    subGroup: "protein-meal",
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
    subGroup: "protein-meal",
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
    subGroup: "protein-meal",
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
    subGroup: "protein-meal",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 128,
    proteinPer100g: 23,
    carbPer100g: 0,
    fatPer100g: 2.1,
  },

  // ------ Carboidratos de refeição (almoço/jantar) ------
  {
    foodKey: "arroz-branco",
    name: "Arroz branco cozido",
    scaleGroup: "carb",
    subGroup: "carb-meal",
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
    subGroup: "carb-meal",
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
    subGroup: "carb-meal",
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
    subGroup: "carb-meal",
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
    subGroup: "carb-meal",
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
    subGroup: "carb-meal",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 97,
    proteinPer100g: 2.1,
    carbPer100g: 23.2,
    fatPer100g: 0.2,
  },

  // ------ Carboidratos de café/lanche (pão, tapioca, cuscuz) ------
  {
    foodKey: "pao-frances",
    name: "Pão francês",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
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
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 50,
    kcalPer100g: 240,
    proteinPer100g: 0.2,
    carbPer100g: 59,
    fatPer100g: 0,
  },
  {
    foodKey: "pao-integral",
    name: "Pão integral",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 50,
    kcalPer100g: 253,
    proteinPer100g: 9.4,
    carbPer100g: 49.6,
    fatPer100g: 3.6,
  },
  {
    foodKey: "cuscuz-milho",
    name: "Cuscuz de milho cozido",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 113,
    proteinPer100g: 2.2,
    carbPer100g: 25.4,
    fatPer100g: 0.3,
  },
  {
    foodKey: "wrap-rap10",
    name: "Wrap / Rap10 integral",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 40,
    kcalPer100g: 310,
    proteinPer100g: 9,
    carbPer100g: 56,
    fatPer100g: 5,
  },
  {
    foodKey: "bolo-milho",
    name: "Bolo de milho caseiro",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 60,
    kcalPer100g: 285,
    proteinPer100g: 5,
    carbPer100g: 45,
    fatPer100g: 9,
  },
  {
    foodKey: "bolo-macaxeira",
    name: "Bolo de macaxeira caseiro",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 60,
    kcalPer100g: 250,
    proteinPer100g: 3,
    carbPer100g: 42,
    fatPer100g: 7,
  },
  {
    foodKey: "panqueca-banana",
    name: "Panqueca de banana com aveia e ovo",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 80,
    kcalPer100g: 180,
    proteinPer100g: 6,
    carbPer100g: 25,
    fatPer100g: 5,
  },
  {
    foodKey: "aveia-flocos",
    name: "Aveia em flocos",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 30,
    kcalPer100g: 389,
    proteinPer100g: 14,
    carbPer100g: 67,
    fatPer100g: 7,
  },
  // Variantes adicionais (revezamento de fotos/preparações no mesmo grupo)
  {
    foodKey: "wrap-de-frango",
    name: "Wrap integral com frango",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 40,
    kcalPer100g: 310,
    proteinPer100g: 12,
    carbPer100g: 50,
    fatPer100g: 6,
  },
  {
    foodKey: "bolo-de-milho-com-cafe",
    name: "Bolo de milho com café",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 60,
    kcalPer100g: 285,
    proteinPer100g: 5,
    carbPer100g: 45,
    fatPer100g: 9,
  },
  {
    foodKey: "bolo-de-macaxeira-com-cafe",
    name: "Bolo de macaxeira com café",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 60,
    kcalPer100g: 250,
    proteinPer100g: 3,
    carbPer100g: 42,
    fatPer100g: 7,
  },
  {
    foodKey: "panqueca-de-banana",
    name: "Panqueca de banana fit",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 80,
    kcalPer100g: 180,
    proteinPer100g: 6,
    carbPer100g: 25,
    fatPer100g: 5,
  },
  {
    foodKey: "trilha-de-milho",
    name: "Tortilha de milho",
    scaleGroup: "carb",
    subGroup: "carb-breakfast",
    unit: "g",
    defaultQty: 40,
    kcalPer100g: 310,
    proteinPer100g: 7,
    carbPer100g: 60,
    fatPer100g: 4,
  },



  // ------ Proteínas de lanche/café (ovo, queijo, frango desfiado, carne moída) ------
  {
    foodKey: "ovo-galinha",
    name: "Ovo de galinha inteiro cru",
    scaleGroup: "protein",
    subGroup: "protein-snack",
    unit: "g",
    defaultQty: 50,
    kcalPer100g: 143,
    proteinPer100g: 13,
    carbPer100g: 1.6,
    fatPer100g: 8.9,
  },
  {
    foodKey: "queijo-minas",
    name: "Queijo minas frescal",
    scaleGroup: "protein",
    subGroup: "protein-snack",
    unit: "g",
    defaultQty: 30,
    kcalPer100g: 264,
    proteinPer100g: 17.4,
    carbPer100g: 3.2,
    fatPer100g: 20.2,
  },
  {
    foodKey: "ricota",
    name: "Ricota fresca",
    scaleGroup: "protein",
    subGroup: "protein-snack",
    unit: "g",
    defaultQty: 30,
    kcalPer100g: 140,
    proteinPer100g: 12.6,
    carbPer100g: 3,
    fatPer100g: 8.5,
  },
  {
    foodKey: "frango-desfiado",
    name: "Frango desfiado refogado",
    scaleGroup: "protein",
    subGroup: "protein-snack",
    unit: "g",
    defaultQty: 60,
    kcalPer100g: 165,
    proteinPer100g: 31,
    carbPer100g: 0,
    fatPer100g: 3.6,
  },
  {
    foodKey: "carne-moida-refogada",
    name: "Carne moída magra refogada",
    scaleGroup: "protein",
    subGroup: "protein-snack",
    unit: "g",
    defaultQty: 60,
    kcalPer100g: 212,
    proteinPer100g: 27,
    carbPer100g: 0,
    fatPer100g: 11,
  },
  // ------ Frutas (equivalência por energia; porções em g para cálculo linear) ------
  {
    foodKey: "banana",
    name: "Banana prata crua",
    scaleGroup: "fruit",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 98,
    proteinPer100g: 1.3,
    carbPer100g: 26,
    fatPer100g: 0.1,
  },
  {
    foodKey: "maca",
    name: "Maçã crua",
    scaleGroup: "fruit",
    unit: "g",
    defaultQty: 130,
    kcalPer100g: 56,
    proteinPer100g: 0.3,
    carbPer100g: 15.2,
    fatPer100g: 0,
  },
  {
    foodKey: "pera",
    name: "Pera crua",
    scaleGroup: "fruit",
    unit: "g",
    defaultQty: 130,
    kcalPer100g: 53,
    proteinPer100g: 0.4,
    carbPer100g: 14,
    fatPer100g: 0.1,
  },
  {
    foodKey: "laranja",
    name: "Laranja pera crua",
    scaleGroup: "fruit",
    unit: "g",
    defaultQty: 130,
    kcalPer100g: 37,
    proteinPer100g: 1,
    carbPer100g: 8.9,
    fatPer100g: 0.1,
  },
  {
    foodKey: "mamao",
    name: "Mamão papaia cru",
    scaleGroup: "fruit",
    unit: "g",
    defaultQty: 150,
    kcalPer100g: 45,
    proteinPer100g: 0.8,
    carbPer100g: 11.6,
    fatPer100g: 0.1,
  },
  {
    foodKey: "manga",
    name: "Manga crua",
    scaleGroup: "fruit",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 65,
    proteinPer100g: 0.4,
    carbPer100g: 16.7,
    fatPer100g: 0.3,
  },
  {
    foodKey: "abacaxi",
    name: "Abacaxi cru",
    scaleGroup: "fruit",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 48,
    proteinPer100g: 0.9,
    carbPer100g: 12.3,
    fatPer100g: 0.1,
  },
  {
    foodKey: "uva",
    name: "Uva crua",
    scaleGroup: "fruit",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 53,
    proteinPer100g: 0.7,
    carbPer100g: 13.6,
    fatPer100g: 0.2,
  },
  {
    foodKey: "morango",
    name: "Morango cru",
    scaleGroup: "fruit",
    unit: "g",
    defaultQty: 100,
    kcalPer100g: 30,
    proteinPer100g: 0.9,
    carbPer100g: 6.8,
    fatPer100g: 0.3,
  },
  // ------ Lipídios — cocção/finalização (NÃO combinam com fruta/pão) ------
  {
    foodKey: "azeite-oliva",
    name: "Azeite de oliva",
    scaleGroup: "fat",
    subGroup: "fat-cooking",
    unit: "ml",
    defaultQty: 10,
    kcalPer100g: 884,
    proteinPer100g: 0,
    carbPer100g: 0,
    fatPer100g: 100,
  },
  {
    foodKey: "manteiga",
    name: "Manteiga com sal",
    scaleGroup: "fat",
    subGroup: "fat-cooking",
    unit: "g",
    defaultQty: 10,
    kcalPer100g: 717,
    proteinPer100g: 0.9,
    carbPer100g: 0.1,
    fatPer100g: 81.1,
  },
  // ------ Lipídios — spread/lanche (combinam com fruta/pão) ------
  {
    foodKey: "abacate",
    name: "Abacate cru",
    scaleGroup: "fat",
    subGroup: "fat-spread",
    unit: "g",
    defaultQty: 80,
    kcalPer100g: 160,
    proteinPer100g: 2,
    carbPer100g: 8.5,
    fatPer100g: 14.7,
  },
  {
    foodKey: "castanha-para",
    name: "Castanha-do-pará",
    scaleGroup: "fat",
    subGroup: "fat-spread",
    unit: "g",
    defaultQty: 15,
    kcalPer100g: 656,
    proteinPer100g: 14.3,
    carbPer100g: 12.3,
    fatPer100g: 66.4,
  },
  {
    foodKey: "pasta-amendoim",
    name: "Pasta de amendoim integral",
    scaleGroup: "fat",
    subGroup: "fat-spread",
    unit: "g",
    defaultQty: 15,
    kcalPer100g: 588,
    proteinPer100g: 25.1,
    carbPer100g: 20,
    fatPer100g: 50.4,
  },
  {
    foodKey: "amendoim-graos",
    name: "Amendoim grãos torrado sem sal",
    scaleGroup: "fat",
    subGroup: "fat-spread",
    unit: "g",
    defaultQty: 15,
    kcalPer100g: 544,
    proteinPer100g: 22.5,
    carbPer100g: 20.3,
    fatPer100g: 43.9,
  },
  // ------ Bebidas ------
  {
    foodKey: "cafe-com-leite",
    name: "Café com leite",
    scaleGroup: "beverage",
    unit: "ml",
    defaultQty: 200,
    kcalPer100g: 43,
    proteinPer100g: 2.2,
    carbPer100g: 4.5,
    fatPer100g: 1.7,
  },
  {
    foodKey: "suco-laranja-natural",
    name: "Suco de laranja natural",
    scaleGroup: "beverage",
    unit: "ml",
    defaultQty: 200,
    kcalPer100g: 44,
    proteinPer100g: 0.7,
    carbPer100g: 10.4,
    fatPer100g: 0.2,
  },
  {
    foodKey: "suco-uva-integral",
    name: "Suco de uva integral",
    scaleGroup: "beverage",
    unit: "ml",
    defaultQty: 200,
    kcalPer100g: 61,
    proteinPer100g: 0.4,
    carbPer100g: 14.8,
    fatPer100g: 0.1,
  },
  {
    foodKey: "suco-maracuja-natural",
    name: "Suco de maracujá natural",
    scaleGroup: "beverage",
    unit: "ml",
    defaultQty: 200,
    kcalPer100g: 53,
    proteinPer100g: 0.4,
    carbPer100g: 13.6,
    fatPer100g: 0.1,
  },
  // ------ Doces ------
  {
    foodKey: "goiabada",
    name: "Goiabada cascão",
    scaleGroup: "mixed",
    unit: "g",
    defaultQty: 30,
    kcalPer100g: 290,
    proteinPer100g: 0.5,
    carbPer100g: 72,
    fatPer100g: 0.1,
  },
  {
    foodKey: "doce-leite",
    name: "Doce de leite pastoso",
    scaleGroup: "mixed",
    unit: "g",
    defaultQty: 30,
    kcalPer100g: 315,
    proteinPer100g: 6.8,
    carbPer100g: 64,
    fatPer100g: 4,
  },
  {
    foodKey: "chocolate-100-cacau",
    name: "Chocolate 100% cacau",
    scaleGroup: "mixed",
    unit: "g",
    defaultQty: 20,
    kcalPer100g: 550,
    proteinPer100g: 14,
    carbPer100g: 23,
    fatPer100g: 46,
  },
  // Salmão removido deliberadamente: o usuário pediu evitar promover salmão
  // (caro/inviável para a maioria) — usar o termo genérico "peixe" coberto
  // por merluza, tilápia e atum já presentes no catálogo.

  // ------ Protocolo de Caldos (receitas) ------
  // Pratos compostos (não substituíveis isoladamente — scaleGroup 'mixed').
  // Macros médias por 100 ml de caldo pronto.
  { foodKey: "caldo-frango-legumes",     name: "Caldo de frango com legumes (receita)",            scaleGroup: "mixed", unit: "ml", defaultQty: 300, kcalPer100g: 45, proteinPer100g: 4.5, carbPer100g: 3.0,  fatPer100g: 1.5 },
  { foodKey: "caldo-abobora-gengibre",   name: "Caldo de abóbora com gengibre (receita)",          scaleGroup: "mixed", unit: "ml", defaultQty: 300, kcalPer100g: 55, proteinPer100g: 1.2, carbPer100g: 9.0,  fatPer100g: 1.5 },
  { foodKey: "caldo-feijao-couve",       name: "Caldo de feijão com couve (receita)",              scaleGroup: "mixed", unit: "ml", defaultQty: 300, kcalPer100g: 80, proteinPer100g: 4.5, carbPer100g: 11.0, fatPer100g: 1.8 },
  { foodKey: "caldo-peixe-acafrao",      name: "Caldo de peixe branco com açafrão (receita)",      scaleGroup: "mixed", unit: "ml", defaultQty: 300, kcalPer100g: 50, proteinPer100g: 6.0, carbPer100g: 2.5,  fatPer100g: 1.2 },
  { foodKey: "caldo-carne-mandioquinha", name: "Caldo de carne magra com mandioquinha (receita)",  scaleGroup: "mixed", unit: "ml", defaultQty: 300, kcalPer100g: 70, proteinPer100g: 5.5, carbPer100g: 7.0,  fatPer100g: 2.0 },
  { foodKey: "caldo-verde-portugues",    name: "Caldo verde leve (couve + batata + frango)",       scaleGroup: "mixed", unit: "ml", defaultQty: 300, kcalPer100g: 65, proteinPer100g: 3.5, carbPer100g: 9.5,  fatPer100g: 1.6 },
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
 * Aliases de foodKeys legados (templates antigos e smart-seeds) → foodKey canônico
 * do catálogo TACO. Não muda regras estruturais: apenas garante que o motor de
 * substituições encontre a âncora correta para itens cujo `foodKey` foi escrito
 * como nome composto ("omelete", "peixe-com-legumes") em vez do ingrediente base.
 */
const FOODKEY_ALIASES: Record<string, string> = {
  // Ovo (variações de preparo da mesma proteína)
  omelete: "ovo-galinha",
  "ovos-mexidos": "ovo-galinha",
  "ovos-cozidos": "ovo-galinha",
  "ovos-com-bacon": "ovo-galinha",
  "panqueca-proteica": "ovo-galinha",
  // Tapioca (recheios variam, base é a mesma)
  crepioca: "tapioca",
  "tapioca-com-queijo": "tapioca",
  // Aveia / banana / frutas
  "mingau-de-aveia": "aveia-flocos",
  "banana-com-aveia": "banana",
  "vitamina-de-fruta": "banana",
  "frutas-vermelhas": "morango",
  "smoff-de-frutas": "morango",
  // Carbos compostos
  "macarronada-de-camarao": "macarrao-espaguete",
  "torrada-integral": "pao-integral",
  "pao-de-queijo": "pao-frances",
  "pupunha-com-cafe": "macaxeira",
  // Proteínas (corte/preparo da mesma família)
  "peixe-com-legumes": "tilapia-file",
  picanha: "contrafile-bovino",
  acem: "patinho-bovino",
};

/**
 * Versão pura: resolve um item para o candidato correspondente dentro de
 * uma lista de candidatos fornecida (ex: catálogo carregado do Cloud).
 * Sprint 6 A.4.3.
 */
export function findCandidateIn(
  candidates: readonly EquivalentCandidate[],
  input: { foodKey?: string; name: string; scaleGroup?: string },
): EquivalentCandidate | null {
  const groupOk = (c: EquivalentCandidate) => !input.scaleGroup || c.scaleGroup === input.scaleGroup;
  if (input.foodKey) {
    const hit = candidates.find((c) => c.foodKey === input.foodKey && groupOk(c));
    if (hit) return hit;
    const aliased = FOODKEY_ALIASES[input.foodKey];
    if (aliased) {
      const aliasHit = candidates.find((c) => c.foodKey === aliased && groupOk(c));
      if (aliasHit) return aliasHit;
    }
  }
  const norm = normalizeTacoName(input.name);
  if (!norm) return null;
  // 1) match exato normalizado
  const exact = candidates.find((c) => groupOk(c) && normalizeTacoName(c.name) === norm);
  if (exact) return exact;
  // 2) substring por primeira palavra (≥ 4 chars) — heurística antiga
  for (const c of candidates) {
    if (!groupOk(c)) continue;
    const candNorm = normalizeTacoName(c.name);
    const firstWord = candNorm.split(" ")[0];
    if (firstWord.length >= 4 && norm.includes(firstWord)) return c;
  }
  // 3) Fuzzy por sobreposição de tokens. Ex.: "ovos mexitos" casa com
  // "ovo de galinha mexido". Tokens significativos = ≥3 chars (descarta "de",
  // "da"). Dois tokens casam se: stems iguais OU compartilham prefixo ≥4 chars
  // (cobre plural, sufixos verbais "mexit"/"mexid", "frita"/"frito").
  // Exigimos score ≥ 2 para evitar match espúrio por uma palavra genérica
  // (ex.: "natural" casando "iogurte natural" com "suco de laranja natural").
  const inputTokens = norm.split(" ").filter((t) => t.length >= 3);
  if (inputTokens.length === 0) return null;
  const stem = (t: string) => t.replace(/(oes|aes|ais|eis|ois|uis|ns|s|es)$/u, "");
  const tokenMatch = (a: string, b: string) => {
    if (stem(a) === stem(b)) return true;
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i >= 4;
  };
  let best: { c: EquivalentCandidate; score: number } | null = null;
  for (const c of candidates) {
    if (!groupOk(c)) continue;
    const candTokens = normalizeTacoName(c.name).split(" ").filter((t) => t.length >= 3);
    if (candTokens.length === 0) continue;
    let score = 0;
    for (const t of inputTokens) {
      if (candTokens.some((ct) => tokenMatch(t, ct))) score += 1;
    }
    if (score >= 2 && (!best || score > best.score)) best = { c, score };
  }
  return best ? best.c : null;
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

