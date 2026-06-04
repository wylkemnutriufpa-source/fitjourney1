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
    // Fallback ao seed embutido enquanto a query carrega ou se falhar.
    placeholderData: tacoCatalog as EquivalentCandidate[],
    retry: 1,
  });
  return data && data.length > 0 ? data : tacoCatalog;
}
