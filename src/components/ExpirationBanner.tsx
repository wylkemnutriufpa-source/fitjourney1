import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, X, Lock } from "lucide-react";
import { getMyExpirationInfo } from "@/lib/finance/expiration.functions";
import { useAuth } from "@/lib/auth-context";

export function ExpirationBanner() {
  const { user } = useAuth();
  const fetchInfo = useServerFn(getMyExpirationInfo);
  const { data } = useQuery({
    queryKey: ["expiration-info", user?.id ?? "anon"],
    queryFn: () => fetchInfo(),
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setDismissed(false); // reset ao trocar de fase
    if (!data) return;
    const key = `fj:exp-dismiss:${data.endsAt}:${data.phase}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key) === "1") {
      setDismissed(true);
    }
  }, [data?.endsAt, data?.phase]);

  if (!data) return null;
  if (data.phase === "ok" || data.phase === "blocked") return null;
  if (dismissed && data.phase === "warn") return null;

  const audience = data.kind === "patient" ? "Seu plano" : "Sua assinatura";
  const renew =
    data.kind === "patient"
      ? "Procure seu nutricionista para renovar."
      : "Renove em Financeiro para manter o acesso.";

  let msg = "";
  let style = "";
  let Icon = AlertTriangle;
  let canDismiss = false;

  if (data.phase === "warn") {
    msg = `${audience} vence em ${data.daysLeft} dia(s) — ${data.endsAt}.`;
    style = "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    canDismiss = true;
  } else if (data.phase === "due") {
    msg = `${audience} vence HOJE (${data.endsAt}). Você terá 2 dias de tolerância antes do bloqueio do acesso.`;
    style = "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40";
  } else {
    // grace
    const left = 2 + data.daysLeft; // daysLeft é -1 ou -2 → 1 ou 0
    msg = `${audience} venceu há ${Math.abs(data.daysLeft)} dia(s). ${
      left > 0
        ? `Resta ${left} dia para regularizar antes do bloqueio.`
        : `O acesso será bloqueado a partir de amanhã.`
    }`;
    style = "bg-destructive/20 text-destructive border-destructive/40";
    Icon = Lock;
  }

  function dismiss() {
    if (data && typeof window !== "undefined") {
      sessionStorage.setItem(`fj:exp-dismiss:${data.endsAt}:${data.phase}`, "1");
    }
    setDismissed(true);
  }

  return (
    <div className={"flex items-center gap-3 px-4 py-2.5 text-sm border-b " + style}>
      <Icon className="size-4 shrink-0" />
      <p className="flex-1">
        <span className="font-semibold">{msg}</span>{" "}
        <span className="opacity-80">{renew}</span>
      </p>
      {canDismiss && (
        <button
          onClick={dismiss}
          title="Fechar"
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
