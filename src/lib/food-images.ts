// Auto-mapped food image bank (Vite glob import — bundled, hashed URLs)
const modules = import.meta.glob("@/assets/foods/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export const foodImages: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const key = path.split("/").pop()!.replace(/\.jpg$/, "");
    return [key, url];
  }),
);

export const allFoodKeys = Object.keys(foodImages).sort();

/** Fallbacks genéricos por categoria — quando o corte/tipo específico não tem foto,
 * caímos numa imagem representativa da família (UI premium, sem "sem img"). */
const CATEGORY_FALLBACKS: Array<{ match: RegExp; key: string }> = [
  // Bovinos
  { match: /(contrafil[eé]|patinho|alcatra|coxao|m[uú]sculo|fraldinha|cupim|ac[eé]m|bovin|carne\s*vermelha|bife)/i, key: "carne-grelhada" },
  // Suínos
  { match: /(lombo|porco|su[ií]no|pernil|bacon|costela\s*su[ií]na)/i, key: "lombo-suino" },
  // Aves
  { match: /(frango|peito\s*de\s*frango|coxa|sobrecoxa|peru|aves?)/i, key: "frango-grelhado" },
  // Peixes
  { match: /(til[aá]pia|sal[mã]o|atum|peixe|merluza|sardinha|pesc)/i, key: "file-de-tilapia" },
  // Ovos
  { match: /\bovo(s)?\b|omelete|clara/i, key: "ovos-cozidos" },
  // Frutas genéricas (último recurso de fruta)
  { match: /(fruta|salada\s*de\s*fruta)/i, key: "salada-de-frutas" },
];

/** Resolve image by exact key, fallback to prefix match, then category by name, else undefined. */
export function imgFor(key: string, name?: string): string | undefined {
  if (foodImages[key]) return foodImages[key];
  const prefix = key.toLowerCase();
  const match = allFoodKeys.find((k) => k.startsWith(prefix));
  if (match) return foodImages[match];

  // Fallback por categoria (nome ou slug)
  const haystack = `${name ?? ""} ${key}`;
  for (const { match: rx, key: fb } of CATEGORY_FALLBACKS) {
    if (rx.test(haystack) && foodImages[fb]) return foodImages[fb];
  }
  return undefined;
}
