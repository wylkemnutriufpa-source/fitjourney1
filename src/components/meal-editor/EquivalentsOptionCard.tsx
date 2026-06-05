// Templates Inteligentes — Fase 1.
// Card individual de uma opção de equivalente — editável (nome, qty, unit, kcal, imagem).
// Burro: recebe value + onChange + onRemove. Sem estado de servidor.

import { useState } from "react";
import { Search, Trash2, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { imgFor } from "@/lib/food-images";

import type { MaterializedEquivalentOption } from "./types";

type Props = {
  value: MaterializedEquivalentOption;
  onChange: (next: MaterializedEquivalentOption) => void;
  onRemove?: () => void;
  onSwap?: () => void;
  disabled?: boolean;
};

export function EquivalentsOptionCard({ value, onChange, onRemove, onSwap, disabled }: Props) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = imgFor(value.imageSlug ?? value.foodKey, value.name);

  const patch = (p: Partial<MaterializedEquivalentOption>) => onChange({ ...value, ...p });

  return (
    <div className="group/card flex gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
      <button
        type="button"
        onClick={onSwap}
        disabled={disabled || !onSwap}
        className="group relative h-20 w-20 flex-none overflow-hidden rounded-lg bg-muted ring-1 ring-border disabled:cursor-default"
        aria-label="Trocar alimento"
        title={onSwap ? "Clique para trocar este alimento" : undefined}
      >
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={value.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            sem img
          </div>
        )}
        {onSwap ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <ArrowRightLeft className="h-5 w-5" />
          </span>
        ) : null}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start gap-2">
          <Input
            value={value.name}
            onChange={(e) => patch({ name: e.target.value })}
            disabled={disabled}
            className="h-8 min-w-0 flex-1 basis-full text-sm font-medium sm:basis-auto"
            aria-label="Nome do equivalente"
          />
          {onSwap ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 flex-none px-2"
              onClick={onSwap}
              disabled={disabled}
              aria-label="Buscar substituto"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar
            </Button>
          ) : null}
          {onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-none"
              onClick={onRemove}
              disabled={disabled}
              aria-label="Remover opção"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Qtd
            </Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={value.qty}
              onChange={(e) => patch({ qty: Number(e.target.value) || 0 })}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Unidade
            </Label>
            <Input
              value={value.unit}
              onChange={(e) => patch({ unit: e.target.value })}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              kcal
            </Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={value.kcal}
              onChange={(e) => patch({ kcal: Number(e.target.value) || 0 })}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
