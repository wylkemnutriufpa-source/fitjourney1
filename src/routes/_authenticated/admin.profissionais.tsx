import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listProfessionals,
  upsertProfessionalSubscription,
  type AdminNutritionistRow,
} from "@/lib/admin/admin.functions";
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
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Pacientes</th>
              <th className="text-left px-4 py-2">Mensalidade</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((n) => (
              <tr key={n.id} className="border-t border-border hover:bg-accent/30">
                <td className="px-4 py-2 font-medium">{n.full_name}</td>
                <td className="px-4 py-2 text-muted-foreground">{n.email}</td>
                <td className="px-4 py-2">{n.patients_count}</td>
                <td className="px-4 py-2">
                  {n.subscription
                    ? formatMoneyBRL(n.subscription.monthly_price_cents)
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-2">
                  {n.subscription ? (
                    <span className="text-xs font-mono uppercase">
                      {statusLabel(n.subscription.status)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">sem plano</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => setEditing(n)}>
                    {n.subscription ? "Editar" : "Definir"}
                  </Button>
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
  const [priceBrl, setPriceBrl] = useState(
    sub ? (sub.monthly_price_cents / 100).toFixed(2) : "",
  );
  const [status, setStatus] = useState<"active" | "paused" | "expired" | "cancelled">(
    sub?.status ?? "active",
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(sub?.payment_method ?? "none");
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

  function submit() {
    const cents = Math.round(parseFloat(priceBrl.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      toast.error("Valor inválido");
      return;
    }
    mut.mutate({
      nutritionist_id: nutri.id,
      monthly_price_cents: cents,
      status,
      payment_method: paymentMethod === "none" ? null : paymentMethod,
      notes: notes.trim() || null,
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mensalidade — {nutri.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
