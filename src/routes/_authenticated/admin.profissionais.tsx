import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listProfessionals,
  upsertProfessionalSubscription,
  adminUpdateNutritionist,
  type AdminNutritionistRow,
  type NutriPlanTier,
} from "@/lib/admin/admin.functions";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoneyBRL, statusLabel } from "@/lib/finance/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/profissionais")({
  component: ProfessionalsPage,
});

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function planLabel(t: NutriPlanTier | undefined): string {
  if (t === "pro") return "PRO";
  return "BASIC";
}

function planBadgeClass(t: NutriPlanTier | undefined): string {
  if (t === "pro") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-400";
  }
  return "border-primary/30 bg-primary/10 text-primary";
}

function ProfessionalsPage() {
  const fetchAll = useServerFn(listProfessionals);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "professionals"],
    queryFn: () => fetchAll(),
  });
  const [editing, setEditing] = useState<AdminNutritionistRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {isLoading ? "Carregando..." : `${data?.length ?? 0} profissional(is)`}
      </div>
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Profissional</th>
              <th className="text-left px-4 py-2">Pacientes</th>
              <th className="text-left px-4 py-2">Plano</th>
              <th className="text-left px-4 py-2">Mensalidade</th>
              <th className="text-left px-4 py-2">Início</th>
              <th className="text-left px-4 py-2">Vencimento</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((n) => {
              const sub = n.subscription;
              const d = daysUntil(sub?.ends_at);
              const venc =
                sub?.ends_at
                  ? d !== null && d < 0
                    ? `${fmtDate(sub.ends_at)} (vencido)`
                    : d !== null && d <= 7
                      ? `${fmtDate(sub.ends_at)} (em ${d}d)`
                      : fmtDate(sub.ends_at)
                  : "—";
              const vencColor =
                sub?.ends_at && d !== null
                  ? d < 0
                    ? "text-destructive"
                    : d <= 7
                      ? "text-amber-400"
                      : "text-foreground"
                  : "text-muted-foreground";
              return (
                <tr key={n.id} className="border-t border-border hover:bg-accent/30">
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setEditing(n)}
                      className="text-left font-medium hover:text-primary hover:underline"
                    >
                      {n.full_name}
                    </button>
                    <div className="text-xs text-muted-foreground">{n.email}</div>
                    {n.phone && <div className="text-[11px] text-muted-foreground">{n.phone}</div>}
                    {n.crn && <div className="text-[11px] text-muted-foreground">CRN: {n.crn}</div>}
                  </td>
                  <td className="px-4 py-2">{n.patients_count}</td>

                  <td className="px-4 py-2">
                    {sub ? (
                      <span
                        className={
                          "inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border " +
                          planBadgeClass(sub.plan_tier)
                        }
                      >
                        {planLabel(sub.plan_tier)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {sub ? (
                      formatMoneyBRL(sub.monthly_price_cents)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {fmtDate(sub?.starts_at)}
                  </td>
                  <td className={"px-4 py-2 " + vencColor}>{venc}</td>
                  <td className="px-4 py-2">
                    {sub ? (
                      <span className="text-xs font-mono uppercase">
                        {statusLabel(sub.status)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">sem plano</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(n)}>
                      {sub ? "Editar" : "Definir"}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {(data ?? []).length === 0 && !isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum profissional cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <SubscriptionDialog
          nutri={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  // ISO date or timestamp → yyyy-mm-dd
  return iso.slice(0, 10);
}

function SubscriptionDialog({
  nutri,
  onClose,
  onSaved,
}: {
  nutri: AdminNutritionistRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const sub = nutri.subscription;
  const [planTier, setPlanTier] = useState<NutriPlanTier>(sub?.plan_tier ?? "basic");
  const [priceBrl, setPriceBrl] = useState(
    sub ? (sub.monthly_price_cents / 100).toFixed(2) : "",
  );
  const [status, setStatus] = useState<"active" | "paused" | "expired" | "cancelled">(
    sub?.status ?? "active",
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(sub?.payment_method ?? "none");
  const [startsAt, setStartsAt] = useState<string>(toDateInput(sub?.starts_at));
  const [endsAt, setEndsAt] = useState<string>(toDateInput(sub?.ends_at));
  const [notes, setNotes] = useState(sub?.notes ?? "");

  const upsert = useServerFn(upsertProfessionalSubscription);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (input: any) => upsert({ data: input }),
    onSuccess: () => {
      toast.success("Assinatura salva");
      qc.invalidateQueries({ queryKey: ["admin", "professionals"] });
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  // Auto-calcula vencimento (1 mês após início) quando admin não definiu manualmente
  const suggestedEnd = useMemo(() => {
    if (endsAt || !startsAt) return null;
    const d = new Date(startsAt + "T00:00:00");
    if (Number.isNaN(d.getTime())) return null;
    const next = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return next.toISOString().slice(0, 10);
  }, [startsAt, endsAt]);

  function submit() {
    const cents = Math.round(parseFloat(priceBrl.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      toast.error("Valor inválido");
      return;
    }
    mut.mutate({
      nutritionist_id: nutri.id,
      plan_tier: planTier,
      monthly_price_cents: cents,
      status,
      payment_method: paymentMethod === "none" ? null : paymentMethod,
      starts_at: startsAt || undefined,
      ends_at: endsAt ? endsAt : null,
      notes: notes.trim() || null,
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assinatura — {nutri.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plano contratado</Label>
              <Select value={planTier} onValueChange={(v) => setPlanTier(v as NutriPlanTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">BASIC</SelectItem>
                  <SelectItem value="pro">PRO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mensalidade (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={priceBrl}
                onChange={(e) => setPriceBrl(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                placeholder={suggestedEnd ?? ""}
              />
              {!endsAt && suggestedEnd && (
                <button
                  type="button"
                  onClick={() => setEndsAt(suggestedEnd)}
                  className="text-[11px] text-primary hover:underline mt-1"
                >
                  usar {fmtDate(suggestedEnd)} (+1 mês)
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="expired">Vencida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Método de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observações internas"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={mut.isPending}>
            {mut.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
