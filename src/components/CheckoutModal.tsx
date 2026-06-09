// Modal de checkout / renovação de assinatura.
// Mostra a lista de planos cadastrados pelo admin (Mensal/Trimestral/etc) como
// botões colapsáveis. Cada plano expande exibindo o QR code, o código Pix
// copia-e-cola, e botão para enviar o comprovante pelo WhatsApp.

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  Check,
  MessageCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  QrCode,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAppSettings,
  type AppSettings,
  type CheckoutPlan,
} from "@/lib/settings/app-settings.functions";

type Audience = "nutritionist" | "patient";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: Audience;
  displayName?: string;
  suggestedAmountCents?: number;
  planLabel?: string;
};

export function CheckoutModal({
  open,
  onOpenChange,
  audience,
  displayName,
  planLabel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Renovar assinatura</DialogTitle>
          <DialogDescription>
            Escolha um plano, pague via Pix e envie o comprovante pelo WhatsApp
            para liberar seu acesso.
          </DialogDescription>
        </DialogHeader>

        <CheckoutBody
          audience={audience}
          displayName={displayName}
          planLabel={planLabel}
        />
      </DialogContent>
    </Dialog>
  );
}

function CheckoutBody({
  audience,
  displayName,
  planLabel,
}: {
  audience: Audience;
  displayName?: string;
  planLabel?: string;
}) {
  const fetchSettings = useServerFn(getAppSettings);
  const { data, isLoading } = useQuery({
    queryKey: ["app-settings", "checkout"],
    queryFn: () => fetchSettings(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-10 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <PlansList
      settings={data}
      audience={audience}
      displayName={displayName}
      preferredLabel={planLabel}
    />
  );
}

function PlansList({
  settings,
  audience,
  displayName,
  preferredLabel,
}: {
  settings: AppSettings;
  audience: Audience;
  displayName?: string;
  preferredLabel?: string;
}) {
  const plans = settings.checkoutPlans ?? [];
  const initialOpen = (() => {
    if (plans.length === 0) return null;
    const match = preferredLabel
      ? plans.find((p) => p.label.toLowerCase() === preferredLabel.toLowerCase())
      : null;
    return match?.id ?? plans[0].id;
  })();
  const [openId, setOpenId] = useState<string | null>(initialOpen);

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhum plano disponível no momento. Entre em contato pelo WhatsApp{" "}
        <a
          href={`https://wa.me/${settings.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          {settings.whatsappNumber}
        </a>
        .
      </div>
    );
  }

  return (
    <div className="space-y-2 py-2">
      {plans.map((p) => (
        <PlanRow
          key={p.id}
          plan={p}
          open={openId === p.id}
          onToggle={() => setOpenId(openId === p.id ? null : p.id)}
          whatsappNumber={settings.whatsappNumber}
          audience={audience}
          displayName={displayName}
        />
      ))}
    </div>
  );
}

function PlanRow({
  plan,
  open,
  onToggle,
  whatsappNumber,
  audience,
  displayName,
}: {
  plan: CheckoutPlan;
  open: boolean;
  onToggle: () => void;
  whatsappNumber: string;
  audience: Audience;
  displayName?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!plan.pixCode) return;
    try {
      await navigator.clipboard.writeText(plan.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  const audienceLabel = audience === "nutritionist" ? "Profissional" : "Paciente";
  const message = [
    `Olá! Estou enviando comprovante de pagamento via Pix.`,
    `${audienceLabel}: ${displayName ?? "(meu nome)"}`,
    `Plano: ${plan.label}`,
    plan.amount ? `Valor: ${plan.amount}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="rounded-lg border border-border bg-surface/40 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <QrCode className="size-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{plan.label}</div>
          {plan.amount && (
            <div className="text-[11px] text-muted-foreground">{plan.amount}</div>
          )}
        </div>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-3">
          {plan.qrCodeDataUrl ? (
            <div className="grid place-items-center">
              <img
                src={plan.qrCodeDataUrl}
                alt={`QR Code ${plan.label}`}
                className="size-56 object-contain rounded-md bg-white p-2 border border-border"
              />
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              QR Code ainda não disponível para este plano.
            </div>
          )}

          {plan.pixCode ? (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Código Pix copia-e-cola
              </p>
              <div className="flex items-start gap-2">
                <code className="flex-1 text-[11px] font-mono bg-background rounded px-3 py-2 border border-border break-all max-h-24 overflow-y-auto">
                  {plan.pixCode}
                </code>
                <button
                  type="button"
                  onClick={copyCode}
                  className="grid size-10 place-items-center rounded-md border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground shrink-0"
                  title="Copiar código"
                >
                  {copied ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              Código copia-e-cola ainda não cadastrado.
            </div>
          )}

          <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside pt-1">
            <li>Pague via Pix usando o QR code ou o código copia-e-cola.</li>
            <li>Envie o comprovante pelo WhatsApp no botão abaixo.</li>
            <li>Seu acesso é liberado assim que o pagamento for confirmado.</li>
          </ol>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-medium px-4 py-2.5 rounded-md transition-colors text-sm"
          >
            <MessageCircle className="size-4" />
            Enviar comprovante pelo WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
