// Card de Lista de Compras no Patient App.
// Render burro a partir de função pura `deriveShoppingList`.
// Read-only. Zero escrita. Zero recálculo de macros.

import { useMemo, useState } from "react";
import { ShoppingCart, Copy, Share2, Check, ChevronDown } from "lucide-react";
import type { FoodDTO } from "@/lib/foods.functions";
import {
  deriveShoppingList,
  formatShoppingListText,
  type SnapshotMeal,
} from "@/lib/plans/derive-shopping-list";

type Props = {
  meals: ReadonlyArray<SnapshotMeal>;
  foods: ReadonlyArray<FoodDTO>;
};

export function ShoppingListCard({ meals, foods }: Props) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<7 | 15 | 30>(7);
  const [copied, setCopied] = useState(false);

  const list = useMemo(
    () => deriveShoppingList(meals, foods, period),
    [meals, foods, period],
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatShoppingListText(list));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop — clipboard pode falhar em alguns browsers/contextos.
    }
  }

  function handleWhats() {
    const text = encodeURIComponent(formatShoppingListText(list));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (list.totalLines === 0) return null;

  return (
    <section className="border border-border rounded-lg bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Mercado
          </p>
          <h2 className="text-lg font-semibold mt-1 flex items-center gap-2">
            <ShoppingCart className="size-5 text-primary" />
            Lista de compras
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {list.totalLines} item{list.totalLines === 1 ? "" : "s"} ·
            calculada para {period} dias
          </p>
        </div>
        <ChevronDown
          className={`size-5 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Período:
            </span>
            {[7, 15, 30].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p as 7 | 15 | 30)}
                className={`text-xs py-1 px-2.5 rounded-md border transition-colors ${
                  period === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-background"
                }`}
              >
                {p} dias
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-medium py-1.5 px-2.5 rounded-md border border-border hover:bg-background flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" /> Copiar
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleWhats}
                className="text-xs font-medium py-1.5 px-2.5 rounded-md border border-border hover:bg-background flex items-center gap-1.5"
              >
                <Share2 className="size-3.5" /> WhatsApp
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {list.groups.map((g) => (
              <div key={g.category}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                  {g.category}
                </p>
                <ul className="space-y-1">
                  {g.items.map((it) => (
                    <li
                      key={`${it.foodKey}-${it.unit}`}
                      className="flex items-baseline justify-between gap-3 text-sm border-b border-border/60 py-1.5"
                    >
                      <span>{it.name}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {it.qtyWeekly} {it.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Lista derivada do seu plano publicado, multiplicada pelo período
            escolhido. Itens com unidades diferentes (g vs. unidade) aparecem
            em linhas separadas — confira antes de comprar.
          </p>
        </div>
      )}
    </section>
  );
}
