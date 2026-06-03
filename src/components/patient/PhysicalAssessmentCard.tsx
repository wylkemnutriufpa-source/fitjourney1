// Card unificado de Avaliação Física no perfil do paciente (profissional).
// Mostra: avaliação atual + histórico + botão "Nova avaliação" (abre modal).
// Sem subrotas. Sem segunda fonte. Sempre 1 entidade com histórico.

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Plus, History, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createPhysicalAssessment,
  listPhysicalAssessmentsForPatient,
  type PhysicalAssessment,
} from "@/lib/physical-assessments/physical-assessments.functions";

function fmt(value: number | null, unit = "", digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

type Props = { patientId: string };

export function PhysicalAssessmentCard({ patientId }: Props) {
  const listFn = useServerFn(listPhysicalAssessmentsForPatient);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["physical-assessments", patientId],
    queryFn: () => listFn({ data: { patientId } }),
    staleTime: 30_000,
  });

  const list = data ?? [];
  const current = list[0] ?? null;
  const history = list.slice(1);

  return (
    <section className="bg-surface border border-border rounded-lg p-6 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Avaliação Física
          </p>
          <h3 className="text-lg font-semibold mt-1 flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            {current
              ? `Atual · ${fmtDate(current.assessedAt)}`
              : "Nenhuma avaliação registrada"}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          Nova avaliação
        </button>
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin" /> Carregando…
        </p>
      )}

      {!isLoading && !current && (
        <p className="text-xs text-muted-foreground">
          Registre a primeira avaliação física. Cada nova avaliação cria um
          ponto no histórico — nada é sobrescrito. O peso mais recente
          alimenta automaticamente o ClinicalContext.
        </p>
      )}

      {current && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Peso" value={fmt(current.weightKg, "kg", 1)} />
          <Metric label="Altura" value={fmt(current.heightCm, "cm", 0)} />
          <Metric label="% Gordura" value={fmt(current.bodyFatPct, "%", 1)} />
          <Metric label="Massa magra" value={fmt(current.leanMassKg, "kg", 1)} />
          <Metric label="Cintura" value={fmt(current.waistCm, "cm", 1)} />
          <Metric label="Abdômen" value={fmt(current.abdomenCm, "cm", 1)} />
          <Metric label="Quadril" value={fmt(current.hipCm, "cm", 1)} />
          <Metric label="Braço c." value={fmt(current.armContractedCm, "cm", 1)} />
        </div>
      )}

      {current?.notes && (
        <p className="text-xs text-muted-foreground border-l-2 border-border pl-3 italic">
          {current.notes}
        </p>
      )}

      {history.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-foreground py-2">
            <History className="size-3.5" />
            Histórico · {history.length} avaliação{history.length === 1 ? "" : "es"} anterior{history.length === 1 ? "" : "es"}
          </summary>
          <ul className="mt-2 space-y-1.5">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between border border-border rounded-md px-3 py-2 font-mono text-[11px]"
              >
                <span>{fmtDate(h.assessedAt)}</span>
                <span className="flex items-center gap-3 text-muted-foreground">
                  <span>{fmt(h.weightKg, "kg", 1)}</span>
                  <span>{fmt(h.bodyFatPct, "%", 1)}</span>
                  <span>{fmt(h.waistCm, "cm cint", 1)}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <NewAssessmentDialog
        open={open}
        onOpenChange={setOpen}
        patientId={patientId}
        previous={current}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["physical-assessments", patientId] });
          qc.invalidateQueries({ queryKey: ["patient-detail", patientId] });
          qc.invalidateQueries({ queryKey: ["patient-clinical-context", patientId] });
        }}
      />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/60 px-3 py-2">
      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// New assessment dialog
// ----------------------------------------------------------------------------

type FormState = Record<string, string>;

const FIELDS: Array<{ name: keyof PhysicalAssessment | string; label: string; unit: string; step?: string }> = [
  { name: "weightKg", label: "Peso", unit: "kg", step: "0.1" },
  { name: "heightCm", label: "Altura", unit: "cm", step: "0.1" },
  { name: "bodyFatPct", label: "% Gordura", unit: "%", step: "0.1" },
  { name: "leanMassKg", label: "Massa magra", unit: "kg", step: "0.1" },
  { name: "fatMassKg", label: "Massa gorda", unit: "kg", step: "0.1" },
  { name: "visceralFat", label: "G. visceral", unit: "", step: "0.1" },
  { name: "neckCm", label: "Pescoço", unit: "cm", step: "0.1" },
  { name: "chestCm", label: "Tórax", unit: "cm", step: "0.1" },
  { name: "waistCm", label: "Cintura", unit: "cm", step: "0.1" },
  { name: "abdomenCm", label: "Abdômen", unit: "cm", step: "0.1" },
  { name: "hipCm", label: "Quadril", unit: "cm", step: "0.1" },
  { name: "armRelaxedCm", label: "Braço relax.", unit: "cm", step: "0.1" },
  { name: "armContractedCm", label: "Braço contr.", unit: "cm", step: "0.1" },
  { name: "forearmCm", label: "Antebraço", unit: "cm", step: "0.1" },
  { name: "thighCm", label: "Coxa", unit: "cm", step: "0.1" },
  { name: "calfCm", label: "Panturrilha", unit: "cm", step: "0.1" },
];

function NewAssessmentDialog({
  open,
  onOpenChange,
  patientId,
  previous,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  previous: PhysicalAssessment | null;
  onSaved: () => void;
}) {
  const createFn = useServerFn(createPhysicalAssessment);
  const [form, setForm] = useState<FormState>({});
  const [notes, setNotes] = useState("");
  const [assessedAt, setAssessedAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-preenche com a avaliação anterior (continuidade).
  function ensureSeed() {
    if (!previous || Object.keys(form).length > 0) return;
    const seed: FormState = {};
    for (const f of FIELDS) {
      const v = (previous as any)[f.name];
      if (v != null) seed[f.name as string] = String(v);
    }
    setForm(seed);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data: any = {
        patientId,
        assessedAt: new Date(assessedAt + "T12:00:00").toISOString(),
        notes: notes.trim() ? notes.trim() : null,
      };
      for (const f of FIELDS) {
        const raw = form[f.name as string];
        if (raw == null || raw === "") continue;
        const n = Number(raw.replace(",", "."));
        if (Number.isFinite(n)) data[f.name as string] = n;
      }
      await createFn({ data });
      onSaved();
      onOpenChange(false);
      setForm({});
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) ensureSeed();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            Nova avaliação física
          </DialogTitle>
          <DialogDescription className="text-xs">
            Registre os valores medidos hoje. Cada avaliação é um novo ponto
            no histórico — nada é sobrescrito.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Data da avaliação
            </label>
            <input
              type="date"
              value={assessedAt}
              onChange={(e) => setAssessedAt(e.target.value)}
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FIELDS.map((f) => (
              <div key={f.name as string}>
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {f.label}
                  {f.unit && <span className="opacity-60"> ({f.unit})</span>}
                </label>
                <input
                  type="number"
                  step={f.step ?? "0.1"}
                  value={form[f.name as string] ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.name as string]: e.target.value }))
                  }
                  className="mt-1 w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              placeholder="Protocolo, equipamento, contexto…"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium py-2 px-3 rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5 inline mr-1" /> Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 rounded-md hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Salvando…
                </>
              ) : (
                <>
                  <Plus className="size-3.5" /> Registrar avaliação
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
