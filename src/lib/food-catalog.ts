// Banco categorizado de alimentos (picker "+ alimento").
// Cada item conhece sua porção padrão, unidade, kcal e scaleGroup.
import type { ScaleGroup } from "./meal-planner";

export type FoodCategory =
  | "Proteínas"
  | "Carboidratos"
  | "Grãos"
  | "Sementes"
  | "Frutas"
  | "Saladas"
  | "Vegetais"
  | "Laticínios"
  | "Gorduras"
  | "Bebidas"
  | "Gerais";

export type CatalogFood = {
  foodKey: string;        // chave da imagem (pode não existir; ignorado em FoodItemRow)
  name: string;
  qty: number;
  unit: string;
  kcal: number;
  scaleGroup: ScaleGroup;
};

export const foodCatalog: Record<FoodCategory, CatalogFood[]> = {
  Proteínas: [
    { foodKey: "frango-grelhado", name: "Frango grelhado", qty: 120, unit: "g", kcal: 198, scaleGroup: "protein" },
    { foodKey: "file-de-tilapia", name: "Filé de tilápia", qty: 150, unit: "g", kcal: 180, scaleGroup: "protein" },
    { foodKey: "bife-acebolado", name: "Bife acebolado", qty: 120, unit: "g", kcal: 240, scaleGroup: "protein" },
    { foodKey: "carne-grelhada", name: "Carne grelhada", qty: 120, unit: "g", kcal: 240, scaleGroup: "protein" },
    { foodKey: "acem", name: "Acém cozido", qty: 120, unit: "g", kcal: 215, scaleGroup: "protein" },
    { foodKey: "picanha", name: "Picanha", qty: 120, unit: "g", kcal: 290, scaleGroup: "protein" },
    { foodKey: "lombo-suino", name: "Lombo suíno", qty: 120, unit: "g", kcal: 210, scaleGroup: "protein" },
    { foodKey: "coxa-e-sobrecoxa", name: "Coxa e sobrecoxa", qty: 130, unit: "g", kcal: 260, scaleGroup: "protein" },
    { foodKey: "ovos-cozidos", name: "Ovo cozido", qty: 2, unit: "unid", kcal: 156, scaleGroup: "protein" },
    { foodKey: "omelete", name: "Omelete", qty: 1, unit: "unid", kcal: 165, scaleGroup: "protein" },
    { foodKey: "iogurte-natural", name: "Whey protein", qty: 30, unit: "g", kcal: 120, scaleGroup: "protein" },
  ],
  Carboidratos: [
    { foodKey: "pao-com-ovo", name: "Pão francês", qty: 1, unit: "unid", kcal: 140, scaleGroup: "carb" },
    { foodKey: "torrada-integral", name: "Torrada integral", qty: 2, unit: "unid", kcal: 70, scaleGroup: "carb" },
    { foodKey: "tapioca-com-ovo", name: "Goma de tapioca", qty: 50, unit: "g", kcal: 115, scaleGroup: "carb" },
    { foodKey: "cuscuz-com-ovo", name: "Cuscuz de milho", qty: 120, unit: "g", kcal: 135, scaleGroup: "carb" },
    { foodKey: "frango-com-batata-doce", name: "Batata doce", qty: 100, unit: "g", kcal: 86, scaleGroup: "carb" },
    { foodKey: "carne-com-batata", name: "Batata inglesa", qty: 100, unit: "g", kcal: 78, scaleGroup: "carb" },
    { foodKey: "macaxeira-com-cafe", name: "Macaxeira cozida", qty: 100, unit: "g", kcal: 125, scaleGroup: "carb" },
    { foodKey: "pupunha-com-cafe", name: "Pupunha", qty: 100, unit: "g", kcal: 121, scaleGroup: "carb" },
    { foodKey: "macarrao-com-carne-moida", name: "Macarrão cozido", qty: 120, unit: "g", kcal: 188, scaleGroup: "carb" },
    { foodKey: "milho-cozido", name: "Milho cozido", qty: 100, unit: "g", kcal: 96, scaleGroup: "carb" },
    { foodKey: "pao-de-queijo", name: "Pão de queijo", qty: 2, unit: "unid", kcal: 180, scaleGroup: "carb" },
  ],
  Grãos: [
    { foodKey: "macarrao-com-carne-moida", name: "Arroz branco cozido", qty: 100, unit: "g", kcal: 128, scaleGroup: "carb" },
    { foodKey: "macarrao-com-carne-moida", name: "Arroz integral cozido", qty: 100, unit: "g", kcal: 124, scaleGroup: "carb" },
    { foodKey: "macarrao-com-carne-moida", name: "Feijão cozido", qty: 80, unit: "g", kcal: 60, scaleGroup: "protein" },
    { foodKey: "macarrao-com-carne-moida", name: "Lentilha cozida", qty: 80, unit: "g", kcal: 92, scaleGroup: "protein" },
    { foodKey: "macarrao-com-carne-moida", name: "Grão-de-bico", qty: 80, unit: "g", kcal: 130, scaleGroup: "protein" },
    { foodKey: "mingau-de-aveia", name: "Aveia em flocos", qty: 30, unit: "g", kcal: 116, scaleGroup: "carb" },
    { foodKey: "iogurte-com-ganola", name: "Granola", qty: 30, unit: "g", kcal: 130, scaleGroup: "carb" },
    { foodKey: "macarrao-com-carne-moida", name: "Quinoa cozida", qty: 80, unit: "g", kcal: 96, scaleGroup: "carb" },
  ],
  Sementes: [
    { foodKey: "mingau-de-aveia", name: "Chia", qty: 10, unit: "g", kcal: 49, scaleGroup: "fat" },
    { foodKey: "mingau-de-aveia", name: "Linhaça", qty: 10, unit: "g", kcal: 53, scaleGroup: "fat" },
    { foodKey: "mingau-de-aveia", name: "Castanha-do-pará", qty: 15, unit: "g", kcal: 99, scaleGroup: "fat" },
    { foodKey: "mingau-de-aveia", name: "Amêndoas", qty: 15, unit: "g", kcal: 90, scaleGroup: "fat" },
    { foodKey: "mingau-de-aveia", name: "Nozes", qty: 15, unit: "g", kcal: 98, scaleGroup: "fat" },
    { foodKey: "mingau-de-aveia", name: "Pasta de amendoim", qty: 15, unit: "g", kcal: 95, scaleGroup: "fat" },
  ],
  Frutas: [
    { foodKey: "maca", name: "Maçã", qty: 1, unit: "unid", kcal: 72, scaleGroup: "fruit" },
    { foodKey: "banana-com-aveia", name: "Banana", qty: 1, unit: "unid", kcal: 90, scaleGroup: "fruit" },
    { foodKey: "mamao", name: "Mamão", qty: 150, unit: "g", kcal: 60, scaleGroup: "fruit" },
    { foodKey: "manga", name: "Manga", qty: 150, unit: "g", kcal: 90, scaleGroup: "fruit" },
    { foodKey: "melancia", name: "Melancia", qty: 200, unit: "g", kcal: 60, scaleGroup: "fruit" },
    { foodKey: "melao", name: "Melão", qty: 200, unit: "g", kcal: 68, scaleGroup: "fruit" },
    { foodKey: "abacaxi", name: "Abacaxi", qty: 150, unit: "g", kcal: 75, scaleGroup: "fruit" },
    { foodKey: "laranja", name: "Laranja", qty: 1, unit: "unid", kcal: 62, scaleGroup: "fruit" },
    { foodKey: "pera", name: "Pera", qty: 1, unit: "unid", kcal: 80, scaleGroup: "fruit" },
    { foodKey: "uva", name: "Uva", qty: 100, unit: "g", kcal: 69, scaleGroup: "fruit" },
    { foodKey: "morango", name: "Morango", qty: 150, unit: "g", kcal: 48, scaleGroup: "fruit" },
    { foodKey: "goiaba", name: "Goiaba", qty: 1, unit: "unid", kcal: 68, scaleGroup: "fruit" },
    { foodKey: "frutas-vermelhas", name: "Frutas vermelhas", qty: 120, unit: "g", kcal: 58, scaleGroup: "fruit" },
  ],
  Saladas: [
    { foodKey: "salada-completa", name: "Salada verde (livre)", qty: 1, unit: "à vontade", kcal: 30, scaleGroup: "vegetable" },
    { foodKey: "salada-completa", name: "Alface", qty: 50, unit: "g", kcal: 8, scaleGroup: "vegetable" },
    { foodKey: "salada-completa", name: "Rúcula", qty: 50, unit: "g", kcal: 13, scaleGroup: "vegetable" },
    { foodKey: "salada-completa", name: "Tomate", qty: 80, unit: "g", kcal: 14, scaleGroup: "vegetable" },
    { foodKey: "salada-completa", name: "Pepino", qty: 80, unit: "g", kcal: 12, scaleGroup: "vegetable" },
    { foodKey: "salada-completa", name: "Cenoura ralada", qty: 60, unit: "g", kcal: 25, scaleGroup: "vegetable" },
    { foodKey: "salada-completa", name: "Beterraba cozida", qty: 60, unit: "g", kcal: 26, scaleGroup: "vegetable" },
    { foodKey: "salada-completa", name: "Azeite extravirgem", qty: 5, unit: "ml", kcal: 45, scaleGroup: "fat" },
  ],
  Vegetais: [
    { foodKey: "peixe-com-legumes", name: "Brócolis cozido", qty: 80, unit: "g", kcal: 27, scaleGroup: "vegetable" },
    { foodKey: "peixe-com-legumes", name: "Couve-flor", qty: 80, unit: "g", kcal: 20, scaleGroup: "vegetable" },
    { foodKey: "peixe-com-legumes", name: "Abobrinha", qty: 100, unit: "g", kcal: 17, scaleGroup: "vegetable" },
    { foodKey: "peixe-com-legumes", name: "Berinjela", qty: 100, unit: "g", kcal: 24, scaleGroup: "vegetable" },
    { foodKey: "peixe-com-legumes", name: "Espinafre refogado", qty: 80, unit: "g", kcal: 18, scaleGroup: "vegetable" },
    { foodKey: "peixe-com-legumes", name: "Vagem", qty: 80, unit: "g", kcal: 25, scaleGroup: "vegetable" },
    { foodKey: "peixe-com-legumes", name: "Chuchu cozido", qty: 100, unit: "g", kcal: 19, scaleGroup: "vegetable" },
    { foodKey: "peixe-com-legumes", name: "Legumes mistos", qty: 100, unit: "g", kcal: 40, scaleGroup: "vegetable" },
  ],
  Laticínios: [
    { foodKey: "iogurte-natural", name: "Iogurte natural", qty: 170, unit: "g", kcal: 105, scaleGroup: "dairy" },
    { foodKey: "copo-de-leite-morno", name: "Leite", qty: 200, unit: "ml", kcal: 112, scaleGroup: "dairy" },
    { foodKey: "pao-com-queijo", name: "Queijo branco", qty: 30, unit: "g", kcal: 75, scaleGroup: "dairy" },
    { foodKey: "pao-com-queijo", name: "Queijo cottage", qty: 50, unit: "g", kcal: 50, scaleGroup: "dairy" },
    { foodKey: "iogurte-natural", name: "Requeijão light", qty: 20, unit: "g", kcal: 35, scaleGroup: "dairy" },
  ],
  Gorduras: [
    { foodKey: "salada-completa", name: "Azeite extravirgem", qty: 5, unit: "ml", kcal: 45, scaleGroup: "fat" },
    { foodKey: "ovos-com-bacon", name: "Bacon", qty: 20, unit: "g", kcal: 110, scaleGroup: "fat" },
    { foodKey: "salada-completa", name: "Abacate", qty: 80, unit: "g", kcal: 128, scaleGroup: "fat" },
    { foodKey: "salada-completa", name: "Manteiga", qty: 10, unit: "g", kcal: 74, scaleGroup: "fat" },
  ],
  Bebidas: [
    { foodKey: "cha-com-torrada", name: "Café sem açúcar", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    { foodKey: "cha-com-torrada", name: "Chá", qty: 200, unit: "ml", kcal: 2, scaleGroup: "beverage" },
    { foodKey: "vitamina-de-fruta", name: "Vitamina de fruta", qty: 300, unit: "ml", kcal: 220, scaleGroup: "beverage" },
    { foodKey: "smoff-de-frutas", name: "Suco natural", qty: 250, unit: "ml", kcal: 130, scaleGroup: "beverage" },
    { foodKey: "acai", name: "Açaí puro", qty: 200, unit: "ml", kcal: 140, scaleGroup: "fruit" },
  ],
  Gerais: [
    { foodKey: "sopa-de-legumes", name: "Sopa de legumes", qty: 300, unit: "ml", kcal: 120, scaleGroup: "mixed" },
    { foodKey: "canja-de-galinha-com-legumes", name: "Canja de galinha", qty: 350, unit: "ml", kcal: 250, scaleGroup: "mixed" },
    { foodKey: "sanduiche-natural", name: "Sanduíche natural", qty: 1, unit: "unid", kcal: 220, scaleGroup: "mixed" },
    { foodKey: "panqueca-proteica", name: "Panqueca proteica", qty: 1, unit: "unid", kcal: 255, scaleGroup: "mixed" },
    { foodKey: "crepioca", name: "Crepioca", qty: 1, unit: "unid", kcal: 200, scaleGroup: "mixed" },
  ],
};

export const foodCategories = Object.keys(foodCatalog) as FoodCategory[];
