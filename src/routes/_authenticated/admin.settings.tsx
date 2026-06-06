import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, KeyRound, MessageCircle, Shuffle } from "lucide-react";

import {
  getAppSettings,
  updateAppSettings,
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
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setPixKey(data.pixKey);
      setPixKeyType(data.pixKeyType);
      setWhatsappNumber(data.whatsappNumber);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (input: {
      pixKey: string;
      pixKeyType: string;
      whatsappNumber: string;
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
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Configurações de Checkout</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chave Pix e número de WhatsApp usados no modal de renovação de
          assinatura (profissionais e pacientes).
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-border bg-surface/40 p-5"
      >
        <div>
          <label className="text-xs font-medium flex items-center gap-1.5">
            <KeyRound className="size-3.5" /> Tipo da chave Pix
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
            <Shuffle className="size-3.5" /> Chave Pix
          </label>
          <input
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="91980124814"
            className="mt-1 w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Pode trocar a qualquer momento (ex: gerar uma chave aleatória no
            seu banco e colar aqui).
          </p>
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
            Formato internacional, só dígitos: 55 + DDD + número (ex:
            5591980124814).
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
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
            Salvar
          </button>
          {savedMsg && (
            <span className="text-xs text-muted-foreground">{savedMsg}</span>
          )}
        </div>
      </form>
    </div>
  );
}
