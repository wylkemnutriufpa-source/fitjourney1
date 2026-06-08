// Protocolos — aba "premium" do FitJourney.
// Todos os protocolos são premium e trancados por padrão; ADMIN sempre tem acesso total.

import { createFileRoute } from "@tanstack/react-router";
import {
  Lock,
  Sparkles,
  Timer,
  Droplets,
  Wheat,
  Repeat,
  Brain,
  Activity,
  Bug,
  HeartPulse,
  Scissors,
  Flame,
  Wind,
  Gem,
  Leaf,
  Baby,
  TrendingDown,
  Droplet,
  CircleDot,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/protocolos")({
  component: ProtocolosPage,
});

type ProtocoloCard = {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly icon: typeof Timer;
  readonly exclusive?: boolean;
};

const PROTOCOLOS: ReadonlyArray<ProtocoloCard> = [
  { id: "jejum-intermitente", name: "Jejum Intermitente", tagline: "Janelas 16/8 · 14/10 · OMAD — editável como template.", icon: Timer },
  { id: "low-carb", name: "Protocolo Low Carb", tagline: "Redução estratégica de carboidratos — saciedade e perda de gordura.", icon: Wheat },
  { id: "agua", name: "Protocolo da Água", tagline: "Hidratação calculada por peso/atividade com lembretes diários.", icon: Droplets },
  { id: "ciclo-carbo", name: "Protocolo Ciclo de Carboidratos", tagline: "Dias high/low/no carb — performance e composição corporal.", icon: Repeat },
  { id: "anti-ansiedade", name: "Protocolo Anti-Ansiedade", tagline: "Triptofano, magnésio, ômega-3 — eixo intestino-cérebro.", icon: Brain },
  { id: "anti-enxaqueca", name: "Protocolo Anti-Enxaqueca", tagline: "Exclusão de gatilhos + magnésio, riboflavina e CoQ10.", icon: Activity },
  { id: "antiparasitario", name: "Protocolo Antiparasitário", tagline: "Alimentos vermífugos naturais e suporte intestinal.", icon: Bug },
  { id: "anticelulite", name: "Protocolo Anticelulite", tagline: "Drenagem, anti-inflamatórios e suporte ao colágeno.", icon: HeartPulse },
  { id: "antiqueda", name: "Protocolo Antiqueda de Cabelo", tagline: "Ferro, zinco, biotina e proteína — saúde capilar.", icon: Scissors },
  { id: "anti-inflamatorio", name: "Protocolo Anti-inflamatório", tagline: "Ômega-3, polifenóis e exclusão de pró-inflamatórios.", icon: Flame },
  { id: "antiinchaco", name: "Protocolo Antiinchaço", tagline: "Sódio controlado, potássio e diuréticos naturais.", icon: Wind },
  { id: "beleza", name: "Protocolo da Beleza", tagline: "Unhas, cabelo e pele — colágeno, silício e antioxidantes.", icon: Gem },
  { id: "anticonstipacao", name: "Protocolo Anticonstipação", tagline: "Fibras, hidratação e probióticos — trânsito intestinal regular.", icon: Leaf },
  { id: "pre-natal", name: "Protocolo Pré-Natal", tagline: "Ácido fólico, ferro, ômega-3 — nutrição materno-fetal.", icon: Baby },
  { id: "resistencia-insulina", name: "Protocolo Resistência à Insulina", tagline: "Baixo índice glicêmico, cromo e fracionamento estratégico.", icon: TrendingDown },
  { id: "anemia", name: "Protocolo Anemia", tagline: "Ferro heme, vitamina C e B12 — recuperação hematológica.", icon: Droplet },
  { id: "sop", name: "Protocolo SOP", tagline: "Inositol, baixo carbo e anti-inflamatórios — equilíbrio hormonal.", icon: CircleDot },
  { id: "ifj", name: "Protocolo IFJ — Inteligência FitJourney", tagline: "Cardápio focado em emagrecimento com análogos GLP-1.", icon: Sparkles, exclusive: true },
];

function ProtocolosPage() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  // Premium gating real virá do billing; por enquanto, só admin destranca.
  const hasPremium = isAdmin;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl p-6 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--gold)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Templates premium
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Protocolos</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Protocolos são templates especiais — editáveis como qualquer
            template, mas baseados em estratégias clínicas específicas.
            Acesso exclusivo para assinantes Premium.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {PROTOCOLOS.map((p) => {
            const Icon = p.icon;
            const locked = !hasPremium;
            return (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-lg border border-[var(--gold)]/25 bg-surface p-4 flex flex-col gap-3 animate-fade-in hover:border-[var(--gold)]/60 transition-colors shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_8%,transparent)]"
              >
                {/* sparkle suave — fade animado no canto */}
                <Sparkles
                  className="pointer-events-none absolute -top-1 -right-1 size-6 text-[var(--gold)]/40 animate-pulse"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[color-mix(in_oklab,var(--gold)_6%,transparent)] via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity"
                  aria-hidden
                />

                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="grid size-9 place-items-center rounded-md border border-[var(--gold)]/40 bg-background">
                      <Icon className="size-4 text-[var(--gold)]" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-bold uppercase tracking-wide leading-tight truncate text-[var(--gold)]"
                        style={{
                          textShadow:
                            "0 0 12px color-mix(in oklab, var(--gold) 35%, transparent)",
                        }}
                      >
                        {p.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-[var(--gold)] border border-[var(--gold)]/50 rounded px-1.5 py-0.5 bg-[color-mix(in_oklab,var(--gold)_8%,transparent)]">
                          <Sparkles className="size-2.5" />
                          Premium
                        </span>
                        {p.exclusive && (
                          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                            exclusivo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {locked && (
                    <span
                      title="Disponível para assinantes Premium"
                      className="flex items-center gap-1 text-[10px] font-mono uppercase text-[var(--gold)] border border-[var(--gold)]/40 rounded px-1.5 py-0.5 bg-[color-mix(in_oklab,var(--gold)_6%,transparent)]"
                    >
                      <Lock className="size-3" />
                      trancado
                    </span>
                  )}
                </div>
                <p className="relative text-xs text-muted-foreground">{p.tagline}</p>
                <div className="relative pt-2 mt-auto border-t border-[var(--gold)]/15 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    {locked ? "requer premium" : "disponível"}
                  </span>
                  <button
                    disabled={locked}
                    className={
                      "text-[10px] font-mono uppercase px-2 py-1 rounded border transition-colors " +
                      (locked
                        ? "border-border text-muted-foreground cursor-not-allowed"
                        : "border-[var(--gold)]/60 text-[var(--gold)] hover:bg-[color-mix(in_oklab,var(--gold)_10%,transparent)]")
                    }
                  >
                    {locked ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="size-3" /> bloqueado
                      </span>
                    ) : (
                      "abrir"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
