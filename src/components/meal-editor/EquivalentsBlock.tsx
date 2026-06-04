// Templates Inteligentes — Fase 1.
// Bloco de equivalentes de UM item: dropdown de critério + opções editáveis + recalcular.
// Componente compartilhado: o editor de template e o editor de plano do paciente
// passam o mesmo PlannerFoodItem base + onChange para materializar.

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Plus, ChevronDown, ChevronRight, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import type { PlannerFoodItem } from "@/lib/meal-planner";
import { useTacoCandidates } from "@/lib/substitutions/use-taco-candidates";

import { EquivalentsOptionCard } from "./EquivalentsOptionCard";
import { recalcMaterializedEquivalents } from "./recalc";
import {
  type BlockCriterion,
  type EquivalentsBlockSize,
  type MaterializedEquivalentOption,
  type MaterializedEquivalents,
} from "./types";

type Props = {
  base: PlannerFoodItem;
  value: MaterializedEquivalents | undefined;
  onChange: (next: MaterializedEquivalents | undefined) => void;
  /** Quantidade de opções alvo ao recalcular do zero (default 3). */
  defaultSize?: EquivalentsBlockSize;
  disabled?: boolean;
};

const CRITERION_LABEL: Record<BlockCriterion, string> = {
  auto: "Automático (pelo grupo)",
  protein: "Proteína",
  carb: "Carboidrato",
  energy: "Energia (kcal)",
};

export function EquivalentsBlock({
  base,
  value,
  onChange,
  defaultSize = 3,
  disabled,
}: Props) {
  const candidates = useTacoCandidates();
  const criterion: BlockCriterion = value?.criterion ?? "auto";
  const options = value?.options ?? [];

  const canRecalc = useMemo(() => {
    return candidates.length > 0 && base.foodKey.length > 0;
  }, [candidates, base.foodKey]);

  const handleRecalc = () => {
    const size = (options.length || defaultSize) as EquivalentsBlockSize;
    const next = recalcMaterializedEquivalents({
      base,
      criterion,
      size,
      candidates,
    });
    if (!next) {
      toast.error(`Não foi possível recalcular equivalentes para "${base.name}".`);
      return;
    }
    onChange(next);
  };

  // Recalc automático quando o item base muda (qty/unit/foodKey),
  // somente se já existe um bloco materializado. Debounce 400ms.
  const lastSigRef = useRef<string | null>(null);
  useEffect(() => {
    if (!value || value.options.length === 0) return;
    if (!canRecalc) return;
    const sig = `${base.foodKey}|${base.qty}|${base.unit}|${criterion}`;
    if (lastSigRef.current === null) {
      lastSigRef.current = sig;
      return;
    }
    if (lastSigRef.current === sig) return;
    const handle = setTimeout(() => {
      const size = (value.options.length || defaultSize) as EquivalentsBlockSize;
      const next = recalcMaterializedEquivalents({ base, criterion, size, candidates });
      if (next) {
        lastSigRef.current = sig;
        onChange(next);
      }
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.foodKey, base.qty, base.unit, criterion, candidates]);

  const handleCriterionChange = (c: BlockCriterion) => {
    if (!value) {
      // Sem bloco ainda → criar bloco vazio com critério escolhido (sem opções).
      onChange({
        criterion: c,
        generatedAt: new Date().toISOString(),
        catalogVersion: "",
        options: [],
      });
      return;
    }
    onChange({ ...value, criterion: c });
  };

  const handleOptionChange = (idx: number, next: MaterializedEquivalentOption) => {
    if (!value) return;
    const nextOptions = value.options.map((o, i) => (i === idx ? next : o));
    onChange({ ...value, options: nextOptions, generatedAt: new Date().toISOString() });
  };

  const handleOptionRemove = (idx: number) => {
    if (!value) return;
    const nextOptions = value.options.filter((_, i) => i !== idx);
    if (nextOptions.length === 0) {
      onChange(undefined);
      return;
    }
    onChange({ ...value, options: nextOptions, generatedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Critério de equivalência
          </Label>
          <Select
            value={criterion}
            onValueChange={(v) => handleCriterionChange(v as BlockCriterion)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CRITERION_LABEL) as BlockCriterion[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {CRITERION_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleRecalc}
          disabled={disabled || !canRecalc}
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Recalcular bloco
        </Button>
      </div>

      {options.length === 0 ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground">
          <span>Nenhuma opção gerada ainda.</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleRecalc}
            disabled={disabled || !canRecalc}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Gerar
          </Button>
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {options.map((o, idx) => (
            <EquivalentsOptionCard
              key={`${o.foodKey}-${idx}`}
              value={o}
              onChange={(next) => handleOptionChange(idx, next)}
              onRemove={() => handleOptionRemove(idx)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {value?.generatedAt && options.length > 0 ? (
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Materializado em {new Date(value.generatedAt).toLocaleString("pt-BR")} ·
          catálogo {value.catalogVersion || "—"}
        </p>
      ) : null}
    </div>
  );
}
