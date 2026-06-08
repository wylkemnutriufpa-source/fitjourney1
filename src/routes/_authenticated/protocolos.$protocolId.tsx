// Abertura premium GENÉRICA — vale para TODOS os protocolos.
// Guarda-chuva → Módulos → Fases. "Aplicar Fase" abre seletor de paciente
// e grava em patient_active_protocols (snapshot imutável da fase).

import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Sparkles,
  Lock,
  Clock,
  Droplets,
  Moon,
  Leaf,
  ChevronRight,
  ChevronDown,
  Send,
  CheckCircle2,
  Pencil,
  Replace,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhaseMeal, PhaseMealItem } from "@/lib/protocols/catalog";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RealPatientPicker } from "@/components/RealPatientPicker";
import type { PatientLite } from "@/lib/plans/plans.functions";
import { toast } from "sonner";
import {
  findProtocolById,
  getProtocolModules,
  type ProtocolDescriptor,
  type ProtocolModule,
  type ProtocolPhase,
} from "@/lib/protocols/catalog";
import { applyProtocolPhase } from "@/lib/protocols/active.functions";

type PageSearch = { readonly module?: string };

export const Route = createFileRoute("/_authenticated/protocolos/$protocolId")({
  validateSearch: (s: Record<string, unknown>): PageSearch => ({
    module: typeof s.module === "string" ? s.module : undefined,
  }),
  loader: ({ params }) => {
    const protocol = findProtocolById(params.protocolId);
    if (!protocol) throw notFound();
    return { protocol };
  },
  component: ProtocolDetailPage,
});

function ProtocolDetailPage() {
  const { protocol } = Route.useLoaderData();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");

  // IFJ é o único exclusivo/premium — demais protocolos abertos para qualquer profissional autenticado.
  const requiresPremium = !!protocol.exclusive;
  const hasAccess = !requiresPremium || isAdmin;

  const modules = useMemo(() => getProtocolModules(protocol), [protocol]);
  const { module: moduleId } = Route.useSearch();
  const activeModule = useMemo(
    () => (moduleId ? modules.find((m) => m.id === moduleId) ?? null : null),
    [modules, moduleId],
  );

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl p-6 space-y-6">
        <PremiumHeader
          protocol={protocol}
          hasAccess={hasAccess}
          requiresPremium={requiresPremium}
          activeModule={activeModule}
        />

        {!hasAccess ? (
          <LockedNotice />
        ) : !activeModule ? (
          <ModulesGrid protocol={protocol} modules={modules} />
        ) : (
          <PhasesGrid protocol={protocol} module={activeModule} />
        )}
      </div>
    </AppShell>
  );
}

function PremiumHeader({
  protocol,
  hasAccess,
  requiresPremium,
  activeModule,
}: {
  protocol: ProtocolDescriptor;
  hasAccess: boolean;
  requiresPremium: boolean;
  activeModule: ProtocolModule | null;
}) {
  return (
    <header className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <Link to="/protocolos" className="inline-flex items-center gap-1 hover:text-[var(--gold)] transition-colors">
          <ArrowLeft className="size-3" /> Protocolos
        </Link>
        <span>/</span>
        {activeModule ? (
          <>
            <Link
              to="/protocolos/$protocolId"
              params={{ protocolId: protocol.id }}
              className="hover:text-[var(--gold)] transition-colors"
            >
              {protocol.name}
            </Link>
            <span>/</span>
            <span className="text-[var(--gold)]">{activeModule.name}</span>
          </>
        ) : (
          <span className="text-[var(--gold)]">{protocol.name}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[var(--gold)] animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)] border border-[var(--gold)]/50 rounded px-1.5 py-0.5 bg-[color-mix(in_oklab,var(--gold)_8%,transparent)]">
          {requiresPremium ? "Premium · Exclusivo" : "Protocolo"}
        </span>
        {requiresPremium && !hasAccess && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-muted-foreground border border-border rounded px-1.5 py-0.5">
            <Lock className="size-3" /> trancado
          </span>
        )}
      </div>

      <h1
        className="text-3xl font-bold tracking-tight uppercase text-[var(--gold)]"
        style={{ textShadow: "0 0 18px color-mix(in oklab, var(--gold) 35%, transparent)" }}
      >
        {activeModule ? activeModule.name : protocol.name}
      </h1>
      <p className="text-sm text-muted-foreground max-w-2xl">
        {activeModule ? activeModule.tagline : protocol.tagline}
      </p>
    </header>
  );
}

function LockedNotice() {
  return (
    <div className="rounded-lg border border-[var(--gold)]/30 bg-surface p-8 text-center space-y-3 animate-fade-in">
      <Lock className="size-8 text-[var(--gold)] mx-auto" />
      <h2 className="text-lg font-semibold text-[var(--gold)] uppercase tracking-wide">Conteúdo Premium</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Este protocolo é exclusivo para assinantes Premium. Em breve você poderá liberar acesso direto por aqui.
      </p>
    </div>
  );
}

function ModulesGrid({
  protocol,
  modules,
}: {
  protocol: ProtocolDescriptor;
  modules: ReadonlyArray<ProtocolModule>;
}) {
  return (
    <section className="space-y-4 animate-fade-in">
      <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Fases / Módulos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map((m) => (
          <Link
            key={m.id}
            to="/protocolos/$protocolId"
            params={{ protocolId: protocol.id }}
            search={{ module: m.id }}
            className="group relative overflow-hidden rounded-lg border border-[var(--gold)]/30 bg-surface p-5 flex flex-col gap-3 hover:border-[var(--gold)]/70 transition-colors shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_8%,transparent)]"
          >
            <Sparkles
              className="pointer-events-none absolute -top-1 -right-1 size-7 text-[var(--gold)]/40 animate-pulse"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[color-mix(in_oklab,var(--gold)_8%,transparent)] via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity"
              aria-hidden
            />
            <div className="relative">
              <p
                className="text-base font-bold uppercase tracking-wide text-[var(--gold)]"
                style={{ textShadow: "0 0 12px color-mix(in oklab, var(--gold) 35%, transparent)" }}
              >
                {m.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{m.tagline}</p>
            </div>
            <div className="relative mt-auto pt-3 border-t border-[var(--gold)]/15 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                {m.phases.length} {m.phases.length === 1 ? "fase" : "fases"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-[var(--gold)] group-hover:translate-x-0.5 transition-transform">
                abrir <ChevronRight className="size-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PhasesGrid({
  protocol,
  module: m,
}: {
  protocol: ProtocolDescriptor;
  module: ProtocolModule;
}) {
  const [detailsPhase, setDetailsPhase] = useState<ProtocolPhase | null>(null);
  const [applyPhase, setApplyPhase] = useState<ProtocolPhase | null>(null);
  return (
    <section className="space-y-4 animate-fade-in">
      <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Fases</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {m.phases.map((p) => (
          <PhaseCard key={p.id} phase={p} onOpen={() => setDetailsPhase(p)} />
        ))}
      </div>

      <PhaseDetailsDialog
        protocol={protocol}
        module={m}
        phase={detailsPhase}
        onClose={() => setDetailsPhase(null)}
        onApply={(ph) => {
          setDetailsPhase(null);
          setApplyPhase(ph);
        }}
      />

      <ApplyPhaseDialog
        protocol={protocol}
        module={m}
        phase={applyPhase}
        onClose={() => setApplyPhase(null)}
      />
    </section>
  );
}

function PhaseCard({ phase, onOpen }: { phase: ProtocolPhase; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative overflow-hidden rounded-lg border border-[var(--gold)]/25 bg-surface p-4 flex flex-col gap-3 hover:border-[var(--gold)]/60 transition-colors text-left"
    >
      <Sparkles
        className="pointer-events-none absolute -top-1 -right-1 size-6 text-[var(--gold)]/30 animate-pulse"
        aria-hidden
      />
      <div className="relative space-y-1.5">
        <p
          className="text-sm font-bold uppercase tracking-wide text-[var(--gold)] leading-tight"
          style={{ textShadow: "0 0 10px color-mix(in oklab, var(--gold) 30%, transparent)" }}
        >
          {phase.name}
        </p>
        <div className="flex items-center gap-3 text-[10px] font-mono uppercase text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {phase.durationWeeks} sem.
          </span>
          {phase.dailyKcalTarget && <span>{phase.dailyKcalTarget} kcal/dia</span>}
        </div>
        <p className="text-xs text-muted-foreground pt-1">{phase.description}</p>
      </div>

      <div className="relative grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground border-t border-[var(--gold)]/15 pt-3">
        <span className="inline-flex items-center gap-1">
          <Droplets className="size-3 text-[var(--gold)]/70" />
          {(phase.recommendations.waterMl / 1000).toFixed(1)}L
        </span>
        <span className="inline-flex items-center gap-1">
          <Moon className="size-3 text-[var(--gold)]/70" />
          {phase.recommendations.sleepHours}h
        </span>
        <span className="inline-flex items-center gap-1">
          <Leaf className="size-3 text-[var(--gold)]/70" />
          {phase.recommendations.teaRoutine.length} chás
        </span>
      </div>

      <span className="relative w-full mt-1 text-[11px] font-mono uppercase tracking-wider px-3 py-2 rounded border border-[var(--gold)]/60 text-[var(--gold)] inline-flex items-center justify-center gap-2 group-hover:bg-[color-mix(in_oklab,var(--gold)_12%,transparent)] transition-colors">
        Ver detalhes <ChevronRight className="size-3" />
      </span>
    </button>
  );
}

function PhaseDetailsDialog({
  protocol,
  module: m,
  phase,
  onClose,
  onApply,
}: {
  protocol: ProtocolDescriptor;
  module: ProtocolModule;
  phase: ProtocolPhase | null;
  onClose: () => void;
  onApply: (p: ProtocolPhase) => void;
}) {
  const open = !!phase;
  if (!phase) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogDescription className="text-[10px] font-mono uppercase tracking-widest">
            {protocol.name} · {m.name}
          </DialogDescription>
          <DialogTitle
            className="text-[var(--gold)] uppercase tracking-wide flex items-center gap-2"
            style={{ textShadow: "0 0 12px color-mix(in oklab, var(--gold) 30%, transparent)" }}
          >
            <Sparkles className="size-4" />
            {phase.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <p className="text-sm text-muted-foreground">{phase.description}</p>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <Metric label="Duração" value={`${phase.durationWeeks} sem`} />
            {phase.dailyKcalTarget && (
              <Metric label="Kcal/dia" value={String(phase.dailyKcalTarget)} />
            )}
            <Metric label="Água" value={`${(phase.recommendations.waterMl / 1000).toFixed(1)}L`} />
            <Metric label="Sono" value={`${phase.recommendations.sleepHours}h`} />
          </div>

          {/* Macros */}
          {phase.macros && (
            <Section title="Distribuição de Macros">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <MacroPill label="Proteína" pct={phase.macros.protein} />
                <MacroPill label="Carbo" pct={phase.macros.carb} />
                <MacroPill label="Gordura" pct={phase.macros.fat} />
              </div>
            </Section>
          )}

          {/* Estratégias */}
          {phase.recommendations.strategies.length > 0 && (
            <Section title="Estratégias-chave">
              <ul className="space-y-1.5 text-sm">
                {phase.recommendations.strategies.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[var(--gold)]">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Chás programados */}
          {phase.teaSchedule && phase.teaSchedule.length > 0 && (
            <Section title="Rotina de Chás">
              <div className="space-y-2">
                {phase.teaSchedule.map((t, i) => (
                  <div
                    key={i}
                    className="rounded border border-[var(--gold)]/20 bg-background px-3 py-2 text-xs flex flex-col gap-0.5"
                  >
                    <div className="flex items-center gap-2">
                      {t.time && (
                        <span className="font-mono text-[10px] text-[var(--gold)]">{t.time}</span>
                      )}
                      <span className="font-medium">{t.name}</span>
                    </div>
                    {t.benefits && (
                      <span className="text-[11px] text-muted-foreground">{t.benefits}</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Cardápio */}
          {phase.meals && phase.meals.length > 0 && (
            <Section title="Cardápio do Dia">
              <div className="space-y-3">
                {phase.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="rounded-lg border border-[var(--gold)]/20 bg-background p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[var(--gold)]">
                          {meal.time}
                        </span>
                        <span className="text-sm font-semibold">{meal.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {meal.totalKcal} kcal
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs">
                      {meal.items.map((it, i) => (
                        <li
                          key={i}
                          className="rounded-md border border-border/50 bg-surface/40 p-2"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-medium">{it.name}</span>
                              <span className="text-muted-foreground"> · {it.householdMeasure}</span>
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                              {it.quantityG}g · {it.kcal} kcal
                            </span>
                          </div>
                          {it.substitutions && it.substitutions.length > 0 && (
                            <div className="mt-2 space-y-1 border-t border-border/40 pt-2">
                              <p className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--gold)]/80">
                                <Replace className="size-3" />
                                Substituições já prontas
                              </p>
                              <ul className="space-y-1">
                                {it.substitutions.map((s, subIndex) => (
                                  <li
                                    key={`${s.foodKey}-${subIndex}`}
                                    className="flex items-baseline justify-between gap-2 rounded border border-[var(--gold)]/15 bg-background/70 px-2 py-1"
                                  >
                                    <span className="min-w-0">
                                      <span className="font-medium">{s.name}</span>
                                      <span className="text-muted-foreground"> · {s.householdMeasure}</span>
                                    </span>
                                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                      {s.quantityG}g · {s.kcal} kcal
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <div className="flex flex-col sm:flex-row gap-2">
            <EditPhaseButton protocolId={protocol.id} moduleId={m.id} phaseId={phase.id} />
            <Button onClick={() => onApply(phase)}>
              <Send className="size-4" />
              Aplicar esta Fase
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPhaseButton({
  protocolId,
  moduleId,
  phaseId,
}: {
  protocolId: string;
  moduleId: string;
  phaseId: number;
}) {
  const navigate = useNavigate();
  return (
    <Button
      variant="secondary"
      onClick={() =>
        navigate({
          to: "/templates",
          search: { fromProtocol: protocolId, module: moduleId, phase: phaseId },
        })
      }
      className="border border-[var(--gold)]/60 text-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_10%,transparent)] hover:bg-[color-mix(in_oklab,var(--gold)_18%,transparent)]"
    >
      <Pencil className="size-4" />
      Editar esta Fase
    </Button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--gold)]/20 bg-background px-2 py-1.5">
      <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-[var(--gold)]">{value}</div>
    </div>
  );
}

function MacroPill({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="rounded border border-[var(--gold)]/20 bg-background px-2 py-2 text-center">
      <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="text-base font-bold text-[var(--gold)]">{pct}%</div>
    </div>
  );
}

function ApplyPhaseDialog({
  protocol,
  module: m,
  phase,
  onClose,
}: {
  protocol: ProtocolDescriptor;
  module: ProtocolModule;
  phase: ProtocolPhase | null;
  onClose: () => void;
}) {
  const [patient, setPatient] = useState<PatientLite | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const apply = useServerFn(applyProtocolPhase);
  const open = !!phase;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!patient || !phase) throw new Error("Selecione um paciente");
      return apply({
        data: {
          patientId: patient.id,
          protocolId: protocol.id,
          moduleId: m.id,
          phaseId: phase.id,
        },
      });
    },
    onSuccess: () => {
      toast.success(`${phase!.name} atribuída a ${patient!.fullName}.`);
      setDone(patient!.fullName);
    },
    onError: (err) => {
      toast.error(`Falha ao aplicar fase: ${(err as Error).message}`);
    },
  });

  const reset = () => {
    setPatient(null);
    setDone(null);
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && reset()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--gold)] uppercase tracking-wide">
            <Sparkles className="size-4" /> Aplicar Fase
          </DialogTitle>
          <DialogDescription>
            {protocol.name} · {m.name} · {phase?.name}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-4 flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-5 text-emerald-400" />
            <span>
              Fase atribuída a <strong>{done}</strong>. Ele(a) verá no app em "Protocolos Ativos".
            </span>
          </div>
        ) : (
          <div className="py-2 space-y-3">
            <RealPatientPicker value={patient} onChange={setPatient} />
            <p className="text-[11px] text-muted-foreground">
              O paciente passa a ver esta fase em "Protocolos Ativos" e recebe um banner diário com as recomendações.
            </p>
          </div>
        )}

        <DialogFooter>
          {done ? (
            <Button onClick={reset}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={reset} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button disabled={!patient || mutation.isPending} onClick={() => mutation.mutate()}>
                <Send className="size-4" />
                {mutation.isPending ? "Aplicando…" : "Aplicar"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
