// Templates Inteligentes — Fase 1.
// Tipos compartilhados entre os componentes de edição de blocos de equivalentes.
// Editor de template e editor de plano do paciente consomem os mesmos componentes.

import type {
  BlockCriterion,
  MaterializedEquivalentOption,
  MaterializedEquivalents,
  PlannerFoodItem,
} from "@/lib/meal-planner";

export type { BlockCriterion, MaterializedEquivalentOption, MaterializedEquivalents };

/** Versão atual do catálogo TACO usada na materialização (auditoria). */
export const TACO_CATALOG_VERSION = "taco-4ed-2025-06";

/** Quantas opções queremos por bloco (Fase 1 fixa em 3, mas o tipo permite 1–4). */
export type EquivalentsBlockSize = 1 | 2 | 3 | 4;

export type RecalcInput = {
  base: PlannerFoodItem;
  criterion: BlockCriterion;
  size: EquivalentsBlockSize;
};
