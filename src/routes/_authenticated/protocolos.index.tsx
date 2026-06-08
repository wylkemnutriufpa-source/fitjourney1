// Protocolos — aba premium do FitJourney.
// A rota pai /protocolos é layout; esta leaf renderiza a lista.

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Baby,
  Brain,
  Bug,
  CircleDot,
  Crown,
  Droplet,
  Droplets,
  Flame,
  Gem,
  HeartPulse,
  Leaf,
  Lock,
  Repeat,
  Scissors,
  Sparkles,
  Timer,
  TrendingDown,
  Wheat,
  Wind,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { PROTOCOL_CATALOG, type ProtocolDescriptor } from "@/lib/protocols/catalog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/protocolos/")({
  component: ProtocolosIndexPage,
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

function ProtocolosIndexPage() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

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
            Protocolos são templates especiais — editáveis como qualquer template, mas baseados em estratégias
            clínicas específicas. {!isAdmin && <span className="text-[var(--gold)]">Disponíveis no plano Pro.</span>}
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {PROTOCOL_CATALOG.map((p) => {
            const Icon = ICONS[p.icon];
            const locked = !isAdmin;
            const cardClasses =
              "group relative overflow-hidden rounded-lg border border-[var(--gold)]/25 bg-surface p-4 flex flex-col gap-3 animate-fade-in hover:border-[var(--gold)]/60 transition-colors shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_8%,transparent)] text-left w-full";
            const inner = (
              <>
                <Sparkles className="pointer-events-none absolute -top-1 -right-1 size-6 text-[var(--gold)]/40 animate-pulse" aria-hidden />
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
                        style={{ textShadow: "0 0 12px color-mix(in oklab, var(--gold) 35%, transparent)" }}
                      >
                        {p.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-[var(--gold)] border border-[var(--gold)]/50 rounded px-1.5 py-0.5 bg-[color-mix(in_oklab,var(--gold)_8%,transparent)]">
                          <Sparkles className="size-2.5" />
                          Premium
                        </span>
                        {p.exclusive && <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">exclusivo</span>}
                      </div>
                    </div>
                  </div>
                  {locked && (
                    <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-[var(--gold)] border border-[var(--gold)]/40 rounded px-1.5 py-0.5 bg-[color-mix(in_oklab,var(--gold)_6%,transparent)]">
                      <Lock className="size-3" />
                      trancado
                    </span>
                  )}
                </div>
                <p className="relative text-xs text-muted-foreground">{p.tagline}</p>
                <div className="relative pt-2 mt-auto border-t border-[var(--gold)]/15 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    {locked ? "requer pro" : "4 fases"}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-1 rounded inline-flex items-center gap-1 border border-[var(--gold)]/60 text-[var(--gold)] group-hover:bg-[color-mix(in_oklab,var(--gold)_10%,transparent)] transition-colors">
                    {locked ? <><Lock className="size-3" /> bloqueado</> : "abrir"}
                  </span>
                </div>
              </>
            );

            if (locked) {
              return (
                <button key={p.id} type="button" onClick={() => setUpgradeOpen(true)} className={cardClasses + " opacity-90 cursor-pointer"}>
                  {inner}
                </button>
              );
            }

            return (
              <Link key={p.id} to="/protocolos/$protocolId" params={{ protocolId: p.id }} className={cardClasses}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--gold)]/40 bg-[color-mix(in_oklab,var(--gold)_8%,transparent)] mb-2">
              <Crown className="size-5 text-[var(--gold)]" />
            </div>
            <DialogTitle className="text-center text-[var(--gold)] uppercase tracking-wide">Atualize para o Pro</DialogTitle>
            <DialogDescription className="text-center pt-1">
              Atualize para o Pro para ter acesso a todas as ferramentas 🔧 e liberar os protocolos clínicos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="bg-[var(--gold)] text-background hover:bg-[var(--gold)]/90">
              <Link to="/financeiro" onClick={() => setUpgradeOpen(false)}>Fazer upgrade para Pro</Link>
            </Button>
            <Button variant="ghost" onClick={() => setUpgradeOpen(false)}>Agora não</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}