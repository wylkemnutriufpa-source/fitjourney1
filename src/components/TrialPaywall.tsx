// Paywall bloqueante para o nutricionista após o trial de 3 dias expirar
// sem assinatura ativa. Renderizado dentro do AppShell.

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Lock, Sparkles } from "lucide-react";

import { getMyNutriTrialStatus } from "@/lib/finance/trial.functions";
import { useAuth } from "@/lib/auth-context";
import { CheckoutModal } from "@/components/CheckoutModal";

export function TrialPaywall() {
  const { user, roles } = useAuth();
  const isAdmin = roles?.includes("admin");
  const fetchTrial = useServerFn(getMyNutriTrialStatus);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["nutri-trial-status", user?.id ?? "anon"],
    queryFn: () => fetchTrial(),
    enabled: !!user?.id && !isAdmin,
    staleTime: 60_000,
  });

  if (isAdmin) return null;
  if (!data || !data.isNutritionist || !data.shouldBlock) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] grid place-items-center bg-background/95 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl space-y-4">
          <div className="size-12 rounded-full bg-primary/10 grid place-items-center">
            <Lock className="size-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary flex items-center gap-1">
              <Sparkles className="size-3" /> Período de teste encerrado
            </p>
            <h2 className="text-xl font-bold tracking-tight mt-1">
              Assine para continuar usando o FitJourney
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Seus 3 dias gratuitos terminaram. Para manter o acesso aos seus
              pacientes, templates, anamneses e planos, escolha um plano abaixo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full bg-primary text-primary-foreground font-medium px-4 py-3 rounded-md hover:opacity-90 transition-opacity"
          >
            Assinar agora
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            Pagamento via cartão (em breve) ou Pix. Já paguei? Envie o
            comprovante pelo WhatsApp dentro do modal.
          </p>
        </div>
      </div>

      <CheckoutModal
        open={open}
        onOpenChange={setOpen}
        audience="nutritionist"
        planLabel="Assinatura mensal"
      />
    </>
  );
}
