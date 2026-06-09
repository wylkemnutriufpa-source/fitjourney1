// Abertura premium GENÉRICA — vale para TODOS os protocolos.
// Guarda-chuva → Módulos → Fases. "Aplicar Fase" abre seletor de paciente
// e grava em patient_active_protocols (snapshot imutável da fase).

import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Users,
  Timer,
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
import { applyProtocolPhase, listProtocolEnrollments, type ProtocolEnrollmentRow } from "@/lib/protocols/active.functions";
import { ProtocolPhaseSections } from "@/components/protocols/ProtocolPhaseSections";
import { ProtocolDiagnosticCard } from "@/components/patient/ProtocolDiagnosticCard";
import { getGoldenTipsFor, type GoldenTip } from "@/lib/protocols/golden-tips";
import { getMethodologyFor } from "@/lib/protocols/methodologies";

type PageSearch = {
  readonly module?: string;
  readonly patientId?: string;
  readonly patientName?: string;
};

export const Route = createFileRoute("/_authenticated/protocolos/$protocolId")({
  validateSearch: (s: Record<string, unknown>): PageSearch => ({
    module: typeof s.module === "string" ? s.module : undefined,
    patientId: typeof s.patientId === "string" ? s.patientId : undefined,
    patientName: typeof s.patientName === "string" ? s.patientName : undefined,
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
  const { module: moduleId, patientId, patientName } = Route.useSearch();
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

        {hasAccess && <EnrollmentsButton protocol={protocol} />}

        {hasAccess && patientId && (
          <ProtocolDiagnosticCard patientId={patientId} />
        )}

        {!hasAccess ? (
          <LockedNotice />
        ) : !activeModule ? (
          <ModulesGrid protocol={protocol} modules={modules} patientId={patientId} patientName={patientName} />
        ) : (
          <>
            {activeModule.methodology && <ModuleMethodologyCard methodology={activeModule.methodology} />}
            <GoldenTips protocolId={protocol.id} />
            <PhasesGrid protocol={protocol} module={activeModule} patientId={patientId} patientName={patientName} />
          </>
        )}
      </div>
    </AppShell>
  );
}

function ModuleMethodologyCard({ methodology }: { methodology: NonNullable<ProtocolModule["methodology"]> }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-xl border border-[var(--gold)]/25 bg-background/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-[color-mix(in_oklab,var(--gold)_5%,transparent)] transition-colors"
      >
        <Sparkles className="size-4 text-[var(--gold)]" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)]">
            Metodologia
          </p>
          <p className="text-sm font-semibold text-foreground">{methodology.title}</p>
        </div>
        <ChevronDown className={cn("size-4 text-[var(--gold)] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-[var(--gold)]/15 space-y-3 animate-fade-in">
          {methodology.subtitle && (
            <p className="text-xs text-muted-foreground leading-relaxed">{methodology.subtitle}</p>
          )}

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)] mb-2">
              Pilares
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {methodology.pillars.map((p) => (
                <div key={p.title} className="rounded-lg border border-border/60 bg-surface/40 p-2.5 space-y-1">
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.summary}</p>
                  {p.examples && p.examples.length > 0 && (
                    <ul className="flex flex-wrap gap-1 pt-0.5">
                      {p.examples.map((ex) => (
                        <li
                          key={ex}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--gold)]/20 text-foreground/80"
                        >
                          {ex}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)] mb-2">
              Regras comportamentais
            </p>
            <ul className="space-y-1.5">
              {methodology.behavioralRules.map((r) => (
                <li
                  key={r.name}
                  className="flex items-start gap-2 text-xs rounded-md border border-border/40 bg-background/60 px-2.5 py-2"
                >
                  <span className="text-[var(--gold)] mt-0.5">•</span>
                  <span>
                    <strong className="text-foreground">{r.name}:</strong>{" "}
                    <span className="text-muted-foreground">{r.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {methodology.disclaimer && (
            <p className="text-[10px] font-mono text-muted-foreground/80 italic border-t border-border/40 pt-2">
              {methodology.disclaimer}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function GoldenTips({ protocolId }: { protocolId: string }) {
  const tips = getGoldenTipsFor(protocolId);
  if (tips.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {tips.map((tip, i) => (
        <GoldenTipCard key={`${protocolId}-${i}`} tip={tip} defaultOpen={i === 0} index={i + 1} />
      ))}
    </div>
  );
}

function GoldenTipCard({ tip, defaultOpen, index }: { tip: GoldenTip; defaultOpen: boolean; index: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      className="rounded-xl border border-[var(--gold)]/40 bg-gradient-to-br from-[color-mix(in_oklab,var(--gold)_8%,transparent)] to-background overflow-hidden shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_15%,transparent)]"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-[color-mix(in_oklab,var(--gold)_8%,transparent)] transition-colors"
      >
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-lg shrink-0" aria-hidden>
          {tip.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)]">
            Dica de Ouro #{index} · Hack Metabólico
          </p>
          <p className="text-sm font-semibold text-foreground">{tip.title}</p>
        </div>
        <ChevronDown
          className={cn("size-4 text-[var(--gold)] transition-transform shrink-0", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-3.5 pb-4 pt-1 border-t border-[var(--gold)]/20 space-y-3 animate-fade-in text-sm leading-relaxed">
          <p className="text-muted-foreground">
            <strong className="text-foreground">Objetivo:</strong> {tip.objective}
          </p>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)] mb-1.5">
              Como aplicar
            </p>
            <ol className="space-y-1 text-foreground/90 list-decimal list-inside marker:text-[var(--gold)]">
              {tip.howTo.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ol>
          </div>

          {tip.benefit && (
            <p className="text-xs text-muted-foreground border-l-2 border-[var(--gold)]/40 pl-3">
              <strong className="text-foreground">Benefício:</strong> {tip.benefit}
            </p>
          )}

          <p className="text-[10px] font-mono text-muted-foreground/80 italic border-t border-border/40 pt-2">
            Estratégia comportamental — apoia, não substitui medicamento ou tratamento clínico.
          </p>
        </div>
      )}
    </section>
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
  patientId,
  patientName,
}: {
  protocol: ProtocolDescriptor;
  modules: ReadonlyArray<ProtocolModule>;
  patientId?: string;
  patientName?: string;
}) {
  const [intro, setIntro] = useState<ProtocolModule | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<ProtocolModule | null>(null);
  const navigate = useNavigate();

  return (
    <section className="space-y-4 animate-fade-in">
      <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Fases / Módulos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setIntro(m)}
            className="group relative overflow-hidden rounded-lg border border-[var(--gold)]/30 bg-surface p-5 flex flex-col gap-3 hover:border-[var(--gold)]/70 transition-colors shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_8%,transparent)] text-left"
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
          </button>
        ))}
      </div>

      <ModuleIntroDialog
        protocol={protocol}
        module={intro}
        onClose={() => setIntro(null)}
        onDetails={(m) => {
          setIntro(null);
          setDetailsOpen(m);
        }}
        onStart={(m) => {
          setIntro(null);
          navigate({
            to: "/protocolos/$protocolId",
            params: { protocolId: protocol.id },
            search: { module: m.id, patientId, patientName },
          });
        }}
      />

      <ModuleDetailsDialog
        protocol={protocol}
        module={detailsOpen}
        onClose={() => setDetailsOpen(null)}
        onStart={(m) => {
          setDetailsOpen(null);
          navigate({
            to: "/protocolos/$protocolId",
            params: { protocolId: protocol.id },
            search: { module: m.id, patientId, patientName },
          });
        }}
      />
    </section>
  );
}

function ModuleIntroDialog({
  protocol,
  module: m,
  onClose,
  onDetails,
  onStart,
}: {
  protocol: ProtocolDescriptor;
  module: ProtocolModule | null;
  onClose: () => void;
  onDetails: (m: ProtocolModule) => void;
  onStart: (m: ProtocolModule) => void;
}) {
  const open = !!m;
  if (!m) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogDescription className="text-[10px] font-mono uppercase tracking-widest">
            {protocol.name}
          </DialogDescription>
          <DialogTitle
            className="text-[var(--gold)] uppercase tracking-wide flex items-center gap-2"
            style={{ textShadow: "0 0 12px color-mix(in oklab, var(--gold) 30%, transparent)" }}
          >
            <Sparkles className="size-4" />
            {m.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--gold)]/20 bg-background/60 p-3 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)]">
              Sobre o protocolo
            </p>
            <p className="text-sm text-foreground/90">{protocol.tagline}</p>
          </div>

          <div className="rounded-lg border border-[var(--gold)]/20 bg-background/60 p-3 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)]">
              Objetivo deste módulo
            </p>
            <p className="text-sm text-foreground/90">{m.tagline}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground">
            <span className="inline-flex items-center gap-1 border border-[var(--gold)]/20 rounded px-1.5 py-0.5">
              <Clock className="size-3 text-[var(--gold)]/70" />
              {m.phases.length} {m.phases.length === 1 ? "fase" : "fases"}
            </span>
            <span className="inline-flex items-center gap-1 border border-[var(--gold)]/20 rounded px-1.5 py-0.5">
              {m.phases.reduce((acc, p) => acc + p.durationWeeks, 0)} semanas no total
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Em <strong>Detalhes</strong> você vê o protocolo descrito fase a fase (duração, kcal,
            hidratação, sono e estratégias). Em <strong>Iniciar</strong> abre o fluxo das 4 fases
            para aplicar ao paciente.
          </p>
        </div>


        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onDetails(m)}>
            Detalhes
          </Button>
          <Button onClick={() => onStart(m)} className="bg-[var(--gold)] text-background hover:bg-[var(--gold)]/90">
            <Send className="size-4" />
            Iniciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModuleDetailsDialog({
  protocol,
  module: m,
  onClose,
  onStart,
}: {
  protocol: ProtocolDescriptor;
  module: ProtocolModule | null;
  onClose: () => void;
  onStart: (m: ProtocolModule) => void;
}) {
  const open = !!m;
  if (!m) {
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
            {protocol.name} · Detalhes
          </DialogDescription>
          <DialogTitle
            className="text-[var(--gold)] uppercase tracking-wide flex items-center gap-2"
            style={{ textShadow: "0 0 12px color-mix(in oklab, var(--gold) 30%, transparent)" }}
          >
            <Sparkles className="size-4" />
            {m.name}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{m.tagline}</p>

        <div className="space-y-3 py-2">
          {m.phases.map((p, idx) => (
            <div
              key={p.id}
              className="rounded-lg border border-[var(--gold)]/25 bg-background/60 p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className="text-sm font-bold uppercase tracking-wide text-[var(--gold)]"
                  style={{ textShadow: "0 0 10px color-mix(in oklab, var(--gold) 30%, transparent)" }}
                >
                  Fase {idx + 1} · {p.name}
                </p>
                <span className="text-[10px] font-mono uppercase text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {p.durationWeeks} sem
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{p.description}</p>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-muted-foreground">
                {p.dailyKcalTarget && (
                  <span className="border border-[var(--gold)]/20 rounded px-1.5 py-0.5">
                    {p.dailyKcalTarget} kcal/dia
                  </span>
                )}
                <span className="border border-[var(--gold)]/20 rounded px-1.5 py-0.5 inline-flex items-center gap-1">
                  <Droplets className="size-3" />
                  {(p.recommendations.waterMl / 1000).toFixed(1)}L
                </span>
                <span className="border border-[var(--gold)]/20 rounded px-1.5 py-0.5 inline-flex items-center gap-1">
                  <Moon className="size-3" />
                  {p.recommendations.sleepHours}h
                </span>
              </div>
              {p.recommendations.strategies.length > 0 && (
                <ul className="text-xs space-y-1 pt-1">
                  {p.recommendations.strategies.slice(0, 4).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[var(--gold)]">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={() => onStart(m)} className="bg-[var(--gold)] text-background hover:bg-[var(--gold)]/90">
            <Send className="size-4" />
            Iniciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhasesGrid({
  protocol,
  module: m,
  patientId,
  patientName,
}: {
  protocol: ProtocolDescriptor;
  module: ProtocolModule;
  patientId?: string;
  patientName?: string;
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
        initialPatientId={patientId}
        initialPatientName={patientName}
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

          {/* Estratégias-chave + Rotina de Chás (colapsáveis) */}
          <ProtocolPhaseSections phase={phase} />


          {/* Cardápio */}
          {phase.meals && phase.meals.length > 0 && (
            <Section title="Cardápio do Dia">
              <p className="text-[11px] text-muted-foreground mb-2">
                Clique em uma refeição para ver os alimentos, e em um alimento para ver as substituições.
              </p>
              <div className="space-y-2">
                {phase.meals.map((meal) => (
                  <PreviewMealCard key={meal.id} meal={meal} />
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
  initialPatientId,
  initialPatientName,
}: {
  protocol: ProtocolDescriptor;
  module: ProtocolModule;
  phase: ProtocolPhase | null;
  onClose: () => void;
  initialPatientId?: string;
  initialPatientName?: string;
}) {
  void initialPatientName;
  const [patient, setPatient] = useState<PatientLite | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const apply = useServerFn(applyProtocolPhase);
  const qc = useQueryClient();
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
    onSuccess: async () => {
      toast.success(`${phase!.name} atribuída a ${patient!.fullName}.`);
      setDone(patient!.fullName);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["patients-index"] }),
        qc.invalidateQueries({ queryKey: ["patient-detail", patient!.id] }),
        qc.invalidateQueries({ queryKey: ["my-patients-for-plan"] }),
        qc.invalidateQueries({ queryKey: ["protocol-enrollments"] }),
      ]);
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
            <RealPatientPicker value={patient} onChange={setPatient} initialPatientId={initialPatientId} />
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

function PreviewMealCard({ meal }: { meal: PhaseMeal }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[var(--gold)]/20 bg-background/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-[color-mix(in_oklab,var(--gold)_5%,transparent)] transition-colors"
        aria-expanded={open}
      >
        <span className="inline-flex size-9 items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--gold)_12%,transparent)] text-[var(--gold)] font-mono text-[10px] shrink-0">
          {meal.time}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground truncate">
            {meal.name}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {meal.items.length} {meal.items.length === 1 ? "alimento" : "alimentos"} · {meal.totalKcal} kcal
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-[var(--gold)] transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-[var(--gold)]/15 animate-fade-in pt-2">
          {meal.items.map((it, i) => (
            <PreviewFoodRow key={`${meal.id}-${i}`} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewFoodRow({ item }: { item: PhaseMealItem }) {
  const subs = item.substitutions ?? [];
  const hasSubs = subs.length > 0;
  const hasRecipe = (item.ingredients?.length ?? 0) > 0 || !!item.preparation;
  const hasDetail = hasSubs || hasRecipe;
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/60 bg-surface/40">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 p-2.5 text-left",
          hasDetail && "hover:bg-[color-mix(in_oklab,var(--gold)_4%,transparent)] transition-colors",
        )}
        aria-expanded={open}
        disabled={!hasDetail}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {item.householdMeasure}
            <span className="text-muted-foreground/60"> · {item.quantityG}g · {item.kcal} kcal</span>
          </p>
        </div>
        {hasDetail && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-[var(--gold)]/80 shrink-0">
            {hasSubs ? (
              <>
                <Replace className="size-3" />
                {subs.length} substituições
              </>
            ) : (
              <>receita</>
            )}
            <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
          </span>
        )}
      </button>
      {hasDetail && open && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/40 pt-2 animate-fade-in">
          {hasRecipe && (
            <div className="space-y-1.5">
              {item.ingredients && item.ingredients.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Ingredientes
                  </p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs text-foreground/90">
                    {item.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.preparation && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Modo de preparo
                  </p>
                  <p className="text-xs text-foreground/90 mt-1">{item.preparation}</p>
                </div>
              )}
              {item.usage && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Como usar
                  </p>
                  <p className="text-xs text-foreground/90 mt-1">{item.usage}</p>
                </div>
              )}
            </div>
          )}
          {hasSubs && (
            <ul className="space-y-1">
              {subs.map((s, i) => (
                <li
                  key={`${s.foodKey}-${i}`}
                  className="flex items-baseline justify-between gap-2 rounded border border-[var(--gold)]/15 bg-background/70 px-2 py-1.5 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-muted-foreground"> · {s.householdMeasure}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {s.quantityG}g · {s.kcal} kcal
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function EnrollmentsButton({ protocol }: { protocol: ProtocolDescriptor }) {
  const [open, setOpen] = useState(false);
  const fetchEnrollments = useServerFn(listProtocolEnrollments);
  const { data, isLoading } = useQuery({
    queryKey: ["protocol-enrollments", protocol.id],
    queryFn: () => fetchEnrollments({ data: { protocolId: protocol.id } }),
    enabled: open,
    staleTime: 30_000,
  });
  const count = data?.enrollments.length ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--gold)]/40 bg-[color-mix(in_oklab,var(--gold)_6%,transparent)] px-3.5 py-2 text-sm font-medium text-[var(--gold)] hover:bg-[color-mix(in_oklab,var(--gold)_12%,transparent)] transition-colors"
      >
        <Users className="size-4" />
        Pacientes neste protocolo
        {count > 0 && (
          <span className="ml-1 inline-flex items-center justify-center rounded-full bg-[var(--gold)] text-background text-[10px] font-mono px-1.5 py-0.5 min-w-5">
            {count}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogDescription className="text-[10px] font-mono uppercase tracking-widest">
              {protocol.name}
            </DialogDescription>
            <DialogTitle
              className="text-[var(--gold)] uppercase tracking-wide flex items-center gap-2"
              style={{ textShadow: "0 0 12px color-mix(in oklab, var(--gold) 30%, transparent)" }}
            >
              <Users className="size-4" />
              Pacientes ativos
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Carregando…</p>
          ) : !data?.enrollments.length ? (
            <div className="rounded-lg border border-border bg-surface p-6 text-center space-y-1">
              <p className="text-sm text-muted-foreground">
                Nenhum paciente está nesta jornada ainda.
              </p>
              <p className="text-[11px] text-muted-foreground/80">
                Aplique uma fase a um paciente para vê-lo aqui.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.enrollments.map((e) => (
                <EnrollmentRow key={e.id} row={e} />
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EnrollmentRow({ row }: { row: ProtocolEnrollmentRow }) {
  const daysLeft = (() => {
    if (!row.ends_at) return null;
    const ms = new Date(row.ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  })();
  return (
    <li className="rounded-lg border border-[var(--gold)]/20 bg-background/60 p-3 flex items-center gap-3">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--gold)_12%,transparent)] text-sm font-semibold text-[var(--gold)] shrink-0 overflow-hidden">
        {row.patient_avatar_url ? (
          <img src={row.patient_avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          row.patient_name.charAt(0).toUpperCase()
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{row.patient_name}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {row.module_name} · {row.phase_name}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-mono shrink-0",
          daysLeft !== null && daysLeft <= 3
            ? "border-amber-500/40 text-amber-500 bg-amber-500/5"
            : "border-[var(--gold)]/30 text-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_6%,transparent)]",
        )}
        title={row.ends_at ? `Fim previsto: ${new Date(row.ends_at).toLocaleDateString("pt-BR")}` : undefined}
      >
        <Timer className="size-3" />
        {daysLeft === null ? "—" : `${daysLeft} d`}
      </span>
    </li>
  );
}
