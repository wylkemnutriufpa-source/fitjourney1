// Mapeia o nome do alimento para um emoji visual coerente.
// Read-only: usado apenas pela renderização do Patient App / editor.
// Sem inferência clínica — pura camada estética para substituir o ícone
// genérico de balança por algo reconhecível.

function norm(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Ordem importa: regras mais específicas primeiro (ex.: "café com leite"
// casa "cafe" antes de "leite"; "pão de queijo" casa "pao" antes de "queijo").
const RULES: Array<{ match: RegExp; emoji: string }> = [
  // Proteínas animais
  { match: /\b(peixe|tilapia|merluza|salmao|atum|sardinha|bacalhau|pescada)\b/, emoji: "🐟" },
  { match: /\b(camarao|lula|polvo|fruto do mar)\b/, emoji: "🦐" },
  { match: /\b(frango|peito de frango|file de frango|sobrecoxa|coxa)\b/, emoji: "🍗" },
  { match: /\b(carne|bife|patinho|alcatra|coxao|picanha|file mignon|file|lombo|costela|hamburguer)\b/, emoji: "🥩" },
  { match: /\b(bacon|presunto|peito de peru|salsicha|linguica|mortadela)\b/, emoji: "🥓" },
  { match: /\b(ovo|ovos|clara|omelete|mexido)\b/, emoji: "🥚" },

  // Laticínios
  { match: /\b(leite|whey|shake)\b/, emoji: "🥛" },
  { match: /\b(iogurte|coalhada|kefir)\b/, emoji: "🥣" },
  { match: /\b(queijo|requeijao|cottage|ricota|minas|mussarela|parmesao)\b/, emoji: "🧀" },
  { match: /\b(manteiga|margarina|ghee)\b/, emoji: "🧈" },

  // Pães e farináceos
  { match: /\b(pao|paes|baguete|ciabatta|broa|bisnaguinha)\b/, emoji: "🍞" },
  { match: /\b(torrada|biscoito|bolacha|cracker)\b/, emoji: "🍪" },
  { match: /\b(tapioca|cuscuz|crepioca|rap10|wrap|tortilha|panqueca)\b/, emoji: "🫓" },
  { match: /\b(macarrao|massa|espaguete|talharim|penne|lasanha|nhoque)\b/, emoji: "🍝" },
  { match: /\b(pizza)\b/, emoji: "🍕" },
  { match: /\b(sanduiche|hamburguer no pao|x-)\b/, emoji: "🥪" },

  // Carboidratos
  { match: /\b(arroz)\b/, emoji: "🍚" },
  { match: /\b(batata doce|batata-doce)\b/, emoji: "🍠" },
  { match: /\b(batata|inhame|mandioca|aipim|macaxeira|pupunha)\b/, emoji: "🥔" },
  { match: /\b(milho|pipoca|polenta|fuba)\b/, emoji: "🌽" },
  { match: /\b(aveia|granola|cereal|musli|flocos)\b/, emoji: "🥣" },

  // Leguminosas
  { match: /\b(feijao|lentilha|grao de bico|grao-de-bico|ervilha|soja|edamame)\b/, emoji: "🫘" },

  // Frutas
  { match: /\b(banana)\b/, emoji: "🍌" },
  { match: /\b(maca|pera)\b/, emoji: "🍎" },
  { match: /\b(laranja|tangerina|mexerica|bergamota|mimosa)\b/, emoji: "🍊" },
  { match: /\b(limao|lima)\b/, emoji: "🍋" },
  { match: /\b(uva)\b/, emoji: "🍇" },
  { match: /\b(morango|amora|framboesa|mirtilo|berries|frutas vermelhas)\b/, emoji: "🍓" },
  { match: /\b(melancia)\b/, emoji: "🍉" },
  { match: /\b(melao)\b/, emoji: "🍈" },
  { match: /\b(abacaxi|ananas)\b/, emoji: "🍍" },
  { match: /\b(manga)\b/, emoji: "🥭" },
  { match: /\b(mamao|papaia)\b/, emoji: "🥭" },
  { match: /\b(pessego|nectarina|ameixa)\b/, emoji: "🍑" },
  { match: /\b(kiwi)\b/, emoji: "🥝" },
  { match: /\b(coco)\b/, emoji: "🥥" },
  { match: /\b(abacate|guacamole)\b/, emoji: "🥑" },

  // Vegetais / saladas
  { match: /\b(salada|alface|rucula|agriao|folhas|folha verde)\b/, emoji: "🥗" },
  { match: /\b(tomate)\b/, emoji: "🍅" },
  { match: /\b(cenoura)\b/, emoji: "🥕" },
  { match: /\b(brocolis|couve|repolho|espinafre|acelga)\b/, emoji: "🥦" },
  { match: /\b(pepino|abobrinha|chuchu|berinjela|abobora)\b/, emoji: "🥒" },
  { match: /\b(pimentao|pimenta)\b/, emoji: "🫑" },
  { match: /\b(cebola|alho)\b/, emoji: "🧅" },
  { match: /\b(cogumelo|champignon|shitake|shimeji)\b/, emoji: "🍄" },

  // Oleaginosas / gorduras
  { match: /\b(castanha|amendoa|noz|amendoim|pistache|pasta de amendoim)\b/, emoji: "🥜" },
  { match: /\b(azeite|oleo)\b/, emoji: "🫒" },
  { match: /\b(chia|linhaca|gergelim|semente)\b/, emoji: "🌱" },

  // Bebidas
  { match: /\b(cafe|expresso|cappuccino)\b/, emoji: "☕" },
  { match: /\b(cha|matcha)\b/, emoji: "🍵" },
  { match: /\b(agua|hidratacao)\b/, emoji: "💧" },
  { match: /\b(suco|vitamina|smoothie)\b/, emoji: "🧃" },

  // Doces (geralmente fora do plano, mas mapeados)
  { match: /\b(chocolate|cacau)\b/, emoji: "🍫" },
  { match: /\b(mel|geleia)\b/, emoji: "🍯" },
];

export function emojiForFood(name: string | null | undefined): string {
  const n = norm(name ?? "");
  if (!n) return "🍽️";
  for (const r of RULES) if (r.match.test(n)) return r.emoji;
  return "🍽️";
}
