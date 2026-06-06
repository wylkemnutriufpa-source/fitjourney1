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
  { match: /banana/i, key: "banana-com-aveia" },
  { match: /ma[cç][aã]|maca/i, key: "maca" },
  { match: /laranja/i, key: "laranja" },
  { match: /mam[aã]o|mamao/i, key: "mamao" },
  { match: /pera/i, key: "pera" },
  { match: /uva/i, key: "uva" },
  { match: /abacaxi/i, key: "abacaxi" },
  { match: /manga/i, key: "manga" },
  { match: /morango/i, key: "morango" },
  { match: /goiaba/i, key: "goiaba" },
  { match: /melancia/i, key: "melancia" },
  { match: /melao|mel[aã]o/i, key: "melao" },
  // Bovinos
  { match: /(contrafil[eé]|patinho|alcatra|coxao|m[uú]sculo|fraldinha|cupim|bovin|carne\s*vermelha|bife)/i, key: "carne-grelhada" },
  { match: /ac[eé]m/i, key: "acem" },
  { match: /picanha(?!\s*su)/i, key: "picanha" },
  { match: /maminha/i, key: "maminha" },
  // Suínos — costela/bisteca/panceta (com osso/gordura) → costela-suina;
  // carré/lombo/pernil/file/picanha suína → lombo-suino/file-de-porco/picanha-suina.
  { match: /(costela\s*su[ií]na|bisteca|panceta|costelinha)/i, key: "costela-suina" },
  { match: /(carr[eé]\s*su[ií]no|carr[eé]|pernil|lombo)/i, key: "lombo-suino" },
  { match: /(file\s*(de\s*)?porco|fil[eé]\s*su[ií]no)/i, key: "file-de-porco" },
  { match: /picanha\s*su[ií]na/i, key: "picanha-suina" },
  { match: /(porco|su[ií]no|bacon)/i, key: "lombo-suino" },
  // Aves
  { match: /(coxa|sobrecoxa)/i, key: "coxa-e-sobrecoxa" },
  { match: /(frango|peito\s*de\s*frango|peru|aves?)/i, key: "frango-grelhado" },
  // Peixes
  { match: /(til[aá]pia|sal[mã]o|atum|peixe|merluza|sardinha|pesc|bacalhau|cama?r[aã]o|polvo|lula)/i, key: "file-de-tilapia" },
  // Ovos
  { match: /\bovo(s)?\b|omelete|clara/i, key: "ovos-cozidos" },
  // Tapioca / crepioca — tapioca pura usa imagem real de tapioca (com queijo).
  { match: /crepioca/i, key: "crepioca" },
  { match: /tapioca\s*(com\s*)?queijo/i, key: "tapioca-com-queijo" },
  { match: /tapioca\s*(com\s*)?ovo/i, key: "tapioca-com-ovo" },
  { match: /tapioca/i, key: "tapioca-com-queijo" },
  // Pão
  { match: /p[aã]o\s*(com\s*)?ovo/i, key: "pao-com-ovo" },
  { match: /p[aã]o\s*(com\s*)?queijo|p[aã]o\s*de\s*queijo/i, key: "pao-com-queijo" },
  { match: /torrada/i, key: "torrada-integral" },
  { match: /p[aã]o(\s|-)?(frances|franc[eê]s|integral|forma)?/i, key: "pao-com-queijo" },
  // Carbos
  { match: /batata(\s|-)?doce/i, key: "frango-com-batata-doce" },
  { match: /aveia|oats|mingau/i, key: "mingau-de-aveia" },
  { match: /cuscuz\s*(com\s*)?(ovo|queijo)/i, key: "cuscuz-com-ovo" },
  { match: /cuscuz/i, key: "cuscuz-com-ovo" },
  { match: /(quinoa|arroz|macarr[aã]o|massa)/i, key: "macarrao-com-carne-moida" },
  { match: /milho/i, key: "milho-cozido" },
  // Laticínios
  { match: /iogurte|yogurt|grego/i, key: "iogurte-natural" },
  { match: /leite/i, key: "copo-de-leite-morno" },
  // Oleaginosas / sementes (fallback p/ granola)
  { match: /castanha|am[eê]ndoa|noz|chia|lin(h)?a[cç]a|flax|granola|semente/i, key: "iogurte-com-granola-2" },
  // Frutas genéricas (último recurso de fruta)
  { match: /(fruta|salada\s*de\s*fruta|frutas\s*vermelhas|berry)/i, key: "salada-de-frutas" },
];

/** Resolve image by exact key, fallback to prefix match, then category by name, else undefined. */
export function imgFor(key: string, name?: string): string | undefined {
  if (foodImages[key]) return foodImages[key];
  const normalizedKey = key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const prefix = normalizedKey;
  const match = allFoodKeys.find((k) => k.startsWith(prefix));
  if (match) return foodImages[match];

  // Fallback por categoria (nome ou slug)
  const haystack = `${name ?? ""} ${key}`;
  for (const { match: rx, key: fb } of CATEGORY_FALLBACKS) {
    if (rx.test(haystack) && foodImages[fb]) return foodImages[fb];
  }
  return undefined;
}
