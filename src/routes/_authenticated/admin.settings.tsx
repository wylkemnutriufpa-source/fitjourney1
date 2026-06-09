import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Loader2,
  KeyRound,
  MessageCircle,
  Shuffle,
  Plus,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from "lucide-react";

import {
  getAppSettings,
  updateAppSettings,
  type CheckoutPlan,
} from "@/lib/settings/app-settings.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
});

const PIX_TYPES: Array<{ value: string; label: string }> = [
  { value: "celular", label: "Celular" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "aleatoria", label: "Chave aleatória" },
];

const PRESET_LABELS = ["Mensal", "Trimestral", "Semestral", "Anual"];

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function AdminSettingsPage() {
  const fetchSettings = useServerFn(getAppSettings);
  const saveSettings = useServerFn(updateAppSettings);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["app-settings", "admin"],
    queryFn: () => fetchSettings(),
  });

  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("celular");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [plans, setPlans] = useState<CheckoutPlan[]>([]);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setPixKey(data.pixKey);
      setPixKeyType(data.pixKeyType);
      setWhatsappNumber(data.whatsappNumber);
      setPlans(data.checkoutPlans ?? []);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (input: {
      pixKey: string;
      pixKeyType: string;
      whatsappNumber: string;
      checkoutPlans: CheckoutPlan[];
    }) => saveSettings({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings"] });
      setSavedMsg("Salvo com sucesso.");
      setTimeout(() => setSavedMsg(null), 2500);
    },
    onError: (err: any) => {
      setSavedMsg("Erro: " + (err?.message ?? "tente novamente"));
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      pixKey: pixKey.trim(),
      pixKeyType,
      whatsappNumber: whatsappNumber.replace(/\D/g, ""),
      checkoutPlans: plans,
    });
  }

  function addPlan(label?: string) {
    const id = uid();
    const nextLabel =
      label ??
      PRESET_LABELS.find((l) => !plans.some((p) => p.label === l)) ??
      "Novo plano";
    setPlans((prev) => [
      ...prev,
      { id, label: nextLabel, pixCode: "", qrCodeDataUrl: null, amount: null },
    ]);
    setOpenIds((prev) => new Set(prev).add(id));
  }

  function updatePlan(id: string, patch: Partial<CheckoutPlan>) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removePlan(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Configurações de Checkout</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chave Pix padrão, WhatsApp para comprovante e planos exibidos no modal
          de renovação de assinatura.
        </p>
      </div>

      {/* Chave Pix padrão + WhatsApp */}
      <div className="space-y-5 rounded-xl border border-border bg-surface/40 p-5">
        <div>
          <label className="text-xs font-medium flex items-center gap-1.5">
            <KeyRound className="size-3.5" /> Tipo da chave Pix (padrão)
          </label>
          <select
            value={pixKeyType}
            onChange={(e) => setPixKeyType(e.target.value)}
            className="mt-1 w-full bg-background border border-border rounded px-3 py-2 text-sm"
          >
            {PIX_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium flex items-center gap-1.5">
            <Shuffle className="size-3.5" /> Chave Pix (padrão)
          </label>
          <input
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="91980124814"
            className="mt-1 w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-medium flex items-center gap-1.5">
            <MessageCircle className="size-3.5" /> WhatsApp para comprovante
          </label>
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="5591980124814"
            className="mt-1 w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            DDI + DDD + número, só dígitos (ex: 5591980124814).
          </p>
        </div>
      </div>

      {/* Planos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Planos no modal de renovação</h3>
            <p className="text-[11px] text-muted-foreground">
              Cada plano vira um botão colapsável com QR code e código copia-e-cola.
            </p>
          </div>
          <button
            type="button"
            onClick={() => addPlan()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:border-primary/50"
          >
            <Plus className="size-3.5" /> Adicionar plano
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Nenhum plano cadastrado. Clique em <strong>Adicionar plano</strong>{" "}
            (Mensal, Trimestral, Semestral, Anual...).
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                open={openIds.has(p.id)}
                onToggle={() => toggle(p.id)}
                onChange={(patch) => updatePlan(p.id, patch)}
                onRemove={() => removePlan(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t border-border">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar tudo
        </button>
        {savedMsg && (
          <span className="text-xs text-muted-foreground">{savedMsg}</span>
        )}
      </div>
    </form>
  );
}

function PlanCard({
  plan,
  open,
  onToggle,
  onChange,
  onRemove,
}: {
  plan: CheckoutPlan;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<CheckoutPlan>) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadErr("Selecione uma imagem (PNG/JPG).");
      return;
    }
    if (file.size > 1_500_000) {
      setUploadErr("Imagem grande demais (máx 1,5MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ qrCodeDataUrl: String(reader.result) });
      setUploadErr(null);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-lg border border-border bg-surface/40">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="grid size-7 place-items-center rounded hover:bg-muted text-muted-foreground"
          title={open ? "Recolher" : "Expandir"}
        >
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        <input
          type="text"
          value={plan.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Ex: Mensal"
          className="flex-1 bg-background border border-border rounded px-2.5 py-1.5 text-sm font-medium"
        />
        <input
          type="text"
          value={plan.amount ?? ""}
          onChange={(e) => onChange({ amount: e.target.value })}
          placeholder="R$"
          className="w-24 bg-background border border-border rounded px-2.5 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={onRemove}
          className="grid size-8 place-items-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Remover plano"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          <div>
            <label className="text-[11px] uppercase font-mono tracking-wider text-muted-foreground">
              QR Code (imagem)
            </label>
            <div className="mt-1 flex items-start gap-3">
              <div className="size-28 rounded-md border border-border bg-background grid place-items-center overflow-hidden shrink-0">
                {plan.qrCodeDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={plan.qrCodeDataUrl}
                    alt="QR Code"
                    className="size-full object-contain"
                  />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:border-primary/50"
                >
                  <Upload className="size-3.5" />
                  {plan.qrCodeDataUrl ? "Trocar QR Code" : "Subir QR Code"}
                </button>
                {plan.qrCodeDataUrl && (
                  <button
                    type="button"
                    onClick={() => onChange({ qrCodeDataUrl: null })}
                    className="text-[11px] text-muted-foreground hover:text-destructive block"
                  >
                    Remover imagem
                  </button>
                )}
                {uploadErr && (
                  <p className="text-[11px] text-destructive">{uploadErr}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  PNG ou JPG, até 1,5MB. Recomendado: 400×400px.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-mono tracking-wider text-muted-foreground">
              Código Pix copia-e-cola
            </label>
            <textarea
              value={plan.pixCode}
              onChange={(e) => onChange({ pixCode: e.target.value })}
              placeholder="00020126360014BR.GOV.BCB.PIX..."
              rows={4}
              className="mt-1 w-full bg-background border border-border rounded px-3 py-2 text-xs font-mono break-all"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Cole aqui o código BR Code gerado pelo seu banco para este plano.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
