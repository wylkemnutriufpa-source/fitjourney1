// Templates Inteligentes — Fase 1.
// Botão que recalcula em massa o bloco de equivalentes de TODOS os itens
// fornecidos. Pula itens sem cobertura no catálogo TACO (não cria bloco vazio).
// Usado no editor de template e no editor de plano do paciente.

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import type { PlannerFoodItem } from "@/lib/meal-planner";
import { useTacoCandidates } from "@/lib/substitutions/use-taco-candidates";

import { recalcMaterializedEquivalents } from "./recalc";
import type { EquivalentsBlockSize } from "./types";

type Props = {
  items: PlannerFoodItem[];
  onChange: (nextItems: PlannerFoodItem[]) => void;
  /** Quantidade de opções alvo por bloco (default 3). */
  defaultSize?: EquivalentsBlockSize;
  label?: string;
  disabled?: boolean;
};

export function ApplyEquivalentsAllButton({
  items,
  onChange,
  defaultSize = 3,
  label = "Recalcular todos os equivalentes",
  disabled,
}: Props) {
  const candidates = useTacoCandidates();
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    if (busy) return;
    setBusy(true);
    try {
      let updated = 0;
      let skipped = 0;
      const next = items.map((item) => {
        const size = (item.materializedEquivalents?.options.length ||
          defaultSize) as EquivalentsBlockSize;
        const criterion = item.materializedEquivalents?.criterion ?? "auto";
        const block = recalcMaterializedEquivalents({
          base: item,
          criterion,
          size,
          candidates,
        });
        if (!block) {
          skipped += 1;
          return item;
        }
        updated += 1;
        return { ...item, materializedEquivalents: block };
      });
      onChange(next);
      toast.success(
        `Recalculado: ${updated} item(ns). ${skipped > 0 ? `Sem cobertura: ${skipped}.` : ""}`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={handleClick}
      disabled={disabled || busy || items.length === 0}
    >
      <RefreshCw className={`mr-2 h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
      {label}
    </Button>
  );
}
