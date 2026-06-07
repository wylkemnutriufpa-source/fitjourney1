// Paywall bloqueante por VENCIMENTO de assinatura paga (paciente ou nutri),
// disparado após o período de graça de 2 dias terminar.
// Independente do TrialPaywall (que cobre nutri sem assinatura no fim do trial).

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Lock, AlertTriangle } from "lucide-react";
import { getMyExpirationInfo } from "@/lib/finance/expiration.functions";
import { useAuth } from "@/lib/auth-context";
import { CheckoutModal } from "@/components/CheckoutModal";

export function ExpirationPaywall() {
  const { user, roles } = useAuth();
  const isAdmin = roles?.includes("admin");
  const fetchInfo = useServerFn(getMyExpirationInfo);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["expiration-info", user?.id ?? "anon"],
    queryFn: () => fetchInfo(),
    enabled: !!user?.id && !isAdmin,
    staleTime: 5 * 60_000,
  });

  if (isAdmin || !data || !data.shouldBlock) return null;

  const isPatient = data.kind === "patient";

  return (
    <>
      <div className="fixed inset-0 z-50 grid place-items-center bg-background/95 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-xl border border-destructive/40 bg-surface p-6 shadow-2xl space-y-4">
          <div className="size-12 rounded-full bg-destructive/10 grid place-items-center">
            <Lock className="size-6 text-destructive" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-destructive flex items-center gap-1">
              <AlertTriangle className="size-3" /> Acesso bloqueado
            </p>
            <h2 className="text-xl font-bold tracking-tight mt-1">
              {isPatient ? "Seu plano expirou" : "Sua assinatura expirou"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {isPatient
                ? `Seu plano venceu em ${data.endsAt} e o período de tolerância de 2 dias terminou. Procure seu nutricionista para renovar e voltar a acessar o conteúdo.`
                : `Sua assinatura venceu em ${data.endsAt} e o período de tolerância de 2 dias terminou. Renove agora para reativar o acesso aos seus pacientes, anamneses, planos e templates.`}
            </p>
          </div>

          {!isPatient && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full bg-primary text-primary-foreground font-medium px-4 py-3 rounded-md hover:opacity-90 transition-opacity"
            >
              Renovar assinatura
            </button>
          )}

          <p className="text-[11px] text-muted-foreground text-center">
            {isPatient
              ? "Já regularizou? Atualize a página após o nutricionista renovar seu plano."
              : "Pagamento via Pix ou cartão (em breve). Já paguei? Envie o comprovante pelo WhatsApp dentro do modal."}
          </p>
        </div>
      </div>

      {!isPatient && (
        <CheckoutModal
          open={open}
          onOpenChange={setOpen}
          audience="nutritionist"
          planLabel="Renovação de assinatura"
        />
      )}
    </>
  );
}
