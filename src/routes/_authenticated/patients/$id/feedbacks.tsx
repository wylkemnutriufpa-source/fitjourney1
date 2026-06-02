// Nutri — visualiza, EDITA e ARQUIVA feedbacks de um paciente seu.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  listPatientFeedbacks,
  getSignedFeedbackPhotoUrl,
  editPatientFeedback,
  softDeletePatientFeedback,
  type FeedbackDTO,
} from "@/lib/feedback/feedback.functions";
import { adherenceLabel, resultLabel } from "@/lib/feedback/copy";
import { FeedbackChart } from "@/components/feedback/FeedbackChart";
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/_authenticated/patients/$id/feedbacks",
)({
  head: () => ({ meta: [{ title: "Feedbacks do paciente — FitJourney" }] }),
  component: PatientFeedbacksPage,
});

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PatientFeedbacksPage() {
  const { id } = Route.useParams();
  const list = useServerFn(listPatientFeedbacks);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FeedbackDTO | null>(null);
  const [deleting, setDeleting] = useState<FeedbackDTO | null>(null);

  const { data: patientRow } = useQuery({
    queryKey: ["patient-height", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("full_name, height_cm")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 60_000,
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["patient-feedbacks", id],
    queryFn: () => list({ data: { patientId: id } }),
    staleTime: 10_000,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["patient-feedbacks", id] });
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        <header className="border-b border-border pb-4 space-y-1">
          <Link
            to="/patients/$id"
            params={{ id }}
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Perfil do paciente
          </Link>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground pt-1">
            Acompanhamento
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Feedbacks{patientRow?.full_name ? ` — ${patientRow.full_name}` : ""}
          </h1>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <>
            <FeedbackChart
              feedbacks={data}
              fallbackHeightCm={
                patientRow?.height_cm ? Number(patientRow.height_cm) : null
              }
            />

            <section className="space-y-3">
              <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                Histórico ({data.length})
              </h2>
              {data.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Este paciente ainda não enviou nenhum feedback.
                </div>
              ) : (
                data.map((f, idx) => {
                  const previous = data[idx + 1];
                  const delta =
                    f.weightKg != null && previous?.weightKg != null
                      ? Math.round((f.weightKg - previous.weightKg) * 10) / 10
                      : null;
                  return (
                    <article
                      key={f.id}
                      className="rounded-lg border border-border bg-surface p-4 sm:p-5 space-y-3"
                    >
                      <header className="flex items-baseline justify-between gap-3 flex-wrap">
                        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                          {fmtDateTime(f.createdAt)}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(f)}
                            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                            title="Editar feedback"
                          >
                            <Pencil className="size-3.5" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(f)}
                            className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-destructive/10"
                            title="Arquivar feedback"
                          >
                            <Trash2 className="size-3.5" /> Arquivar
                          </button>
                        </div>
                      </header>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <Cell label="Peso">
                          {f.weightKg != null ? `${f.weightKg.toFixed(1)} kg` : "—"}
                          {delta != null && (
                            <p className="text-[10px] font-mono text-muted-foreground tabular-nums">
                              {delta > 0 ? "+" : ""}
                              {delta.toFixed(1)} kg
                            </p>
                          )}
                        </Cell>
                        <Cell label="Aderência">{adherenceLabel(f.adherenceRating)}</Cell>
                        <Cell label="Resultado">{resultLabel(f.resultRating)}</Cell>
                        <Cell label="Fotos">
                          {[f.photoFrontPath, f.photoSidePath, f.photoBackPath].filter(
                            Boolean,
                          ).length || "—"}
                        </Cell>
                      </div>
                      {f.notes && (
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap border-l-2 border-primary/40 pl-3">
                          {f.notes}
                        </p>
                      )}
                      {(f.photoFrontPath || f.photoSidePath || f.photoBackPath) && (
                        <div className="flex gap-2 pt-1 flex-wrap">
                          {f.photoFrontPath && <Thumb path={f.photoFrontPath} label="Frontal" />}
                          {f.photoSidePath && <Thumb path={f.photoSidePath} label="Lateral" />}
                          {f.photoBackPath && <Thumb path={f.photoBackPath} label="Costas" />}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </section>
          </>
        )}
      </div>

      {editing && (
        <EditFeedbackDialog
          feedback={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}
      {deleting && (
        <DeleteFeedbackDialog
          feedback={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            invalidate();
          }}
        />
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const INPUT_CLS =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{children}</p>
    </div>
  );
}

function Thumb({ path, label }: { path: string; label: string }) {
  const sign = useServerFn(getSignedFeedbackPhotoUrl);
  const { data, isLoading } = useQuery({
    queryKey: ["feedback-photo", path],
    queryFn: () => sign({ data: { path } }),
    staleTime: 5 * 60 * 1000,
  });
  return (
    <a
      href={data?.url}
      target="_blank"
      rel="noreferrer"
      className="relative size-24 rounded-md border border-border overflow-hidden bg-background grid place-items-center hover:border-primary/60 transition-colors"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : data?.url ? (
        <img src={data.url} alt={label} className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-5 text-muted-foreground" />
      )}
      <span className="absolute bottom-0 inset-x-0 bg-background/80 backdrop-blur text-[9px] font-mono uppercase tracking-widest text-center py-0.5">
        {label}
      </span>
    </a>
  );
}

// ---------------- Edit dialog ----------------
function EditFeedbackDialog({
  feedback,
  onClose,
  onSaved,
}: {
  feedback: FeedbackDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const edit = useServerFn(editPatientFeedback);
  const [form, setForm] = useState({
    weightKg: feedback.weightKg?.toString() ?? "",
    waistCm: feedback.waistCm?.toString() ?? "",
    abdomenCm: feedback.abdomenCm?.toString() ?? "",
    hipCm: feedback.hipCm?.toString() ?? "",
    notes: feedback.notes ?? "",
    adherenceRating: feedback.adherenceRating,
    resultRating: feedback.resultRating ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function parseNum(s: string): number | null {
    const v = s.trim().replace(",", ".");
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      await edit({
        data: {
          id: feedback.id,
          weightKg: parseNum(form.weightKg),
          waistCm: parseNum(form.waistCm),
          abdomenCm: parseNum(form.abdomenCm),
          hipCm: parseNum(form.hipCm),
          notes: form.notes,
          adherenceRating: form.adherenceRating,
          resultRating: (form.resultRating || null) as any,
        },
      });
      onSaved();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Editar feedback" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso (kg)">
            <input
              type="text"
              inputMode="decimal"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Cintura (cm)">
            <input
              type="text"
              inputMode="decimal"
              value={form.waistCm}
              onChange={(e) => setForm({ ...form, waistCm: e.target.value })}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Abdômen (cm)">
            <input
              type="text"
              inputMode="decimal"
              value={form.abdomenCm}
              onChange={(e) => setForm({ ...form, abdomenCm: e.target.value })}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Quadril (cm)">
            <input
              type="text"
              inputMode="decimal"
              value={form.hipCm}
              onChange={(e) => setForm({ ...form, hipCm: e.target.value })}
              className={INPUT_CLS}
            />
          </Field>
        </div>
        <Field label="Aderência">
          <select
            value={form.adherenceRating}
            onChange={(e) =>
              setForm({ ...form, adherenceRating: e.target.value as any })
            }
            className={INPUT_CLS}
          >
            <option value="muito_dificil">Muito difícil</option>
            <option value="dificil">Difícil</option>
            <option value="neutro">Neutro</option>
            <option value="facil">Fácil</option>
            <option value="muito_facil">Muito fácil</option>
          </select>
        </Field>
        <Field label="Resultado percebido">
          <select
            value={form.resultRating}
            onChange={(e) =>
              setForm({ ...form, resultRating: e.target.value as any })
            }
            className={INPUT_CLS}
          >
            <option value="">— sem avaliação —</option>
            <option value="piores">Piorou</option>
            <option value="abaixo">Abaixo do esperado</option>
            <option value="dentro">Dentro do esperado</option>
            <option value="acima">Acima do esperado</option>
          </select>
        </Field>
        <Field label="Notas">
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className={INPUT_CLS}
          />
        </Field>
        {err && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
            {err}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Esta edição fica registrada (quem editou e quando).
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onClose}
          disabled={saving}
          className="px-3 py-2 text-sm rounded border border-border hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </button>
      </div>
    </Modal>
  );
}

// ---------------- Delete dialog ----------------
function DeleteFeedbackDialog({
  feedback,
  onClose,
  onDeleted,
}: {
  feedback: FeedbackDTO;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const del = useServerFn(softDeletePatientFeedback);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setErr(null);
    try {
      await del({ data: { id: feedback.id } });
      onDeleted();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao arquivar");
      setLoading(false);
    }
  }

  return (
    <Modal title="Arquivar feedback?" onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        O feedback de{" "}
        <strong className="text-foreground">{fmtDateTime(feedback.createdAt)}</strong>{" "}
        será arquivado e não aparecerá mais para o paciente nem nos gráficos. O
        registro fica preservado no banco para auditoria clínica.
      </p>
      {err && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2 mt-3">
          {err}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-3 py-2 text-sm rounded border border-border hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-2 text-sm rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Arquivar
        </button>
      </div>
    </Modal>
  );
}

// ---------------- Generic modal ----------------
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between pb-3 mb-2 border-b border-border">
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

// Tailwind utility shortcut for inputs.
// (using a const class string in JSX above; defined here for clarity)
declare global {
  // no-op
}
