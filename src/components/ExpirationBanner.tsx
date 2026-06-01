import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { getMyExpirationInfo } from "@/lib/finance/expiration.functions";
import { useAuth } from "@/lib/auth-context";

const THRESHOLD_DAYS = 5;

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
    if (!data) return;
    const key = `fj:exp-dismiss:${data.endsAt}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key) === "1") {
      setDismissed(true);
    }
  }, [data]);

  if (!data || dismissed) return null;
  if (data.daysLeft > THRESHOLD_DAYS) return null;

  const expired = data.daysLeft < 0;
  const today = data.daysLeft === 0;
  const audience = data.kind === "patient" ? "Seu plano" : "Sua assinatura";

  const msg = expired
    ? `${audience} venceu há ${Math.abs(data.daysLeft)} dia(s) (${data.endsAt}).`
    : today
      ? `${audience} vence hoje (${data.endsAt}).`
      : `${audience} vence em ${data.daysLeft} dia(s) — ${data.endsAt}.`;

  function dismiss() {
    if (data && typeof window !== "undefined") {
      sessionStorage.setItem(`fj:exp-dismiss:${data.endsAt}`, "1");
    }
    setDismissed(true);
  }

  return (
    <div
      className={
        "flex items-center gap-3 px-4 py-2.5 text-sm border-b " +
        (expired
          ? "bg-destructive/15 text-destructive border-destructive/30"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30")
      }
    >
      <AlertTriangle className="size-4 shrink-0" />
      <p className="flex-1">
        <span className="font-medium">{msg}</span>{" "}
        <span className="opacity-80">
          {data.kind === "patient"
            ? "Procure seu nutricionista para renovar."
            : "Renove em Financeiro para manter o acesso."}
        </span>
      </p>
      <button
        onClick={dismiss}
        title="Fechar"
        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
