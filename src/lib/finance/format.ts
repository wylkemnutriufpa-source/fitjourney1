import type {
  SubscriptionPlanKind,
  SubscriptionStatus,
  SubscriptionPaymentMethod,
} from "./subscriptions.functions";

export function formatMoneyBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function planKindLabel(k: SubscriptionPlanKind): string {
  switch (k) {
    case "monthly":
      return "Mensal";
    case "quarterly":
      return "Trimestral";
    case "semiannual":
      return "Semestral";
    case "annual":
      return "Anual";
    case "custom":
      return "Personalizado";
  }
}

export function statusLabel(s: SubscriptionStatus): string {
  switch (s) {
    case "active":
      return "Ativa";
    case "paused":
      return "Pausada";
    case "expired":
      return "Vencida";
    case "cancelled":
      return "Cancelada";
  }
}

export function paymentMethodLabel(m: SubscriptionPaymentMethod | null): string {
  if (!m) return "—";
  switch (m) {
    case "pix":
      return "Pix";
    case "card":
      return "Cartão";
    case "cash":
      return "Dinheiro";
    case "transfer":
      return "Transferência";
    case "boleto":
      return "Boleto";
    case "other":
      return "Outro";
  }
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today.getTime()) / (1000 * 60 * 60 * 24));
}
