// Templates Inteligentes — Fase 1.
// Card individual de uma opção de equivalente — editável (nome, qty, unit, kcal, imagem).
// Burro: recebe value + onChange + onRemove. Sem estado de servidor.

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { imgFor } from "@/lib/food-images";

import type { MaterializedEquivalentOption } from "./types";

type Props = {
  value: MaterializedEquivalentOption;
  onChange: (next: MaterializedEquivalentOption) => void;
  onRemove?: () => void;
  disabled?: boolean;
};

export function EquivalentsOptionCard({ value, onChange, onRemove, disabled }: Props) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = imgFor(value.imageSlug ?? value.foodKey, value.name);

  const patch = (p: Partial<MaterializedEquivalentOption>) => onChange({ ...value, ...p });

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-3">
      <div className="h-16 w-16 flex-none overflow-hidden rounded-md bg-muted">
        {imgSrc && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={value.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            sem img
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start gap-2">
          <Input
            value={value.name}
            onChange={(e) => patch({ name: e.target.value })}
            disabled={disabled}
            className="h-8 text-sm font-medium"
            aria-label="Nome do equivalente"
          />
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
