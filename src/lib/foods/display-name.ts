const RAW_WORD_RE = /\b(?:cru|crua|crus|cruas)\b/gi;

/** Remove termos técnicos de estado/fonte que não devem aparecer para nutri/paciente. */
export function cleanFoodDisplayName(value: string | null | undefined): string {
  const original = String(value ?? "").trim();
  const cleaned = original
    .replace(/\s*\((?:USDA|TBCA)\)\s*$/gi, "")
    .replace(/\s*\([^)]*\b(?:cru|crua|crus|cruas)\b[^)]*\)\s*/gi, " ")
    .replace(RAW_WORD_RE, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || original;
}

export function cleanFoodNamesDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cleanFoodNamesDeep(item)) as T;
  if (!value || typeof value !== "object") return value;

  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    next[key] = key === "name" && typeof entry === "string"
      ? cleanFoodDisplayName(entry)
      : cleanFoodNamesDeep(entry);
  }
  return next as T;
}