// Templates Inteligentes — Fase 1.
// Card individual de uma opção de equivalente — editável (nome, qty, unit, kcal, imagem).
// Burro: recebe value + onChange + onRemove. Sem estado de servidor.

import { useState } from "react";
import { Search, Trash2, ArrowRightLeft, Lock, Unlock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const patch = (p: Partial<MaterializedEquivalentOption>) => {
    const clearsMeasure = "qty" in p || "unit" in p;
    onChange({
      ...value,
      ...(clearsMeasure ? { householdMeasure: undefined, gramsEquivalent: undefined } : {}),
      ...p,
    });
  };

  return (
    <div className="group/card rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onSwap}
          disabled={disabled || !onSwap}
          className="group relative h-20 w-20 flex-none overflow-hidden rounded-lg bg-muted ring-1 ring-border disabled:cursor-default self-start"
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
          <div className="flex items-start gap-1.5">
            <Input
              value={value.name}
              onChange={(e) => patch({ name: e.target.value })}
              disabled={disabled}
              className="h-8 min-w-0 flex-1 text-sm font-medium"
              aria-label="Nome do equivalente"
            />
            {onSwap ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-none"
                onClick={onSwap}
                disabled={disabled}
                aria-label="Buscar substituto"
                title="Buscar substituto"
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant={value.locked ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 flex-none"
              onClick={() => patch({ locked: !value.locked })}
              disabled={disabled}
              aria-label={value.locked ? "Destravar opção" : "Travar opção"}
              title={value.locked ? "Destravar opção" : "Travar opção"}
            >
              {value.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
            {onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-none text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                disabled={disabled}
                aria-label="Remover opção"
                title="Remover opção"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          {value.householdMeasure ? (
            <p className="text-[11px] text-muted-foreground leading-snug">
              Medida caseira:{" "}
              <span className="text-foreground">{value.householdMeasure}</span>
              <span className="font-mono"> · {value.qty} {value.unit}</span>
            </p>
          ) : null}

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <div className="min-w-0">
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
            <div className="min-w-0">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Un
              </Label>
              <Select
                value={value.unit}
                onValueChange={(u) => patch({ unit: u })}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 w-[68px] text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const base = ["g", "ml", "unid"];
                    const opts = base.includes(value.unit) ? base : [...base, value.unit];
                    return opts.map((u) => (
                      <SelectItem key={u} value={u} className="font-mono text-xs">
                        {u}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0">
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
    </div>
  );
}
