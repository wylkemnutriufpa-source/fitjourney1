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
