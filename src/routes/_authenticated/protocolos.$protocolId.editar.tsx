// Editor admin de Protocolos — adiciona dicas, chás, estratégias, pilares e
// regras por cima do catálogo hardcoded. Mudanças refletem em TODOS os
// pacientes (ativos inclusive) sem mexer no snapshot clínico de refeições.
//
// Apenas admin. Botão 👁 alterna preview vs edição.

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Eye,
  Pencil,
  Printer,
  Plus,
  Trash2,
  Leaf,
  ListChecks,
  Lightbulb,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Smile,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  findProtocolById,
  getProtocolModules,
  type ProtocolDescriptor,
  type ProtocolModule,
  type ProtocolPhase,
  type PhaseTea,
  type MethodologyPillar,
  type MethodologyRule,
} from "@/lib/protocols/catalog";
import {
  listProtocolOverrides,
  saveProtocolOverride,
} from "@/lib/protocols/overrides.functions";
import { indexOverrides, mergeModule, mergeGoldenTips } from "@/lib/protocols/apply-overrides";
import type { ProtocolOverridePayload } from "@/lib/protocols/overrides-types";
import type { GoldenTip, GoldenTipSize } from "@/lib/protocols/golden-tips";
import { getGoldenTipsFor } from "@/lib/protocols/golden-tips";
import { ProtocolPhaseSections } from "@/components/protocols/ProtocolPhaseSections";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/lib/auth-context";
import { escapeHtml, printHTML } from "@/lib/share-utils";

// Helper: move item in array (immutable)
function reorder<T>(arr: ReadonlyArray<T>, from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return [...arr];
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const EMOJI_GRID = [
  "✨","🔥","⏱️","💧","🥩","🥬","🥗","🍵","🌿","🍋","🍎","🥑","🥚",
  "🌾","🐟","🍯","🧂","🧘","🧠","💪","❤️","🛡️","⚡","🌙","☀️","🍽️",
  "📏","🩺","🩸","🧪","🧬","🌱","🥦","🥕","🍠","🍞","☕","🥤","🧉",
] as const;

function EmojiPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-16 h-9 px-0 text-lg" aria-label="Escolher emoji">
          {value || <Smile className="size-4 text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-8 gap-1 mb-2">
          {EMOJI_GRID.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange(e)}
              className={cn(
                "h-7 w-7 inline-flex items-center justify-center rounded text-lg hover:bg-accent",
                value === e && "ring-1 ring-[var(--gold)]",
              )}
            >
              {e}
            </button>
          ))}
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ou digite/cole"
          className="h-7 text-sm"
        />
      </PopoverContent>
    </Popover>
  );
}

function ReorderButtons({ i, total, onMove }: { i: number; total: number; onMove: (from: number, to: number) => void }) {
  return (
    <div className="flex flex-col">
      <Button size="icon" variant="ghost" className="h-5 w-6" disabled={i === 0} onClick={() => onMove(i, i - 1)} aria-label="Subir">
        <ArrowUp className="size-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-5 w-6" disabled={i === total - 1} onClick={() => onMove(i, i + 1)} aria-label="Descer">
        <ArrowDown className="size-3" />
      </Button>
    </div>
  );
}

function SizeButtons({ value, onChange }: { value?: GoldenTipSize; onChange: (v: GoldenTipSize) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        Tamanho
      </Label>
      <div className="flex gap-1">
        {(["sm", "md", "lg"] as GoldenTipSize[]).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={(value ?? "md") === s ? "default" : "outline"}
            className="h-6 px-2 text-[10px] uppercase"
            onClick={() => onChange(s)}
          >
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}


export const Route = createFileRoute("/_authenticated/protocolos/$protocolId/editar")({
  loader: ({ params }) => {
    const protocol = findProtocolById(params.protocolId);
    if (!protocol) throw notFound();
    return { protocol };
  },
  component: ProtocolEditorPage,
});

function ProtocolEditorPage() {
  const { protocol } = Route.useLoaderData();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [preview, setPreview] = useState(false);

  const fetchOverrides = useServerFn(listProtocolOverrides);
  const { data, isLoading } = useQuery({
    queryKey: ["protocol-overrides", protocol.id],
    queryFn: () => fetchOverrides({ data: { protocolId: protocol.id } }),
    staleTime: 30_000,
    enabled: isAdmin,
  });

  const overrides = data?.overrides ?? [];
  const idx = useMemo(() => indexOverrides(overrides), [overrides]);
  const modules = useMemo(() => getProtocolModules(protocol), [protocol]);

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl p-6">
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center space-y-2">
            <ShieldCheck className="size-8 text-destructive mx-auto" />
            <h1 className="text-lg font-semibold">Acesso restrito</h1>
            <p className="text-sm text-muted-foreground">
              Apenas administradores podem editar protocolos.
            </p>
            <Link to="/protocolos/$protocolId" params={{ protocolId: protocol.id }}>
              <Button variant="outline" className="mt-3">Voltar</Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-1 py-3 sm:p-6 space-y-5 sm:space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <Link
              to="/protocolos/$protocolId"
              params={{ protocolId: protocol.id }}
              className="inline-flex items-center gap-1 hover:text-[var(--gold)]"
            >
              <ArrowLeft className="size-3" /> Voltar ao protocolo
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <Sparkles className="size-4 text-[var(--gold)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)] border border-[var(--gold)]/50 rounded px-1.5 py-0.5 bg-[color-mix(in_oklab,var(--gold)_8%,transparent)]">
              Editor Admin
            </span>
            <Button
              size="sm"
              variant={preview ? "default" : "outline"}
              onClick={() => setPreview((v) => !v)}
            >
              {preview ? <Pencil className="size-3.5 mr-1.5" /> : <Eye className="size-3.5 mr-1.5" />}
              {preview ? "Voltar para edição" : "Visualizar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                printHTML({
                  title: `${protocol.name} · Protocolo`,
                  html: buildProtocolPrintHtml(protocol, modules, idx),
                })
              }
            >
              <Printer className="size-3.5 mr-1.5" /> PDF
            </Button>
          </div>
          <h1
            className="text-xl sm:text-2xl font-bold uppercase text-[var(--gold)] tracking-tight break-words"
            style={{ textShadow: "0 0 14px color-mix(in oklab, var(--gold) 30%, transparent)" }}
          >
            {protocol.name}
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Tudo que você adicionar aqui aparece para <strong>todos os pacientes</strong>, inclusive os
            que já têm o protocolo ativo. Refeições do paciente são imutáveis e <strong>não</strong> são
            editáveis nesta tela — ajuste-as no Editor de Planos.
          </p>
        </header>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando overrides…</div>
        ) : preview ? (
          <PreviewPane protocol={protocol} modules={modules} idx={idx} />
        ) : (
          <EditPane protocol={protocol} modules={modules} idx={idx} />
        )}
      </div>
    </AppShell>
  );
}

// =============================================================================
// PREVIEW
// =============================================================================
function PreviewPane({
  protocol,
  modules,
  idx,
}: {
  protocol: ProtocolDescriptor;
  modules: ReadonlyArray<ProtocolModule>;
  idx: ReturnType<typeof indexOverrides>;
}) {
  const baseTips = getGoldenTipsFor(protocol.id);
  const tips = mergeGoldenTips(baseTips, idx);
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--gold)]/25 bg-background/60 p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--gold)] mb-2">
          Dicas de Ouro (protocolo)
        </p>
        {tips.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem dicas.</p>
        ) : (
          <ul className="space-y-1.5">
            {tips.map((t, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span>{t.emoji}</span>
                <span>
                  <strong>{t.title}</strong>
                  <span className="text-muted-foreground"> — {t.objective}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modules.map((mod) => {
        const merged = mergeModule(mod, idx);
        return (
          <section key={mod.id} className="rounded-xl border border-border bg-surface/50 p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {merged.name}
            </h2>
            {merged.phases.map((p) => (
              <div key={p.id} className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2">
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--gold)]">
                  {p.name}
                </p>
                <ProtocolPhaseSections phase={p} />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

// =============================================================================
// EDIT
// =============================================================================
function EditPane({
  protocol,
  modules,
  idx,
}: {
  protocol: ProtocolDescriptor;
  modules: ReadonlyArray<ProtocolModule>;
  idx: ReturnType<typeof indexOverrides>;
}) {
  return (
    <div className="space-y-6">
      <ProtocolScopeEditor protocol={protocol} initial={idx.protocol} />
      {modules.map((mod) => (
        <ModuleScopeEditor key={mod.id} protocol={protocol} module={mod} idx={idx} />
      ))}
    </div>
  );
}

function ProtocolScopeEditor({
  protocol,
  initial,
}: {
  protocol: ProtocolDescriptor;
  initial: ProtocolOverridePayload;
}) {
  const [tips, setTips] = useState<GoldenTip[]>(() => [...(initial.goldenTips ?? [])]);
  useEffect(() => {
    setTips([...(initial.goldenTips ?? [])]);
  }, [initial]);

  const save = useSaveOverride();
  const handleSave = () =>
    save({
      protocolId: protocol.id,
      moduleId: null,
      phaseId: null,
      payload: { goldenTips: tips },
    });

  return (
    <section className="rounded-xl border border-[var(--gold)]/25 bg-background/60 p-4 space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-[var(--gold)]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Dicas de Ouro (protocolo inteiro)
          </h2>
        </div>
        <Button size="sm" onClick={handleSave} disabled={save.pending}>
          <Save className="size-3.5 mr-1.5" /> Salvar
        </Button>
      </header>
      <p className="text-xs text-muted-foreground">
        Dicas extras que aparecem na página principal do protocolo, após as dicas padrão.
      </p>
      <GoldenTipListEditor tips={tips} onChange={setTips} />
    </section>
  );
}

function EditableTitle({
  value,
  onSave,
  pending,
  className,
}: {
  value: string;
  onSave: (next: string) => void;
  pending?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <Input
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          variant="default"
          disabled={pending}
          onClick={() => {
            onSave(draft.trim() || value);
            setEditing(false);
          }}
        >
          <Save className="size-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setDraft(value); setEditing(false); }}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className={className}>{value}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        aria-label="Editar título"
        onClick={() => setEditing(true)}
      >
        <Pencil className="size-3.5 text-[var(--gold)]" />
      </Button>
    </div>
  );
}

function ModuleScopeEditor({
  protocol,
  module: mod,
  idx,
}: {
  protocol: ProtocolDescriptor;
  module: ProtocolModule;
  idx: ReturnType<typeof indexOverrides>;
}) {
  const modPayload = idx.modules.get(mod.id) ?? {};
  const displayName = modPayload.name ?? mod.name;
  const save = useSaveOverride();
  const handleSaveName = (name: string) =>
    save({
      protocolId: protocol.id,
      moduleId: mod.id,
      phaseId: null,
      payload: { ...modPayload, name },
    });

  return (
    <section className="rounded-xl border border-border bg-surface/50 p-4 space-y-4">
      <header className="flex items-center gap-2 flex-wrap">
        <Sparkles className="size-4 text-[var(--gold)] shrink-0" />
        <EditableTitle
          value={displayName}
          pending={save.pending}
          onSave={handleSaveName}
          className="text-sm font-semibold uppercase tracking-wide text-foreground break-words"
        />
      </header>
      {mod.phases.map((phase) => (
        <PhaseEditor
          key={phase.id}
          protocol={protocol}
          module={mod}
          phase={phase}
          initial={idx.phases.get(`${mod.id}::${phase.id}`) ?? {}}
        />
      ))}
    </section>
  );
}

function PhaseEditor({
  protocol,
  module: mod,
  phase,
  initial,
}: {
  protocol: ProtocolDescriptor;
  module: ProtocolModule;
  phase: ProtocolPhase;
  initial: ProtocolOverridePayload;
}) {
  const [name, setName] = useState<string>(() => initial.name ?? phase.name);
  const [tips, setTips] = useState<GoldenTip[]>(() => [...(initial.tips ?? [])]);
  const [teas, setTeas] = useState<PhaseTea[]>(() => [...(initial.teas ?? [])]);
  const [strategies, setStrategies] = useState<string[]>(() => [...(initial.strategies ?? [])]);
  const [pillars, setPillars] = useState<MethodologyPillar[]>(() => [...(initial.pillars ?? [])]);
  const [rules, setRules] = useState<MethodologyRule[]>(() => [...(initial.rules ?? [])]);

  useEffect(() => {
    setName(initial.name ?? phase.name);
    setTips([...(initial.tips ?? [])]);
    setTeas([...(initial.teas ?? [])]);
    setStrategies([...(initial.strategies ?? [])]);
    setPillars([...(initial.pillars ?? [])]);
    setRules([...(initial.rules ?? [])]);
  }, [initial, phase.name]);

  const save = useSaveOverride();
  const buildPayload = (overrideName?: string): ProtocolOverridePayload => ({
    name: (overrideName ?? name) !== phase.name ? (overrideName ?? name) : undefined,
    tips, teas, strategies, pillars, rules,
  });
  const handleSave = () =>
    save({
      protocolId: protocol.id,
      moduleId: mod.id,
      phaseId: phase.id,
      payload: buildPayload(),
    });
  const handleSaveName = (next: string) => {
    setName(next);
    save({
      protocolId: protocol.id,
      moduleId: mod.id,
      phaseId: phase.id,
      payload: buildPayload(next),
    });
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <EditableTitle
          value={name}
          pending={save.pending}
          onSave={handleSaveName}
          className="text-xs font-mono uppercase tracking-widest text-[var(--gold)] break-words"
        />
        <Button size="sm" variant="outline" onClick={handleSave} disabled={save.pending}>
          <Save className="size-3.5 mr-1.5" /> Salvar fase
        </Button>
      </header>

      <CollapsibleBlock title="Estratégias-chave (+)" icon={<ListChecks className="size-3.5" />}>
        <StringListEditor
          values={strategies}
          onChange={setStrategies}
          placeholder="Ex: Beber 500 ml de água 10 min antes da refeição"
        />
      </CollapsibleBlock>

      <CollapsibleBlock title="Rotina de chás (+)" icon={<Leaf className="size-3.5" />}>
        <TeaListEditor teas={teas} onChange={setTeas} />
      </CollapsibleBlock>

      <CollapsibleBlock title="Dicas da fase (+)" icon={<Lightbulb className="size-3.5" />}>
        <GoldenTipListEditor tips={tips} onChange={setTips} />
      </CollapsibleBlock>

      <CollapsibleBlock title="Pilares de metodologia (+)" icon={<Sparkles className="size-3.5" />}>
        <PillarListEditor pillars={pillars} onChange={setPillars} />
      </CollapsibleBlock>

      <CollapsibleBlock title="Regras comportamentais (+)" icon={<ShieldCheck className="size-3.5" />}>
        <RuleListEditor rules={rules} onChange={setRules} />
      </CollapsibleBlock>
    </div>
  );
}

// =============================================================================
// Sub-editors
// =============================================================================
function CollapsibleBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs font-mono uppercase tracking-widest text-[var(--gold)] hover:bg-[color-mix(in_oklab,var(--gold)_5%,transparent)]"
      >
        <span className="text-[var(--gold)]">{icon}</span>
        <span className="flex-1">{title}</span>
        <span className="text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="border-t border-border/40 p-2.5 space-y-2 animate-fade-in">{children}</div>}
    </div>
  );
}

function StringListEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex gap-1.5 items-start">
          <ReorderButtons i={i} total={values.length} onMove={(f, t) => onChange(reorder(values, f, t))} />
          <Input
            value={v}
            placeholder={placeholder}
            onChange={(e) => {
              const n = [...values];
              n[i] = e.target.value;
              onChange(n);
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            aria-label="Remover"
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...values, ""])}>
        <Plus className="size-3.5 mr-1.5" /> Adicionar
      </Button>
    </div>
  );
}


function GoldenTipListEditor({
  tips,
  onChange,
}: {
  tips: GoldenTip[];
  onChange: (v: GoldenTip[]) => void;
}) {
  const update = (i: number, patch: Partial<GoldenTip>) => {
    const n = [...tips];
    n[i] = { ...n[i], ...patch };
    onChange(n);
  };
  return (
    <div className="space-y-3">
      {tips.map((t, i) => (
        <div key={i} className="rounded-md border border-border/60 bg-background/60 p-2.5 space-y-2">
          <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] gap-1.5 items-start">
            <ReorderButtons i={i} total={tips.length} onMove={(f, to) => onChange(reorder(tips, f, to))} />
            <EmojiPicker value={t.emoji} onChange={(v) => update(i, { emoji: v })} />
            <Input
              className="flex-1"
              value={t.title}
              placeholder="Título da dica"
              onChange={(e) => update(i, { title: e.target.value })}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onChange(tips.filter((_, j) => j !== i))}
              aria-label="Remover"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Tamanho do card
            </Label>
            <div className="flex gap-1">
              {(["sm", "md", "lg"] as GoldenTipSize[]).map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={(t.size ?? "md") === s ? "default" : "outline"}
                  className="h-6 px-2 text-[10px] uppercase"
                  onClick={() => update(i, { size: s })}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <Input
            value={t.objective}
            placeholder="Objetivo"
            onChange={(e) => update(i, { objective: e.target.value })}
          />
          <Textarea
            rows={2}
            value={(t.howTo ?? []).join("\n")}
            placeholder="Passo 1&#10;Passo 2"
            onChange={(e) => update(i, { howTo: e.target.value.split("\n").filter(Boolean) })}
          />
          <Input
            value={t.benefit ?? ""}
            placeholder="Benefício (opcional)"
            onChange={(e) => update(i, { benefit: e.target.value || undefined })}
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          onChange([...tips, { emoji: "✨", title: "", objective: "", howTo: [""], size: "md" }])
        }
      >
        <Plus className="size-3.5 mr-1.5" /> Adicionar dica
      </Button>
    </div>
  );
}


function TeaListEditor({
  teas,
  onChange,
}: {
  teas: PhaseTea[];
  onChange: (v: PhaseTea[]) => void;
}) {
  const update = (i: number, patch: Partial<PhaseTea>) => {
    const n = [...teas];
    n[i] = { ...n[i], ...patch };
    onChange(n);
  };
  return (
    <div className="space-y-3">
      {teas.map((t, i) => (
        <div key={i} className="rounded-md border border-border/60 bg-background/60 p-2.5 space-y-2">
          <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] gap-1.5 items-start">
            <ReorderButtons i={i} total={teas.length} onMove={(f, to) => onChange(reorder(teas, f, to))} />
            <EmojiPicker value={t.emoji ?? ""} onChange={(v) => update(i, { emoji: v })} />
            <Input
              value={t.name}
              placeholder="Nome do chá"
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onChange(teas.filter((_, j) => j !== i))}
              aria-label="Remover"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>

          <SizeButtons value={t.size} onChange={(s) => update(i, { size: s })} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <Input
              value={t.quantity ?? ""}
              placeholder="Quantidade (ex: 300 ml)"
              onChange={(e) => update(i, { quantity: e.target.value || undefined })}
            />
            <Input
              value={t.timesPerDay ?? ""}
              placeholder="Frequência (ex: 2× ao dia)"
              onChange={(e) => update(i, { timesPerDay: e.target.value || undefined })}
            />
          </div>
          <Textarea
            rows={2}
            value={t.preparation ?? ""}
            placeholder="Modo de preparo"
            onChange={(e) => update(i, { preparation: e.target.value || undefined })}
          />
          <Input
            value={t.benefits ?? ""}
            placeholder="Benefícios"
            onChange={(e) => update(i, { benefits: e.target.value || undefined })}
          />
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...teas, { name: "" }])}>
        <Plus className="size-3.5 mr-1.5" /> Adicionar chá
      </Button>
    </div>
  );
}

function PillarListEditor({
  pillars,
  onChange,
}: {
  pillars: MethodologyPillar[];
  onChange: (v: MethodologyPillar[]) => void;
}) {
  const update = (i: number, patch: Partial<MethodologyPillar>) => {
    const n = [...pillars];
    n[i] = { ...n[i], ...patch };
    onChange(n);
  };
  return (
    <div className="space-y-3">
      {pillars.map((p, i) => (
        <div key={i} className="rounded-md border border-border/60 bg-background/60 p-2.5 space-y-2">
          <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] gap-1.5 items-start">
            <ReorderButtons i={i} total={pillars.length} onMove={(f, to) => onChange(reorder(pillars, f, to))} />
            <EmojiPicker value={p.emoji ?? ""} onChange={(v) => update(i, { emoji: v })} />
            <Input
              value={p.title}
              placeholder="Título"
              onChange={(e) => update(i, { title: e.target.value })}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onChange(pillars.filter((_, j) => j !== i))}
              aria-label="Remover"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>

          <SizeButtons value={p.size} onChange={(s) => update(i, { size: s })} />

          <Textarea
            rows={2}
            value={p.summary}
            placeholder="Resumo"
            onChange={(e) => update(i, { summary: e.target.value })}
          />
          <Input
            value={(p.examples ?? []).join(", ")}
            placeholder="Exemplos separados por vírgula"
            onChange={(e) =>
              update(i, {
                examples: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onChange([...pillars, { title: "", summary: "" }])}
      >
        <Plus className="size-3.5 mr-1.5" /> Adicionar pilar
      </Button>
    </div>
  );
}

function RuleListEditor({
  rules,
  onChange,
}: {
  rules: MethodologyRule[];
  onChange: (v: MethodologyRule[]) => void;
}) {
  const update = (i: number, patch: Partial<MethodologyRule>) => {
    const n = [...rules];
    n[i] = { ...n[i], ...patch };
    onChange(n);
  };
  return (
    <div className="space-y-3">
      {rules.map((r, i) => (
        <div key={i} className="rounded-md border border-border/60 bg-background/60 p-2.5 space-y-2">
          <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] gap-1.5 items-start">
            <ReorderButtons i={i} total={rules.length} onMove={(f, to) => onChange(reorder(rules, f, to))} />
            <EmojiPicker value={r.emoji ?? ""} onChange={(v) => update(i, { emoji: v })} />
            <Input
              value={r.name}
              placeholder="Nome da regra"
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onChange(rules.filter((_, j) => j !== i))}
              aria-label="Remover"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>

          <SizeButtons value={r.size} onChange={(s) => update(i, { size: s })} />

          <Textarea
            rows={2}
            value={r.description}
            placeholder="Descrição"
            onChange={(e) => update(i, { description: e.target.value })}
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onChange([...rules, { name: "", description: "" }])}
      >
        <Plus className="size-3.5 mr-1.5" /> Adicionar regra
      </Button>
    </div>
  );
}

// =============================================================================
// Save hook
// =============================================================================
function useSaveOverride() {
  const qc = useQueryClient();
  const fn = useServerFn(saveProtocolOverride);
  const m = useMutation({
    mutationFn: (input: {
      protocolId: string;
      moduleId: string | null;
      phaseId: number | null;
      payload: ProtocolOverridePayload;
    }) => fn({ data: input }),
    onSuccess: (_r, vars) => {
      toast.success("Salvo. Mudanças visíveis para todos os pacientes.");
      qc.invalidateQueries({ queryKey: ["protocol-overrides", vars.protocolId] });
      qc.invalidateQueries({ queryKey: ["protocol-overrides-all"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });
  const call = (input: {
    protocolId: string;
    moduleId: string | null;
    phaseId: number | null;
    payload: ProtocolOverridePayload;
  }) => m.mutate(input);
  return Object.assign(call, { pending: m.isPending });
}
