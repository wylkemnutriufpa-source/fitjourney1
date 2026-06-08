// Protocolos — aba "premium" do FitJourney.
// Lê o catálogo único em src/lib/protocols/catalog.ts (mesma fonte usada pelo
// motor de sugestão que cruza com a anamnese aprovada).

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
import {
  PROTOCOL_CATALOG,
  type ProtocolDescriptor,
} from "@/lib/protocols/catalog";

export const Route = createFileRoute("/_authenticated/protocolos")({
  component: ProtocolosPage,
});

const ICONS: Record<ProtocolDescriptor["icon"], typeof Timer> = {
  Timer,
  Wheat,
  Droplets,
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
  Sparkles,
};

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
