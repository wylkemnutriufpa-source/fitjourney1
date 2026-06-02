import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { foodCatalog, foodCategories, type FoodCategory, type CatalogFood } from "@/lib/food-catalog";
import { listFoods, type FoodDTO } from "@/lib/foods.functions";
import { Beef, Wheat, Sprout, Nut, Apple, Salad, Carrot, Milk, Droplet, Coffee, Utensils, Loader2 } from "lucide-react";
import { VideoLoader } from "@/components/VideoLoader";

const ICONS: Record<FoodCategory, React.ComponentType<{ className?: string }>> = {
  Proteínas: Beef,
  Carboidratos: Wheat,
  Grãos: Sprout,
  Sementes: Nut,
  Frutas: Apple,
  Saladas: Salad,
  Vegetais: Carrot,
  Laticínios: Milk,
  Gorduras: Droplet,
  Bebidas: Coffee,
  Gerais: Utensils,
};

function dtoToCatalogFood(f: FoodDTO): CatalogFood {
  return {
    foodKey: f.foodKey,
    name: f.name,
    qty: f.qty,
    unit: f.unit,
    kcal: f.kcal,
    scaleGroup: f.scaleGroup as CatalogFood["scaleGroup"],
  };
}

export function FoodPickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (food: CatalogFood) => void;
}) {
  const [cat, setCat] = useState<FoodCategory>("Proteínas");
  const [q, setQ] = useState("");

  const listFoodsFn = useServerFn(listFoods);
  const { data: dbFoods, isLoading, isError } = useQuery({
    queryKey: ["foods-catalog"],
    queryFn: () => listFoodsFn(),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  // Agrupa por categoria. Se backend falhar/carregando, usa o catálogo legado.
  const byCategory = useMemo(() => {
    if (!dbFoods || dbFoods.length === 0) return null;
    const grouped: Partial<Record<FoodCategory, FoodDTO[]>> = {};
    for (const f of dbFoods) {
      const c = (foodCategories.includes(f.category as FoodCategory)
        ? (f.category as FoodCategory)
        : "Gerais");
      (grouped[c] ??= []).push(f);
    }
    return grouped;
  }, [dbFoods]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (byCategory) {
      const list = byCategory[cat] ?? [];
      const filtered = needle
        ? list.filter((f) => f.name.toLowerCase().includes(needle))
        : list;
      return filtered.map((f) => ({
        catalog: dtoToCatalogFood(f),
        measure: f.householdMeasures.find((m) => m.isDefault)?.measureName ?? null,
        kcal: f.kcal,
        qty: f.qty,
        unit: f.unit,
        name: f.name,
        key: f.id,
      }));
    }
    // Fallback (legacy mock)
    const list = foodCatalog[cat];
    const filtered = needle ? list.filter((f) => f.name.toLowerCase().includes(needle)) : list;
    return filtered.map((f, i) => ({
      catalog: f,
      measure: null,
      kcal: f.kcal,
      qty: f.qty,
      unit: f.unit,
      name: f.name,
      key: `${f.foodKey}-${i}`,
    }));
  }, [byCategory, cat, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar alimento</DialogTitle>
          <DialogDescription>
            Catálogo TACO/IBGE. Escolha uma categoria e clique no alimento.
            {isError && " (usando catálogo offline)"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {foodCategories.map((c) => {
            const Icon = ICONS[c];
            const active = c === cat;
            const count = byCategory ? (byCategory[c]?.length ?? 0) : foodCatalog[c].length;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={
                  "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/40")
                }
              >
                <Icon className="size-3.5" />
                {c}
                <span className="text-[10px] font-mono opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Buscar em ${cat}...`}
          className="h-8 text-xs"
        />

        <div className="overflow-y-auto -mx-1 px-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {isLoading && (
            <div className="col-span-full flex items-center justify-center py-8 text-muted-foreground gap-2 text-xs">
              <Loader2 className="size-4 animate-spin" /> Carregando catálogo...
            </div>
          )}
          {!isLoading && items.map((it) => (
            <button
              key={it.key}
              onClick={() => {
                onPick(it.catalog);
                onOpenChange(false);
              }}
              className="text-left border border-border rounded-md p-2 hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{it.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {it.measure ?? `${it.qty} ${it.unit}`} · {it.kcal} kcal
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase text-primary shrink-0">+ add</span>
            </button>
          ))}
          {!isLoading && items.length === 0 && (
            <p className="text-xs text-muted-foreground italic col-span-full py-6 text-center">
              Nenhum alimento encontrado em {cat}.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
