import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { foodCatalog, foodCategories, type FoodCategory, type CatalogFood } from "@/lib/food-catalog";
import { Beef, Wheat, Sprout, Nut, Apple, Salad, Carrot, Milk, Droplet, Coffee, Utensils } from "lucide-react";

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

  const items = useMemo(() => {
    const list = foodCatalog[cat];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((f) => f.name.toLowerCase().includes(needle));
  }, [cat, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar alimento</DialogTitle>
          <DialogDescription>
            Escolha uma categoria e clique no alimento. Tudo será editável depois (qty, unidade, kcal).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {foodCategories.map((c) => {
            const Icon = ICONS[c];
            const active = c === cat;
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
                <span className="text-[10px] font-mono opacity-60">{foodCatalog[c].length}</span>
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
          {items.map((f, idx) => (
            <button
              key={`${f.foodKey}-${idx}`}
              onClick={() => {
                onPick(f);
                onOpenChange(false);
              }}
              className="text-left border border-border rounded-md p-2 hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {f.qty} {f.unit} · {f.kcal} kcal
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase text-primary shrink-0">+ add</span>
            </button>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground italic col-span-full py-6 text-center">
              Nenhum alimento encontrado em {cat}.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
