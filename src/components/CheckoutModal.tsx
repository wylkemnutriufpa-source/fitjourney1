// Modal de checkout / renovação de assinatura.
// Tabs: Cartão (Stripe - em breve) e Pix (chave + WhatsApp para comprovante).

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  Check,
  MessageCircle,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAppSettings } from "@/lib/settings/app-settings.functions";

type Audience = "nutritionist" | "patient";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: Audience;
  /** Nome para usar na mensagem do WhatsApp (paciente ou nutricionista). */
  displayName?: string;
  /** Valor sugerido em centavos. Se ausente, usuário escolhe livremente. */
  suggestedAmountCents?: number;
  /** Rótulo do plano (mensal, trimestral, etc) para mensagem. */
  planLabel?: string;
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function CheckoutModal({
  open,
  onOpenChange,
  audience,
  displayName,
  suggestedAmountCents,
  planLabel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renovar assinatura</DialogTitle>
          <DialogDescription>
            Pague via Pix. Após o pagamento, envie o comprovante pelo WhatsApp
            para liberar seu acesso.
          </DialogDescription>
        </DialogHeader>

        <PixTab
          audience={audience}
          displayName={displayName}
          suggestedAmountCents={suggestedAmountCents}
          planLabel={planLabel}
        />
      </DialogContent>
    </Dialog>
  );
}


function PixTab({
  audience,
  displayName,
  suggestedAmountCents,
  planLabel,
}: {
  audience: Audience;
  displayName?: string;
  suggestedAmountCents?: number;
  planLabel?: string;
}) {
  const fetchSettings = useServerFn(getAppSettings);
  const { data, isLoading } = useQuery({
    queryKey: ["app-settings", "pix"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60_000,
  });

  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState<string>(
    suggestedAmountCents ? (suggestedAmountCents / 100).toFixed(2) : "",
  );

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-10 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  async function copyPix() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  const audienceLabel = audience === "nutritionist" ? "Profissional" : "Paciente";
  const amountNum = parseFloat(amount.replace(",", "."));
  const amountText = isFinite(amountNum) && amountNum > 0
    ? formatBRL(Math.round(amountNum * 100))
    : null;

  const message = [
    `Olá! Estou enviando comprovante de pagamento via Pix.`,
    `${audienceLabel}: ${displayName ?? "(meu nome)"}`,
    planLabel ? `Plano: ${planLabel}` : null,
    amountText ? `Valor: ${amountText}` : null,
    `Chave usada: ${data.pixKey}`,
  ]
    .filter(Boolean)
    .join("\n");

  const waUrl = `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-4 py-2">
      <div className="rounded-lg border border-border bg-surface/40 p-4 space-y-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Chave Pix ({data.pixKeyType})
          </p>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 text-lg font-mono bg-background rounded px-3 py-2 border border-border break-all">
              {data.pixKey}
            </code>
            <button
              type="button"
              onClick={copyPix}
              className="grid size-10 place-items-center rounded-md border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
              title="Copiar chave"
            >
              {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Valor pago (R$)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full bg-background border border-border rounded px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Informe o valor que pagou para constar no comprovante.
          </p>
        </div>
      </div>

      <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
        <li>Faça o Pix para a chave acima no app do seu banco.</li>
        <li>Toque no botão abaixo e envie o comprovante pelo WhatsApp.</li>
        <li>Seu acesso é liberado assim que o pagamento for confirmado.</li>
      </ol>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-medium px-4 py-3 rounded-md transition-colors"
      >
        <MessageCircle className="size-4" />
        Enviar comprovante pelo WhatsApp
      </a>
    </div>
  );
}
