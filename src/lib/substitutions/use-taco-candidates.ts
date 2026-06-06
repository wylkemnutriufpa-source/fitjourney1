// Hook que carrega o catálogo TACO do Cloud com fallback ao seed embutido.
// Sprint 6 A.4.3.
//
// Uso:
//   const candidates = useTacoCandidates();
//   buildTacoEquivalents(food, 3, criterion, candidates);

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTacoFoods } from "./taco.functions";
import { tacoCatalog } from "./taco-catalog";
import type { EquivalentCandidate } from "./equivalents";

export function useTacoCandidates(): readonly EquivalentCandidate[] {
  const fetchTacoFoods = useServerFn(listTacoFoods);
  const { data } = useQuery({
    queryKey: ["taco-foods"],
    queryFn: () => fetchTacoFoods(),
    staleTime: 1000 * 60 * 30, // 30 min — catálogo muda raramente.
    placeholderData: tacoCatalog as EquivalentCandidate[],
    retry: 1,
  });
  const cloud = data && data.length > 0 ? data : (tacoCatalog as EquivalentCandidate[]);
  // Merge com o seed local: o seed carrega `subGroup` (trava clínica fina) e
  // itens curados novos (wrap, bolo-milho, bolo-macaxeira, panqueca-banana,
  // aveia-flocos, frango-desfiado, carne-moida-refogada, ricota, queijo-minas).
  // Sem este merge, quando a query do Cloud termina, a UI perde subGroup e
  // mistura grupos (ex.: tapioca → tortilha de milho, macaxeira).
  const bySeed = new Map(tacoCatalog.map((s) => [s.foodKey, s]));
  const byKey = new Map<string, EquivalentCandidate>();
  for (const c of cloud) {
    const seed = bySeed.get(c.foodKey);
    byKey.set(c.foodKey, seed?.subGroup ? { ...c, subGroup: seed.subGroup } : c);
  }
  for (const s of tacoCatalog) {
    if (!byKey.has(s.foodKey)) byKey.set(s.foodKey, s);
  }
  return Array.from(byKey.values());
}
