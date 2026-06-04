// Editor de assinatura — usado pelo nutricionista na ficha do paciente.
// CRUD simples, sem dependência clínica.

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import {
  createSubscription,
  deleteSubscription,
  listPatientSubscriptions,
  updateSubscription,
  type Subscription,
  type SubscriptionPlanKind,
  type SubscriptionPaymentMethod,
  type SubscriptionStatus,
} from "@/lib/finance/subscriptions.functions";
import {
  formatMoneyBRL,
  formatShortDate,
  paymentMethodLabel,
  planKindLabel,
  statusLabel,
} from "@/lib/finance/format";

const PLAN_KINDS: SubscriptionPlanKind[] = [
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
  "custom",
];
const STATUSES: SubscriptionStatus[] = [
  "active",
  "paused",
  "expired",
  "cancelled",
];
const METHODS: SubscriptionPaymentMethod[] = [
  "pix",
  "card",
  "cash",
  "transfer",
  "boleto",
  "other",
];

interface FormState {
  planKind: SubscriptionPlanKind;
  priceBrl: string;
  startsAt: string;
  endsAt: string;
  paymentMethod: SubscriptionPaymentMethod | "";
  notes: string;
  status: SubscriptionStatus;
}

function emptyForm(): FormState {
  return {
    planKind: "monthly",
    priceBrl: "",
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: "",
    paymentMethod: "pix",
    notes: "",
    status: "active",
  };
}

function fromSubscription(s: Subscription): FormState {
  return {
    planKind: s.planKind,
    priceBrl: (s.priceCents / 100).toFixed(2),
    startsAt: s.startsAt,
    endsAt: s.endsAt ?? "",
    paymentMethod: s.paymentMethod ?? "",
    notes: s.notes ?? "",
    status: s.status,
  };
}

export function SubscriptionEditor({ patientId }: { patientId: string }) {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["finance", "subscriptions", patientId],
    queryFn: () => listPatientSubscriptions({ data: { patientId } }),
    staleTime: 30_000,
  });

  const [editing, setEditing] = useState<Subscription | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing === "new") setForm(emptyForm());
    else if (editing) setForm(fromSubscription(editing));
    setError(null);
  }, [editing]);

  const createMut = useMutation({
    mutationFn: () =>
      createSubscription({
        data: {
          patientId,
          planKind: form.planKind,
          priceCents: Math.round(parseFloat(form.priceBrl || "0") * 100),
          currency: "BRL",
          startsAt: form.startsAt,
          endsAt: form.endsAt || null,
          paymentMethod: form.paymentMethod || null,
          notes: form.notes || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance"] });
      setEditing(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editing || editing === "new") throw new Error("No subscription");
      return updateSubscription({
        data: {
          id: editing.id,
          planKind: form.planKind,
          priceCents: Math.round(parseFloat(form.priceBrl || "0") * 100),
          startsAt: form.startsAt,
          endsAt: form.endsAt || null,
          paymentMethod: form.paymentMethod || null,
          notes: form.notes || null,
          status: form.status,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance"] });
      setEditing(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSubscription({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance"] }),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (editing === "new") createMut.mutate();
    else if (editing) updateMut.mutate();
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Plano contratado
          </p>
          <h3 className="text-lg font-semibold mt-1">Financeiro</h3>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="text-xs font-semibold py-1.5 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" /> Nova assinatura
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma assinatura registrada ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 p-3 rounded border border-border bg-background"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {planKindLabel(s.planKind)}
                  </span>
                  <span className="text-sm font-mono">
                    {formatMoneyBRL(s.priceCents)}
                  </span>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {formatShortDate(s.startsAt)} → {formatShortDate(s.endsAt)} ·{" "}
                  {paymentMethodLabel(s.paymentMethod)}
                </p>
                {s.notes && (
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {s.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditing(s)}
                  title="Editar"
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded border border-border"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Excluir esta assinatura?")) deleteMut.mutate(s.id);
                  }}
                  title="Excluir"
                  className="p-1.5 text-muted-foreground hover:text-destructive rounded border border-border"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setEditing(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-surface border border-border rounded-lg p-6 w-full max-w-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editing === "new" ? "Nova assinatura" : "Editar assinatura"}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Plano">
                <select
                  value={form.planKind}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      planKind: e.target.value as SubscriptionPlanKind,
                    })
                  }
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                >
                  {PLAN_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {planKindLabel(k)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Valor (R$)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.priceBrl}
                  onChange={(e) => setForm({ ...form, priceBrl: e.target.value })}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                />
              </Field>
              <Field label="Início">
                <input
                  type="date"
                  required
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                />
              </Field>
              <Field
                label={
                  form.planKind === "custom"
                    ? "Fim"
                    : "Fim (auto se vazio)"
                }
              >
                <input
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Pagamento">
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentMethod: e.target.value as SubscriptionPaymentMethod | "",
                    })
                  }
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {paymentMethodLabel(m)}
                    </option>
                  ))}
                </select>
              </Field>
              {editing !== "new" && (
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as SubscriptionStatus,
                      })
                    }
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            <Field label="Observações">
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
              />
            </Field>

            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-3 py-2 text-xs font-medium border border-border rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                className="px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-md disabled:opacity-60"
              >
                {createMut.isPending || updateMut.isPending
                  ? "Salvando…"
                  : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
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

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const color =
    status === "active"
      ? "text-emerald-500 border-emerald-500/40"
      : status === "paused"
        ? "text-amber-500 border-amber-500/40"
        : status === "expired"
          ? "text-destructive border-destructive/40"
          : "text-muted-foreground border-border";
  return (
    <span
      className={
        "text-[9px] font-mono uppercase tracking-widest border rounded px-1.5 py-0.5 " +
        color
      }
    >
      {statusLabel(status)}
    </span>
  );
}
