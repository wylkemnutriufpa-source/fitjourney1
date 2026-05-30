// DEPRECATED — moved to src/domain/write/nutritionist.functions.ts
// Mantido como re-export para preservar imports existentes.
// Toda nova mutação de nutritionists deve viver em src/domain/write/.
export {
  createNutritionistProfile,
  type CreateNutritionistResult,
} from "@/domain/write/nutritionist.functions";
