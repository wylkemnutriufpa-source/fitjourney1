// Protocolos — aba "premium" do FitJourney.
// Stub inicial: lista os protocolos planejados (Jejum Intermitente + IFJ trancado).
// Editor / motor virão nas próximas instruções do produto.

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
} from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/protocolos")({
  component: ProtocolosPage,
});

type ProtocoloCard = {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly icon: typeof Timer;
  readonly locked?: boolean;
  readonly premium?: boolean;
};

const PROTOCOLOS: ReadonlyArray<ProtocoloCard> = [
  {
    id: "jejum-intermitente",
    name: "Jejum Intermitente",
    tagline: "Janelas 16/8 · 14/10 · OMAD — editável como template.",
    icon: Timer,
    premium: true,
  },
  {
    id: "low-carb",
    name: "Protocolo Low Carb",
    tagline: "Redução estratégica de carboidratos — foco em saciedade e perda de gordura.",
    icon: Wheat,
    premium: true,
  },
  {
    id: "agua",
    name: "Protocolo da Água",
    tagline: "Hidratação calculada por peso/atividade com lembretes e metas diárias.",
    icon: Droplets,
    premium: true,
  },
  {
    id: "ciclo-carbo",
    name: "Protocolo Ciclo de Carboidratos",
    tagline: "Dias high/low/no carb alternados — performance e composição corporal.",
    icon: Repeat,
    premium: true,
  },
  {
    id: "anti-ansiedade",
    name: "Protocolo Anti-Ansiedade",
    tagline: "Triptofano, magnésio, ômega-3 — eixo intestino-cérebro.",
    icon: Brain,
    premium: true,
  },
  {
    id: "anti-enxaqueca",
    name: "Protocolo Anti-Enxaqueca",
    tagline: "Exclusão de gatilhos + magnésio, riboflavina e CoQ10.",
    icon: Activity,
    premium: true,
  },
  {
    id: "antiparasitario",
    name: "Protocolo Antiparasitário",
    tagline: "Alimentos vermífugos naturais e suporte intestinal.",
    icon: Bug,
    premium: true,
  },
  {
    id: "anticelulite",
    name: "Protocolo Anticelulite",
    tagline: "Drenagem, anti-inflamatórios e suporte ao colágeno.",
    icon: HeartPulse,
    premium: true,
  },
  {
    id: "antiqueda",
    name: "Protocolo Antiqueda de Cabelo",
    tagline: "Ferro, zinco, biotina e proteína — saúde capilar.",
    icon: Scissors,
    premium: true,
  },
  {
    id: "anti-inflamatorio",
    name: "Protocolo Anti-inflamatório",
    tagline: "Ômega-3, polifenóis e exclusão de pró-inflamatórios.",
    icon: Flame,
    premium: true,
  },
  {
    id: "antiinchaco",
    name: "Protocolo Antiinchaço",
    tagline: "Sódio controlado, potássio e diuréticos naturais.",
    icon: Wind,
    premium: true,
  },
  {
    id: "beleza",
    name: "Protocolo da Beleza",
    tagline: "Foco em unhas, cabelo e pele — colágeno, silício e antioxidantes.",
    icon: Gem,
    premium: true,
  },
  {
    id: "ifj",
    name: "Protocolo IFJ — Inteligência FitJourney",
    tagline:
      "Cardápio focado em emagrecimento e controle de fome com alimentos análogos GLP-1. Em breve.",
    icon: Sparkles,
    premium: true,
    locked: true,
  },
];

function ProtocolosPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl p-6 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Templates premium
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Protocolos</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Protocolos são templates especiais — editáveis como qualquer
            template, mas baseados em estratégias clínicas específicas. O
            Protocolo IFJ é exclusivo do FitJourney.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {PROTOCOLOS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className="relative rounded-lg border border-border bg-surface p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid size-9 place-items-center rounded-md border border-border bg-background">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">
                        {p.name}
                      </p>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                        {p.premium ? "premium" : "padrão"}
                      </p>
                    </div>
                  </div>
                  {p.locked && (
                    <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-amber-400/90 border border-amber-400/30 rounded px-1.5 py-0.5">
                      <Lock className="size-3" />
                      trancado
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{p.tagline}</p>
                <div className="pt-2 mt-auto border-t border-border">
                  <button
                    disabled
                    className="text-[10px] font-mono uppercase px-2 py-1 rounded border border-border text-muted-foreground"
                  >
                    em breve
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
