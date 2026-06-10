// Templates Inteligentes — Fase 1.
// Bloco de equivalentes de UM item: dropdown de critério + opções editáveis + recalcular.
// Componente compartilhado: o editor de template e o editor de plano do paciente
// passam o mesmo PlannerFoodItem base + onChange para materializar.

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Plus, ChevronDown, ChevronRight, Shuffle, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
import { FoodSwapDialog } from "./FoodSwapDialog";
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
  variant?: "stacked" | "inline";
  /** Gera substituições automaticamente uma única vez ao montar, se ainda não houver. */
  autoGenerateOnMount?: boolean;
  /**
   * Contexto da refeição (almoço/jantar vs café/lanche). Usado para travar
   * o pool de proteínas — almoço/jantar nunca recebe ovo/queijo/frango desfiado.
   */
  mealKind?: "breakfast" | "lunch" | "snack" | "dinner" | "other";
};

const CRITERION_LABEL: Record<BlockCriterion, string> = {
  auto: "Automático (pelo grupo)",
  protein: "Proteína",
  carb: "Carboidrato",
  fat: "Gordura",
  energy: "Energia (kcal)",
};

export function EquivalentsBlock({
  base,
  value,
  onChange,
  defaultSize = 3,
  disabled,
  variant = "stacked",
  autoGenerateOnMount = false,
}: Props) {
  const candidates = useTacoCandidates();
  const criterion: BlockCriterion = value?.criterion ?? "auto";
  const options = value?.options ?? [];
  const [open, setOpen] = useState(false);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [rotation, setRotation] = useState(0);
  const reduceMotion = useReducedMotion();

  const canRecalc = useMemo(() => {
    return candidates.length > 0 && base.foodKey.length > 0;
  }, [candidates, base.foodKey]);

  const flashPending = (apply: () => void) => {
    setPending(true);
    // Pequeno flash de skeleton (~280ms) — recalc é síncrono, mas o feedback
    // visual de "gerando" ajuda muito na percepção de premium.
    if (reduceMotion) {
      apply();
      setPending(false);
      return;
    }
    setTimeout(() => {
      apply();
      setPending(false);
    }, 280);
  };

  const handleRecalc = () => {
    const size = (options.length || defaultSize) as EquivalentsBlockSize;
    const nextRotation = rotation + 1;
    setRotation(nextRotation);
    flashPending(() => {
      const next = recalcMaterializedEquivalents({
        base,
        criterion,
        size,
        candidates,
        rotationOffset: nextRotation,
      });
      if (!next) {
        toast.error(`Não foi possível recalcular equivalentes para "${base.name}".`);
        return;
      }
      onChange(next);
    });
  };

  // Auto-geração única ao montar (item recém-adicionado em uma refeição).
  const autoGenDoneRef = useRef(false);
  useEffect(() => {
    if (!autoGenerateOnMount || autoGenDoneRef.current) return;
    if (value && value.options.length > 0) {
      autoGenDoneRef.current = true;
      return;
    }
    if (!canRecalc) return;
    const next = recalcMaterializedEquivalents({
      base,
      criterion,
      size: defaultSize,
      candidates,
    });
    if (next) {
      autoGenDoneRef.current = true;
      onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerateOnMount, canRecalc, candidates]);

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

  const summaryLabel =
    options.length === 0
      ? "Nenhuma opção gerada"
      : `${options.length} ${options.length === 1 ? "opção equivalente" : "opções equivalentes"}`;
  const isInline = variant === "inline";

  return (
    <div className={isInline ? "contents" : "rounded-lg border border-dashed border-border bg-muted/30"}>
      {/* Header colapsável */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={isInline
          ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          : "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50"}
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <Shuffle className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">
            Substituições
          </span>
          <span className={isInline ? "hidden" : "text-[11px] text-muted-foreground truncate"}>
            · {summaryLabel}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
            className={isInline ? "order-last col-span-full" : ""}
          >
            <div className={isInline
              ? "space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-3"
              : "space-y-3 border-t border-border/60 p-3"}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="w-full min-w-0 sm:flex-1 sm:min-w-[180px]">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Critério de equivalência
                  </Label>
                  <Select
                    value={criterion}
                    onValueChange={(v) => handleCriterionChange(v as BlockCriterion)}
                    disabled={disabled || pending}
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

                <motion.div whileTap={reduceMotion ? undefined : { scale: 0.97 }} className="w-full sm:w-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRecalc}
                    disabled={disabled || !canRecalc || pending}
                    className="w-full sm:w-auto"
                  >
                    {pending ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    )}
                    {pending ? "Gerando equivalentes…" : "Gerar outra opção"}
                  </Button>
                </motion.div>
              </div>

              {pending ? (
                <SkeletonOptions
                  count={(options.length || defaultSize) as EquivalentsBlockSize}
                />
              ) : options.length === 0 ? (
                <div className="flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                  <span>Nenhuma opção gerada ainda.</span>
                  <motion.div whileTap={reduceMotion ? undefined : { scale: 0.97 }}>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleRecalc}
                      disabled={disabled || !canRecalc}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Gerar opções
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  <AnimatePresence initial={false}>
                    {options.map((o, idx) => (
                      <motion.div
                        key={`${o.foodKey}-${idx}`}
                        layout={!reduceMotion}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.18, delay: reduceMotion ? 0 : idx * 0.04 }}
                      >
                        <EquivalentsOptionCard
                          value={o}
                          onChange={(next) => handleOptionChange(idx, next)}
                          onRemove={() => handleOptionRemove(idx)}
                          onSwap={() => setSwapIdx(idx)}
                          disabled={disabled}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {value?.generatedAt && options.length > 0 && !pending ? (
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Materializado em {new Date(value.generatedAt).toLocaleString("pt-BR")} ·
                  Banco de dados
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {swapIdx !== null && options[swapIdx] ? (
        <FoodSwapDialog
          open={swapIdx !== null}
          onOpenChange={(v) => { if (!v) setSwapIdx(null); }}
          current={options[swapIdx]}
          candidates={candidates}
          scaleGroup={options[swapIdx].scaleGroup ?? base.scaleGroup}
          onPick={(next) => handleOptionChange(swapIdx, next)}
        />
      ) : null}
    </div>
  );
}

// ============================================================
// SkeletonOptions — placeholder visual durante recálculo.
// Imita o formato do grid de EquivalentsOptionCard (md:grid-cols-2).
// ============================================================
function SkeletonOptions({ count }: { readonly count: number }) {
  return (
    <div className="grid gap-2 md:grid-cols-2" aria-hidden>
      {Array.from({ length: Math.max(1, count) }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] rounded-md border border-border bg-muted/40 animate-pulse"
        />
      ))}
    </div>
  );
}
