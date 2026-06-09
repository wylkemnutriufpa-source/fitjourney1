// Patient — módulo Feedback (peso, fotos, aderência, resultado, notas)
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteBoundaries";
// + histórico imutável + gráfico premium de evolução.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyFeedbacks,
  getMyFeedbackStatus,
  submitFeedback,
  getSignedFeedbackPhotoUrl,
  editMyFeedback,
  type FeedbackDTO,
} from "@/lib/feedback/feedback.functions";
import { getMyPatientProfile } from "@/lib/profile/patient-profile.functions";
import {
  ADHERENCE_OPTIONS,
  RESULT_OPTIONS,
  adherenceLabel,
  resultLabel,
  type AdherenceRating,
  type ResultRating,
} from "@/lib/feedback/copy";
import { FeedbackChart } from "@/components/feedback/FeedbackChart";
import { FeedbackCountdown } from "@/components/feedback/FeedbackCountdown";
import {
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Loader2,
  Plus,
  Send,
  Trash2,
  Upload,
  AlertTriangle,
  History,
  LineChart as LineChartIcon,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meu-plano/feedback")({
  head: () => ({ meta: [{ title: "Feedback — FitJourney" }] }),
  component: FeedbackPage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} homeTo="/my-dashboard" homeLabel="Início" />
  ),
  notFoundComponent: () => <RouteNotFoundFallback homeTo="/my-dashboard" homeLabel="Início" />,
});

type Tab = "novo" | "historico" | "evolucao";

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelative(daysSince: number | null): string {
  if (daysSince === null) return "nunca";
  if (daysSince === 0) return "hoje";
  if (daysSince === 1) return "ontem";
  return `há ${daysSince} dias`;
}

function FeedbackPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listMyFeedbacks);
  const fetchStatus = useServerFn(getMyFeedbackStatus);
  const fetchProfile = useServerFn(getMyPatientProfile);
  const submit = useServerFn(submitFeedback);

  const { data: list = [], isLoading: loadingList } = useQuery({
    queryKey: ["my-feedbacks"],
    queryFn: () => fetchList(),
    staleTime: 10_000,
  });
  const { data: status } = useQuery({
    queryKey: ["my-feedback-status"],
    queryFn: () => fetchStatus(),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: profile } = useQuery({
    queryKey: ["my-patient-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 60_000,
  });

  const [tab, setTab] = useState<Tab>(() =>
    list.length === 0 ? "novo" : "novo",
  );
  const [editing, setEditing] = useState<FeedbackDTO | null>(null);

  // Form state
  const [weight, setWeight] = useState<string>("");
  const [waist, setWaist] = useState<string>("");
  const [abdomen, setAbdomen] = useState<string>("");
  const [hip, setHip] = useState<string>("");
  const [adherence, setAdherence] = useState<AdherenceRating | null>(null);
  const [resultR, setResultR] = useState<ResultRating | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoSide, setPhotoSide] = useState<File | null>(null);
  const [photoBack, setPhotoBack] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  function parseOptionalCm(s: string): number | null {
    const t = s.trim().replace(",", ".");
    if (t === "") return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 30 || n > 250) {
      throw new Error("Medida fora do intervalo (30–250 cm).");
    }
    return n;
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!adherence) throw new Error("Escolha como foi seguir o plano.");
      const weightNum =
        weight.trim() === "" ? null : Number(weight.replace(",", "."));
      if (weightNum !== null && (!Number.isFinite(weightNum) || weightNum <= 0)) {
        throw new Error("Peso inválido.");
      }
      const waistNum = parseOptionalCm(waist);
      const abdomenNum = parseOptionalCm(abdomen);
      const hipNum = parseOptionalCm(hip);

      // Precisamos do patient_id para o path do storage.
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Sessão expirada.");
      const { data: pRow, error: pErr } = await supabase
        .from("patients")
        .select("id")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle();
      if (pErr) throw new Error(pErr.message);
      if (!pRow) throw new Error("Cadastro de paciente não encontrado.");

      const feedbackId = crypto.randomUUID();
      setUploading(true);
      let frontPath: string | null = null;
      let sidePath: string | null = null;
      let backPath: string | null = null;
      try {
        if (photoFront) {
          frontPath = `${pRow.id}/${feedbackId}/front.jpg`;
          const { error } = await supabase.storage
            .from("feedback-photos")
            .upload(frontPath, photoFront, {
              upsert: false,
              contentType: photoFront.type || "image/jpeg",
            });
          if (error) throw new Error(`Foto frontal: ${error.message}`);
        }
        if (photoSide) {
          sidePath = `${pRow.id}/${feedbackId}/side.jpg`;
          const { error } = await supabase.storage
            .from("feedback-photos")
            .upload(sidePath, photoSide, {
              upsert: false,
              contentType: photoSide.type || "image/jpeg",
            });
          if (error) throw new Error(`Foto lateral: ${error.message}`);
        }
        if (photoBack) {
          backPath = `${pRow.id}/${feedbackId}/back.jpg`;
          const { error } = await supabase.storage
            .from("feedback-photos")
            .upload(backPath, photoBack, {
              upsert: false,
              contentType: photoBack.type || "image/jpeg",
            });
          if (error) throw new Error(`Foto costas: ${error.message}`);
        }
      } finally {
        setUploading(false);
      }

      return await submit({
        data: {
          id: feedbackId,
          weightKg: weightNum,
          waistCm: waistNum,
          abdomenCm: abdomenNum,
          hipCm: hipNum,
          adherenceRating: adherence,
          resultRating: resultR ?? undefined,
          notes: notes.trim() || undefined,
          photoFrontPath: frontPath ?? undefined,
          photoSidePath: sidePath ?? undefined,
          photoBackPath: backPath ?? undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success("Feedback enviado. Obrigado por se manter ativo!");
      setWeight("");
      setWaist("");
      setAbdomen("");
      setHip("");
      setAdherence(null);
      setResultR(null);
      setNotes("");
      setPhotoFront(null);
      setPhotoSide(null);
      setPhotoBack(null);
      qc.invalidateQueries({ queryKey: ["my-feedbacks"] });
      qc.invalidateQueries({ queryKey: ["my-feedback-status"] });
      qc.invalidateQueries({ queryKey: ["patient-feedback-status-nav"] });
      setTab("historico");
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar feedback");
    },
  });

  function validateFile(f: File | null | undefined): File | null {
    if (!f) return null;
    if (!f.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return null;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 8MB).");
      return null;
    }
    return f;
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <header className="border-b border-border pb-4 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Acompanhamento
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
          <p className="text-sm text-muted-foreground">
            Registre como você está se sentindo. Seus envios viram parte do seu
            histórico e do acompanhamento do seu nutricionista.
          </p>
        </header>

        {status && !status.hasNutritionist && (
          <div className="rounded-md border border-amber-500/40 bg-amber-50/40 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="size-4 mt-0.5" />
            <span>
              Seu cadastro ainda não está vinculado a um nutricionista. Procure
              quem te enviou o convite.
            </span>
          </div>
        )}

        {status?.hasNutritionist && (
          <FeedbackCountdown
            frequencyDays={status.frequencyDays}
            lastFeedbackAt={status.lastFeedbackAt}
            daysSinceLast={status.daysSinceLast}
          />
        )}

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(
            [
              { id: "novo", label: "Novo feedback", Icon: Plus },
              { id: "historico", label: "Histórico", Icon: History },
              { id: "evolucao", label: "Evolução", Icon: LineChartIcon },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors " +
                  (active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {tab === "novo" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitMutation.mutate();
            }}
            className="space-y-6"
          >
            {/* Peso */}
            <section className="bg-surface border border-border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                01 · Peso
              </h2>
              <div className="flex items-baseline gap-2 max-w-xs">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="400"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="ex: 72.4"
                  className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-lg tabular-nums focus:outline-none focus:border-primary"
                />
                <span className="text-sm text-muted-foreground font-mono">
                  kg
                </span>
              </div>
              {!profile?.heightCm && (
                <p className="text-[11px] text-muted-foreground">
                  Cadastre sua altura em{" "}
                  <Link to="/meu-plano/settings" className="text-primary underline">
                    Configurações
                  </Link>{" "}
                  para visualizar a curva de IMC.
                </p>
              )}
            </section>

            {/* Medidas corporais — opcionais */}
            <section className="bg-surface border border-border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                02 · Medidas (opcional)
              </h2>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Cintura, abdômen e quadril em centímetros. Ajudam a acompanhar
                evolução além do peso.
              </p>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {[
                  { label: "Cintura", v: waist, set: setWaist },
                  { label: "Abdômen", v: abdomen, set: setAbdomen },
                  { label: "Quadril", v: hip, set: setHip },
                ].map((f) => (
                  <div key={f.label} className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {f.label}
                    </label>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="30"
                        max="250"
                        inputMode="decimal"
                        value={f.v}
                        onChange={(e) => f.set(e.target.value)}
                        placeholder="—"
                        className="w-full bg-background border border-border rounded-md px-2 py-2 text-sm tabular-nums focus:outline-none focus:border-primary"
                      />
                      <span className="text-[10px] text-muted-foreground font-mono">
                        cm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Aderência */}
            <section className="bg-surface border border-border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                03 · Como foi seguir o plano?
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ADHERENCE_OPTIONS.map((opt) => {
                  const on = adherence === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAdherence(opt.value)}
                      className={
                        "text-xs sm:text-sm py-2.5 px-2 rounded-md border font-medium transition-colors " +
                        (on
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40")
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Resultado */}
            <section className="bg-surface border border-border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                03 · Como você avalia seus resultados?
              </h2>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Opcional. Aderência e resultado são coisas diferentes.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RESULT_OPTIONS.map((opt) => {
                  const on = resultR === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setResultR(on ? null : opt.value)}
                      className={
                        "text-xs sm:text-sm py-2.5 px-2 rounded-md border font-medium transition-colors " +
                        (on
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40")
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Fotos */}
            <section className="bg-surface border border-border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                04 · Fotos
              </h2>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Opcional. Frontal, lateral e costas. Só você e seu nutricionista veem.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <PhotoSlot
                  label="Frontal"
                  file={photoFront}
                  onSelect={(f) => setPhotoFront(validateFile(f))}
                  inputRef={frontInputRef}
                />
                <PhotoSlot
                  label="Lateral"
                  file={photoSide}
                  onSelect={(f) => setPhotoSide(validateFile(f))}
                  inputRef={sideInputRef}
                />
                <PhotoSlot
                  label="Costas"
                  file={photoBack}
                  onSelect={(f) => setPhotoBack(validateFile(f))}
                  inputRef={backInputRef}
                />
              </div>
            </section>

            {/* Notas */}
            <section className="bg-surface border border-border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
                05 · Comentário
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conte algo que valha registrar (energia, sono, treinos, fome, dificuldades…)"
                rows={4}
                maxLength={2000}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </section>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={
                  submitMutation.isPending || uploading || !adherence
                }
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-2.5 px-5 rounded-md hover:bg-primary/90 disabled:opacity-60"
              >
                {submitMutation.isPending || uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {uploading
                  ? "Enviando fotos…"
                  : submitMutation.isPending
                    ? "Salvando…"
                    : "Enviar feedback"}
              </button>
            </div>
          </form>
        )}

        {tab === "historico" && (
          <section className="space-y-3">
            {loadingList ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : list.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  Nenhum feedback enviado ainda.
                </p>
                <button
                  onClick={() => setTab("novo")}
                  className="text-xs text-primary underline"
                >
                  Enviar o primeiro
                </button>
              </div>
            ) : (
              list.map((f, idx) => {
                const previous = list[idx + 1];
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
                      <div className="flex items-center gap-2">
                        {Date.now() - new Date(f.createdAt).getTime() < 24 * 60 * 60 * 1000 && (
                          <button
                            type="button"
                            onClick={() => setEditing(f)}
                            className="text-[10px] font-mono uppercase tracking-widest text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <Pencil className="size-3" /> Editar
                          </button>
                        )}
                        {idx === 0 && (
                          <span className="text-[9px] font-mono uppercase text-primary border border-primary/40 rounded px-1.5 py-0.5">
                            mais recente
                          </span>
                        )}
                      </div>
                    </header>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <Field
                        label="Peso"
                        value={
                          f.weightKg != null
                            ? `${f.weightKg.toFixed(1)} kg`
                            : "—"
                        }
                        sub={
                          delta != null
                            ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`
                            : undefined
                        }
                      />
                      <Field
                        label="Aderência"
                        value={adherenceLabel(f.adherenceRating)}
                      />
                      <Field
                        label="Resultado"
                        value={resultLabel(f.resultRating)}
                      />
                      <Field
                        label="Fotos"
                        value={
                          [f.photoFrontPath, f.photoSidePath, f.photoBackPath].filter(Boolean)
                            .length > 0
                            ? `${[f.photoFrontPath, f.photoSidePath, f.photoBackPath].filter(Boolean).length}`
                            : "—"
                        }
                      />
                    </div>
                    {f.notes && (
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap border-l-2 border-primary/40 pl-3">
                        {f.notes}
                      </p>
                    )}
                    {(f.photoFrontPath || f.photoSidePath || f.photoBackPath) && (
                      <div className="flex gap-2 pt-1 flex-wrap">
                        {f.photoFrontPath && (
                          <PhotoThumb path={f.photoFrontPath} label="Frontal" />
                        )}
                        {f.photoSidePath && (
                          <PhotoThumb path={f.photoSidePath} label="Lateral" />
                        )}
                        {f.photoBackPath && (
                          <PhotoThumb path={f.photoBackPath} label="Costas" />
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        )}

        {tab === "evolucao" && (
          <FeedbackChart
            feedbacks={list}
            fallbackHeightCm={profile?.heightCm ?? null}
          />
        )}
      </div>
      {editing && (
        <EditMyFeedbackDialog
          feedback={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["my-feedbacks"] });
          }}
        />
      )}
    </AppShell>
  );
}

function EditMyFeedbackDialog({
  feedback,
  onClose,
  onSaved,
}: {
  feedback: FeedbackDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const edit = useServerFn(editMyFeedback);
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
          adherenceRating: form.adherenceRating as any,
          resultRating: (form.resultRating || null) as any,
        },
      });
      toast.success("Feedback atualizado.");
      onSaved();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-surface p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Corrigir feedback
            </p>
            <h3 className="text-base font-semibold">Editar registro</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground border-l-2 border-amber-500/40 pl-3">
          Você pode corrigir até 24h após o envio e enquanto o profissional ainda
          não tiver revisado.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Peso (kg)</span>
            <input type="text" inputMode="decimal" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cintura (cm)</span>
            <input type="text" inputMode="decimal" value={form.waistCm} onChange={(e) => setForm({ ...form, waistCm: e.target.value })} className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Abdômen (cm)</span>
            <input type="text" inputMode="decimal" value={form.abdomenCm} onChange={(e) => setForm({ ...form, abdomenCm: e.target.value })} className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Quadril (cm)</span>
            <input type="text" inputMode="decimal" value={form.hipCm} onChange={(e) => setForm({ ...form, hipCm: e.target.value })} className={inputCls} />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Aderência</span>
          <select value={form.adherenceRating} onChange={(e) => setForm({ ...form, adherenceRating: e.target.value as any })} className={inputCls}>
            <option value="muito_dificil">Muito difícil</option>
            <option value="dificil">Difícil</option>
            <option value="neutro">Neutro</option>
            <option value="facil">Fácil</option>
            <option value="muito_facil">Muito fácil</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Resultado percebido</span>
          <select value={form.resultRating} onChange={(e) => setForm({ ...form, resultRating: e.target.value as any })} className={inputCls}>
            <option value="">— sem avaliação —</option>
            <option value="piores">Piorou</option>
            <option value="abaixo">Abaixo do esperado</option>
            <option value="dentro">Dentro do esperado</option>
            <option value="acima">Acima do esperado</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Notas</span>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputCls} />
        </label>

        {err && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
            {err}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={saving} className="px-3 py-2 text-sm rounded border border-border hover:bg-muted">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      {sub && (
        <p className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {sub}
        </p>
      )}
    </div>
  );
}

function PhotoSlot({
  label,
  file,
  onSelect,
  inputRef,
}: {
  label: string;
  file: File | null;
  onSelect: (f: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="relative aspect-[3/4] rounded-md border border-dashed border-border bg-background overflow-hidden grid place-items-center">
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              className="absolute inset-0 size-full object-cover"
            />
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="absolute top-2 right-2 size-7 grid place-items-center rounded-full bg-background/80 text-destructive border border-border hover:bg-background"
              title="Remover"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="size-full flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Upload className="size-5" />
            Enviar foto
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </div>
    </div>
  );
}

function PhotoThumb({ path, label }: { path: string; label: string }) {
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
      className="relative size-20 sm:size-24 rounded-md border border-border overflow-hidden bg-background grid place-items-center hover:border-primary/60 transition-colors"
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
