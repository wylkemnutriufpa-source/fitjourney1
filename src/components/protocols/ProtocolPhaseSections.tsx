// Seções premium do protocolo: "Estratégias-chave" e "Rotina de Chás",
// ambas com Collapsible. Cada chá é também Collapsible (nome → quantidade,
// modo de preparo, frequência diária, observação). Read-only — a camada
// editável do nutri (override + botão +) chega num passo seguinte.
//
// Reusada por:
//   - /meu-plano/protocolos (paciente)
//   - /protocolos/$protocolId (cat\u00e1logo)
//
// Determinístico, sem IO.

import { useState } from "react";
import { ChevronDown, Leaf, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProtocolPhase, PhaseTea } from "@/lib/protocols/catalog";

export type TeaRow = {
  name: string;
  time?: string;
  quantity?: string;
  ingredients?: ReadonlyArray<string>;
  preparation?: string;
  timesPerDay?: string;
  benefits?: string;
  note?: string;
  emoji?: string;
};

/** Constrói a lista de chás a partir do snapshot da fase. */
export function buildTeaRows(phase: ProtocolPhase): TeaRow[] {
  const fromSchedule: TeaRow[] = (phase.teaSchedule ?? []).map((t: PhaseTea) => ({
    name: t.name,
    time: t.time,
    quantity: t.quantity,
    ingredients: t.ingredients,
    preparation: t.preparation,
    timesPerDay: t.timesPerDay,
    benefits: t.benefits,
    note: t.notes,
    emoji: t.emoji,
  }));
  if (fromSchedule.length > 0) return fromSchedule;
  // Fallback: derivar de teaRoutine (strings livres). Nome = string toda.
  return (phase.recommendations.teaRoutine ?? []).map((s) => ({ name: s }));
}

export function ProtocolPhaseSections({
  phase,
  className,
}: {
  phase: ProtocolPhase;
  className?: string;
}) {
  const teas = buildTeaRows(phase);
  const strategies = phase.recommendations.strategies ?? [];
  const special = phase.specialFeature;
  const hasStrategies = strategies.length > 0;
  const hasTeas = teas.length > 0;
  const hasSpecial = !!special;

  return (
    <div className={cn("space-y-3", className)}>
      {hasSpecial && (
        <SectionCollapsible
          title="Elementos especiais"
          icon={<Sparkles className="size-3.5" />}
          countLabel={special!.name}
          defaultOpen
        >
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">{special!.name}</p>
            <dl className="space-y-1.5 text-xs">
              {special!.description && <DetailRow label="Descrição" value={special!.description} />}
              {special!.recipe && <DetailRow label="Receita" value={special!.recipe} />}
              {special!.usage && <DetailRow label="Como usar" value={special!.usage} />}
              {special!.benefits && <DetailRow label="Benefícios" value={special!.benefits} />}
              {special!.notes && <DetailRow label="Observação" value={special!.notes} />}
            </dl>
          </div>
        </SectionCollapsible>
      )}

      {hasStrategies && (
        <SectionCollapsible
          title="Estratégias-chave"
          icon={<ListChecks className="size-3.5" />}
          countLabel={`${strategies.length} ${strategies.length === 1 ? "item" : "itens"}`}
          defaultOpen
        >
          <ul className="space-y-1.5">
            {strategies.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm rounded-md border border-border/40 bg-background/60 px-2.5 py-2"
              >
                <span className="text-[var(--gold)] mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </SectionCollapsible>
      )}

      {hasTeas && (
        <SectionCollapsible
          title="Rotina de Chás"
          icon={<Leaf className="size-3.5" />}
          countLabel={`${teas.length} ${teas.length === 1 ? "chá" : "chás"}`}
          defaultOpen
        >
          <div className="space-y-1.5">
            {teas.map((t, i) => (
              <TeaRowCard key={`${t.name}-${i}`} index={i + 1} tea={t} />
            ))}
          </div>
        </SectionCollapsible>
      )}
    </div>
  );
}

function SectionCollapsible({
  title,
  icon,
  countLabel,
  defaultOpen,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  countLabel?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <section className="rounded-xl border border-[var(--gold)]/20 bg-background/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[color-mix(in_oklab,var(--gold)_5%,transparent)] transition-colors"
      >
        <span className="text-[var(--gold)]">{icon}</span>
        <span className="flex-1 text-[10px] font-mono uppercase tracking-widest text-[var(--gold)]">
          {title}
        </span>
        {countLabel && (
          <span className="text-[10px] font-mono text-muted-foreground">{countLabel}</span>
        )}
        <ChevronDown
          className={cn("size-3.5 text-[var(--gold)] transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--gold)]/15 animate-fade-in">
          {children}
        </div>
      )}
    </section>
  );
}

function TeaRowCard({ tea, index }: { tea: TeaRow; index: number }) {
  const hasDetail =
    !!tea.quantity ||
    !!tea.preparation ||
    !!tea.timesPerDay ||
    !!tea.benefits ||
    !!tea.note ||
    !!tea.time ||
    (tea.ingredients?.length ?? 0) > 0;
  const [open, setOpen] = useState(hasDetail);

  return (
    <div className="rounded-lg border border-border/60 bg-surface/40">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        aria-expanded={open}
        disabled={!hasDetail}
        className={cn(
          "w-full flex items-center gap-2.5 px-2.5 py-2 text-left",
          hasDetail &&
            "hover:bg-[color-mix(in_oklab,var(--gold)_4%,transparent)] transition-colors",
        )}
      >
        <span className="inline-flex size-6 items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--gold)_12%,transparent)] text-[var(--gold)] font-mono text-[10px] shrink-0">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{tea.name}</p>
          {(tea.time || tea.timesPerDay) && (
            <p className="text-[11px] text-muted-foreground">
              {tea.time && <span className="font-mono">{tea.time}</span>}
              {tea.time && tea.timesPerDay && <span> · </span>}
              {tea.timesPerDay}
            </p>
          )}
        </div>
        {hasDetail && (
          <ChevronDown
            className={cn(
              "size-3.5 text-[var(--gold)] shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {hasDetail && open && (
        <dl className="px-2.5 pb-2.5 pt-1.5 border-t border-border/40 space-y-1.5 animate-fade-in text-xs">
          {tea.quantity && <DetailRow label="Quantidade" value={tea.quantity} />}
          {tea.ingredients && tea.ingredients.length > 0 && (
            <div className="flex gap-2">
              <dt className="font-mono uppercase tracking-wider text-[10px] text-muted-foreground shrink-0 min-w-[5.5rem]">
                Ingredientes
              </dt>
              <dd className="text-foreground/90 flex-1">
                <ul className="list-disc pl-4 space-y-0.5">
                  {tea.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {tea.preparation && <DetailRow label="Modo de preparo" value={tea.preparation} />}
          {tea.timesPerDay && <DetailRow label="Frequência" value={tea.timesPerDay} />}
          {tea.benefits && <DetailRow label="Benefícios" value={tea.benefits} />}
          {tea.note && <DetailRow label="Observação" value={tea.note} />}
        </dl>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-mono uppercase tracking-wider text-[10px] text-muted-foreground shrink-0 min-w-[5.5rem]">
        {label}
      </dt>
      <dd className="text-foreground/90 flex-1">{value}</dd>
    </div>
  );
}
