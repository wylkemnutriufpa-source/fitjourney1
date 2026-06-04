// Templates Inteligentes — Fase 3.
// Modal de troca manual: profissional clica em uma opção gerada e escolhe
// substituto da TACO. Determinístico, kcal-preserving.

import { useMemo, useState } from "react";
import { Search, ArrowRightLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { imgFor } from "@/lib/food-images";

import type { EquivalentCandidate } from "@/lib/substitutions/equivalents";
import type { MaterializedEquivalentOption } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  current: MaterializedEquivalentOption;
  candidates: readonly EquivalentCandidate[];
  /** Grupo de escala da âncora (filtro inicial). Vazio = mostra tudo. */
  scaleGroup?: string;
  onPick: (next: MaterializedEquivalentOption) => void;
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** kcal-preserving: quantos g do candidato batem a kcal atual da opção. */
function swapKcalPreserving(
  current: MaterializedEquivalentOption,
  cand: EquivalentCandidate,
): MaterializedEquivalentOption {
  const targetKcal = current.kcal > 0 ? current.kcal : 100;
  const per100 = cand.kcalPer100g > 0 ? cand.kcalPer100g : 100;
  const qtyG = Math.max(1, Math.round((targetKcal / per100) * 100));
  return {
    foodKey: cand.foodKey,
    name: cand.name,
    qty: qtyG,
    unit: cand.unit === "unid" ? "g" : cand.unit,
    kcal: Math.round((qtyG * per100) / 100),
    imageSlug: cand.foodKey,
  };
}

export function FoodSwapDialog({
  open,
  onOpenChange,
  current,
  candidates,
  scaleGroup,
  onPick,
}: Props) {
  const [query, setQuery] = useState("");
  const [onlyGroup, setOnlyGroup] = useState(true);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    let list = candidates as EquivalentCandidate[];
    if (onlyGroup && scaleGroup) {
      list = list.filter((c) => c.scaleGroup === scaleGroup);
    }
    if (q) {
      list = list.filter(
        (c) => norm(c.name).includes(q) || norm(c.foodKey).includes(q),
      );
    }
    return list.slice(0, 60);
  }, [candidates, query, onlyGroup, scaleGroup]);

  const handlePick = (cand: EquivalentCandidate) => {
    onPick(swapKcalPreserving(current, cand));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            Trocar “{current.name}” por outro alimento
          </DialogTitle>
          <DialogDescription>
            Mantém aproximadamente a mesma energia ({current.kcal} kcal).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar na TACO…"
              className="h-9 pl-8 text-sm"
            />
          </div>
          {scaleGroup ? (
            <Button
              type="button"
              variant={onlyGroup ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyGroup((v) => !v)}
            >
              {scaleGroup}
            </Button>
          ) : null}
        </div>

        <div className="max-h-[420px] overflow-y-auto rounded-md border border-border">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum alimento encontrado.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((c) => {
                const img = imgFor(c.foodKey, c.name);
                const isCurrent = c.foodKey === current.foodKey;
                return (
                  <li key={c.foodKey}>
                    <button
                      type="button"
                      onClick={() => handlePick(c)}
                      disabled={isCurrent}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="h-10 w-10 flex-none overflow-hidden rounded-md bg-muted">
                        {img ? (
                          <img
                            src={img}
                            alt={c.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {c.name}
                          {isCurrent ? (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                              atual
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {c.scaleGroup} · {c.kcalPer100g} kcal/100{c.unit === "ml" ? "ml" : "g"}
                          {" · "}P {c.proteinPer100g}g · C {c.carbPer100g}g · G {c.fatPer100g}g
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
