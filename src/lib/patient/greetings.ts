// Banco de mensagens rotacionais do Patient App.
// Puro. Sem IO. Sem React. Determinístico por seed.
//
// Regras:
// - Período definido pela hora local (manhã/tarde/noite).
// - Mensagem principal sorteada dentro do período.
// - Nunca repete a última mensagem mostrada (persistido em localStorage
//   pelo chamador via getNextGreeting).

export type Period = "morning" | "afternoon" | "evening";

export function getPeriod(hour: number): Period {
  if (hour >= 5 && hour <= 11) return "morning";
  if (hour >= 12 && hour <= 17) return "afternoon";
  return "evening";
}

export function periodLabel(p: Period): string {
  if (p === "morning") return "Bom dia ☀️";
  if (p === "afternoon") return "Boa tarde 🌤️";
  return "Boa noite 🌙";
}

const MESSAGES: Record<Period, ReadonlyArray<string>> = {
  morning: [
    "Seu plano alimentar está disponível. Consistência vence motivação.",
    "Pequenas escolhas repetidas geram grandes resultados.",
    "Comece o dia alinhado com o que você decidiu pra você.",
    "Hoje é mais uma chance de seguir o combinado.",
    "Cada refeição planejada é um voto no seu objetivo.",
  ],
  afternoon: [
    "Continue seguindo seu plano. Cada refeição conta.",
    "O progresso acontece entre uma decisão e outra.",
    "Metade do dia feito. Mantenha o ritmo.",
    "Foco no próximo passo, não no plano inteiro.",
    "Disciplina hoje, resultado amanhã.",
  ],
  evening: [
    "Seu esforço de hoje constrói o resultado de amanhã.",
    "Feche o dia com consistência.",
    "Última refeição importa tanto quanto a primeira.",
    "Descanse sabendo que você fez o que combinou.",
    "Amanhã começa agora — recupere bem.",
  ],
};

const STORAGE_KEY = "fitjourney.patient.lastGreeting.v1";

type Stored = { period: Period; index: number };

function readLast(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (parsed && typeof parsed.index === "number" && parsed.period) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeLast(s: Stored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/**
 * Sorteia uma mensagem do período, evitando repetir a última mostrada
 * (no mesmo período) consecutivamente. Persiste o índice em localStorage.
 */
export function pickGreetingMessage(period: Period): string {
  const pool = MESSAGES[period];
  if (pool.length === 0) return "";
  const last = readLast();
  let candidate = Math.floor(Math.random() * pool.length);
  if (last && last.period === period && pool.length > 1) {
    let safety = 5;
    while (candidate === last.index && safety-- > 0) {
      candidate = Math.floor(Math.random() * pool.length);
    }
  }
  writeLast({ period, index: candidate });
  return pool[candidate];
}

export function formatTodayPtBr(d = new Date()): string {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// -------------------------------------------------------------------
// Banco de mensagens por objetivo clínico.
// Mostradas como linha "premium" abaixo da saudação.
// Determinístico-rotacional via localStorage (anti-repetição).
// -------------------------------------------------------------------

export type Objective =
  | "emagrecimento"
  | "hipertrofia"
  | "gestante"
  | "diabetes"
  | "manutencao"
  | "performance"
  | "geral";

const OBJECTIVE_MESSAGES: Record<Objective, ReadonlyArray<string>> = {
  emagrecimento: [
    "Cada escolha de hoje aproxima você da meta.",
    "Déficit não é privação — é direção.",
    "O resultado aparece quando a constância vira hábito.",
    "Você não está cortando comida, está escolhendo prioridade.",
    "Magro de verdade é quem mantém. E manter começa hoje.",
  ],
  hipertrofia: [
    "Alimentação é parte do treino.",
    "Músculo se constrói na cozinha tanto quanto na academia.",
    "Proteína em cada refeição. Sem exceção.",
    "Volume hoje, força amanhã.",
    "Treinou pesado? Coma à altura.",
  ],
  gestante: [
    "Cuidar da alimentação é cuidar de dois corpos.",
    "Cada nutriente importa — pra você e pra ele(a).",
    "Hidratação, ferro e cálcio: tripé desta fase.",
    "Comer com calma também é cuidar.",
    "Você está construindo uma vida inteira. Vá com gentileza.",
  ],
  diabetes: [
    "Consistência gera estabilidade.",
    "Glicemia estável é qualidade de vida.",
    "Refeição na hora certa vale tanto quanto o que está no prato.",
    "Pequenos ajustes, grandes diferenças no dia.",
    "Conhecer seu corpo é metade do controle.",
  ],
  manutencao: [
    "Manter é uma vitória silenciosa.",
    "O que você conquistou merece ser preservado.",
    "Equilíbrio é o objetivo mais difícil — e o seu.",
    "Cada dia mantendo é um dia escolhendo de novo.",
  ],
  performance: [
    "Combustível certo, resultado certo.",
    "Recuperação começa no garfo.",
    "Atleta é quem cuida fora do treino.",
    "Timing nutricional faz diferença no desempenho.",
  ],
  geral: [
    "Seu plano é seu mapa. Siga um passo de cada vez.",
    "Pequenas escolhas repetidas geram grandes resultados.",
    "Hoje é mais uma chance de seguir o combinado.",
  ],
};

const OBJ_STORAGE_KEY = "fitjourney.patient.lastObjMsg.v1";

type StoredObj = { objective: Objective; index: number };

function readLastObj(): StoredObj | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OBJ_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredObj;
    if (parsed && typeof parsed.index === "number" && parsed.objective) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeLastObj(s: StoredObj) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OBJ_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function pickObjectiveMessage(objective: Objective): string {
  const pool = OBJECTIVE_MESSAGES[objective] ?? OBJECTIVE_MESSAGES.geral;
  if (pool.length === 0) return "";
  const last = readLastObj();
  let candidate = Math.floor(Math.random() * pool.length);
  if (last && last.objective === objective && pool.length > 1) {
    let safety = 5;
    while (candidate === last.index && safety-- > 0) {
      candidate = Math.floor(Math.random() * pool.length);
    }
  }
  writeLastObj({ objective, index: candidate });
  return pool[candidate];
}

/**
 * Heurística pura — não infere dados clínicos, apenas mapeia rótulos
 * de objetivo/goal_tag conhecidos para a categoria de mensagem.
 */
export function inferObjectiveFromTag(tag: string | null | undefined): Objective {
  if (!tag) return "geral";
  const t = tag.toLowerCase();
  if (t.includes("emagre") || t.includes("perda") || t.includes("cut")) return "emagrecimento";
  if (t.includes("hipertr") || t.includes("massa") || t.includes("bulk")) return "hipertrofia";
  if (t.includes("gestan") || t.includes("gravid") || t.includes("trimestre")) return "gestante";
  if (t.includes("diabet") || t.includes("glic")) return "diabetes";
  if (t.includes("manut")) return "manutencao";
  if (t.includes("perform") || t.includes("atlet") || t.includes("endurance")) return "performance";
  return "geral";
}
