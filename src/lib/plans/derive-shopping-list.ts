// Lista de compras derivada do snapshot publicado.
// Função pura. Zero IO. Zero recálculo de macros. Zero normalização.
// Apenas agrega quantidades por (foodKey, unit) e enriquece com nome/categoria
// vindos do catálogo de foods já carregado pelo Patient App.
//
// Regras:
// - Considera apenas `meal.main.items[]`. Equivalents são alternativas, não somam.
// - Soma por chave (foodKey + unit). Unidades diferentes do mesmo foodKey
//   geram linhas separadas (não convertemos g↔un automaticamente).
// - `weeklyMultiplier` (default 7): multiplica a soma diária pelo número
//   de dias da semana, assumindo o padrão FitJourney (plano de 1 dia replicado).
// - Itens sem categoria caem em "Outros".

export interface SnapshotItem {
  readonly foodKey: string;
  readonly name: string;
  readonly qty: number;
  readonly unit: string;
}

export interface SnapshotMealMain {
  readonly items?: ReadonlyArray<SnapshotItem>;
}

export interface SnapshotMeal {
  readonly main?: SnapshotMealMain;
}

export interface FoodCatalogEntry {
  readonly foodKey: string;
  readonly name: string;
  readonly category: string;
}

export interface ShoppingItem {
  readonly foodKey: string;
  readonly name: string;
  readonly category: string;
  readonly unit: string;
  readonly qtyDaily: number;
  readonly qtyWeekly: number;
}

export interface ShoppingGroup {
  readonly category: string;
  readonly items: ReadonlyArray<ShoppingItem>;
}

export interface ShoppingList {
  readonly groups: ReadonlyArray<ShoppingGroup>;
  readonly totalLines: number;
  readonly weeklyMultiplier: number;
}

const OUTROS = "Outros";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function deriveShoppingList(
  meals: ReadonlyArray<SnapshotMeal> | undefined | null,
  foods: ReadonlyArray<FoodCatalogEntry> | undefined | null,
  weeklyMultiplier = 7,
): ShoppingList {
  const byKey = new Map<string, { foodKey: string; name: string; unit: string; qty: number }>();

  for (const meal of meals ?? []) {
    const items = meal?.main?.items ?? [];
    for (const it of items) {
      if (!it || !it.foodKey || !Number.isFinite(it.qty) || it.qty <= 0) continue;
      const unit = (it.unit || "g").trim();
      const k = `${it.foodKey}::${unit}`;
      const prev = byKey.get(k);
      if (prev) {
        prev.qty += it.qty;
      } else {
        byKey.set(k, {
          foodKey: it.foodKey,
          name: it.name || it.foodKey,
          unit,
          qty: it.qty,
        });
      }
    }
  }

  const catByKey = new Map<string, FoodCatalogEntry>();
  for (const f of foods ?? []) catByKey.set(f.foodKey, f);

  const groups = new Map<string, ShoppingItem[]>();
  for (const v of byKey.values()) {
    const cat = catByKey.get(v.foodKey)?.category?.trim() || OUTROS;
    const niceName = catByKey.get(v.foodKey)?.name || v.name;
    const item: ShoppingItem = {
      foodKey: v.foodKey,
      name: niceName,
      category: cat,
      unit: v.unit,
      qtyDaily: round1(v.qty),
      qtyWeekly: round1(v.qty * weeklyMultiplier),
    };
    const arr = groups.get(cat) ?? [];
    arr.push(item);
    groups.set(cat, arr);
  }

  const groupArr: ShoppingGroup[] = Array.from(groups.entries())
    .map(([category, items]) => ({
      category,
      items: items.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    }))
    .sort((a, b) => {
      if (a.category === OUTROS) return 1;
      if (b.category === OUTROS) return -1;
      return a.category.localeCompare(b.category, "pt-BR");
    });

  return {
    groups: groupArr,
    totalLines: byKey.size,
    weeklyMultiplier,
  };
}

export function formatShoppingListText(list: ShoppingList): string {
  const lines: string[] = [`🛒 Lista de compras (semana — ${list.weeklyMultiplier} dias)`];
  for (const g of list.groups) {
    lines.push("");
    lines.push(`*${g.category}*`);
    for (const it of g.items) {
      lines.push(`• ${it.name} — ${it.qtyWeekly} ${it.unit}`);
    }
  }
  return lines.join("\n");
}
