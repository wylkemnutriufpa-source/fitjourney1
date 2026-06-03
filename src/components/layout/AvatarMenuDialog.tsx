// Modal do avatar — RESUMO objetivo, sem duplicar a sidebar.
//
// Paciente:
//   - Plano contratado (kind + preço)
//   - Início e fim da assinatura + cronômetro de vencimento
//   - Último feedback + cronômetro do próximo
//
// Profissional:
//   - Link da landing (copy)
//   - Link de convite (copy)
//   - Plano contratado + vencimento (cronômetro)
//
// READ-ONLY. Sem shortcuts de navegação (a sidebar já cobre).

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  LogOut,
  ExternalLink,
  Copy,
  Check,
  CalendarClock,
  MessageSquareHeart,
  ShieldCheck,
  Wallet,
  Clock,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { getMyActiveSubscription } from "@/lib/finance/subscriptions.functions";
import { getMyExpirationInfo } from "@/lib/finance/expiration.functions";
import { getMyFeedbackStatus } from "@/lib/feedback/feedback.functions";
import {
  getMyNutritionistProfile,
  getOrCreateMyReferralCode,
} from "@/lib/profile/nutritionist-profile.functions";
import {
  daysUntil,
  formatMoneyBRL,
  formatShortDate,
  planKindLabel,
} from "@/lib/finance/format";

type Role = "patient" | "nutritionist" | "admin";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  settingsHref: string;
  onSignOut: () => void;
};

function pluralDays(n: number) {
  return `${n} dia${n === 1 ? "" : "s"}`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function AvatarMenuDialog({
  open,
  onOpenChange,
  role,
  email,
  displayName,
  avatarUrl,
  onSignOut,
}: Props) {
  const initials = (email || displayName).slice(0, 2).toUpperCase();
  const roleLabel =
    role === "admin"
      ? "Admin"
      : role === "nutritionist"
        ? "Nutricionista"
        : "Paciente";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-surface border border-border overflow-hidden grid place-items-center text-sm font-mono shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-base truncate">
                {displayName}
              </DialogTitle>
              <DialogDescription className="text-xs truncate flex items-center gap-2">
                <span className="truncate">{email}</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase text-primary border border-primary/40 rounded px-1.5 py-0.5 shrink-0">
                  {role === "admin" && <ShieldCheck className="size-2.5" />}
                  {roleLabel}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-2 pt-1">
          {role === "patient" && <PatientSummary open={open} />}
          {(role === "nutritionist" || role === "admin") && (
            <NutritionistSummary open={open} />
          )}
        </div>

        <div className="pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onSignOut();
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left w-full"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Patient summary
// ============================================================

function PatientSummary({ open }: { open: boolean }) {
  const fetchSub = useServerFn(getMyActiveSubscription);
  const fetchFb = useServerFn(getMyFeedbackStatus);

  const subQuery = useQuery({
    queryKey: ["avatar-menu", "patient-sub"],
    queryFn: () => fetchSub(),
    enabled: open,
    staleTime: 60_000,
  });
  const fbQuery = useQuery({
    queryKey: ["avatar-menu", "patient-fb"],
    queryFn: () => fetchFb(),
    enabled: open,
    staleTime: 60_000,
  });

  const sub = subQuery.data;
  const fb = fbQuery.data;

  const subDays = sub ? daysUntil(sub.endsAt) : null;
  const isActive = !!sub && sub.status === "active";
  const fbDaysRemaining =
    fb && fb.lastFeedbackAt && fb.daysSinceLast !== null
      ? fb.frequencyDays - fb.daysSinceLast
      : null;

  return (
    <>
      {/* Plano contratado */}
      <SummaryRow
        icon={Wallet}
        label="Plano contratado"
        value={
          subQuery.isLoading
            ? "Carregando..."
            : !sub
              ? "Nenhum plano registrado"
              : `${planKindLabel(sub.planKind)} · ${formatMoneyBRL(sub.priceCents)}`
        }
        tone={!sub ? "muted" : isActive ? "ok" : "warn"}
      />

      {/* Início e fim */}
      <SummaryRow
        icon={CalendarClock}
        label="Vigência"
        value={
          sub
            ? `${formatShortDate(sub.startsAt)} → ${formatShortDate(sub.endsAt)}`
            : "—"
        }
        tone="muted"
      />

      {/* Cronômetro de vencimento */}
      <SummaryRow
        icon={Clock}
        label="Vence em"
        value={
          !sub || subDays === null
            ? "—"
            : subDays < 0
              ? `Vencido há ${pluralDays(Math.abs(subDays))}`
              : subDays === 0
                ? "Vence hoje"
                : pluralDays(subDays)
        }
        tone={
          !sub || subDays === null
            ? "muted"
            : subDays < 0
              ? "danger"
              : subDays <= 7
                ? "warn"
                : "ok"
        }
      />

      {/* Último feedback */}
      <SummaryRow
        icon={MessageSquareHeart}
        label="Último feedback"
        value={
          fbQuery.isLoading
            ? "Carregando..."
            : !fb?.hasNutritionist
              ? "Sem profissional vinculado"
              : fb.lastFeedbackAt === null
                ? "Nenhum enviado"
                : `${formatTimestamp(fb.lastFeedbackAt)}${
                    fb.daysSinceLast !== null
                      ? ` · há ${pluralDays(fb.daysSinceLast)}`
                      : ""
                  }`
        }
        tone={fb?.lastFeedbackAt ? "ok" : "muted"}
      />

      {/* Próximo feedback */}
      <SummaryRow
        icon={Clock}
        label="Próximo feedback"
        value={
          !fb?.hasNutritionist
            ? "—"
            : fb.lastFeedbackAt === null
              ? "Envie o primeiro"
              : fbDaysRemaining === null
                ? "—"
                : fbDaysRemaining < 0
                  ? `Atrasado há ${pluralDays(Math.abs(fbDaysRemaining))}`
                  : fbDaysRemaining === 0
                    ? "É hoje"
                    : `Em ${pluralDays(fbDaysRemaining)}`
        }
        tone={
          !fb?.hasNutritionist
            ? "muted"
            : fbDaysRemaining !== null && fbDaysRemaining < 0
              ? "danger"
              : fbDaysRemaining === 0
                ? "warn"
                : "ok"
        }
      />
    </>
  );
}

// ============================================================
// Nutritionist / Admin summary
// ============================================================

function NutritionistSummary({ open }: { open: boolean }) {
  const fetchProfile = useServerFn(getMyNutritionistProfile);
  const fetchCode = useServerFn(getOrCreateMyReferralCode);
  const fetchExpiration = useServerFn(getMyExpirationInfo);

  const profile = useQuery({
    queryKey: ["avatar-menu", "nutri-profile"],
    queryFn: () => fetchProfile(),
    enabled: open,
    staleTime: 60_000,
  });
  const code = useQuery({
    queryKey: ["avatar-menu", "nutri-referral"],
    queryFn: () => fetchCode(),
    enabled: open && !!profile.data?.slug,
    staleTime: 60_000,
  });
  const expiration = useQuery({
    queryKey: ["avatar-menu", "nutri-expiration"],
    queryFn: () => fetchExpiration(),
    enabled: open,
    staleTime: 60_000,
  });

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const slug = profile.data?.slug ?? null;
  const landingUrl = slug ? `${origin}/n/${slug}` : null;
  const inviteUrl =
    slug && code.data?.code ? `${origin}/c/${slug}/${code.data.code}` : null;

  const exp = expiration.data;

  return (
    <>
      <CopyRow
        label="Link da landing"
        url={landingUrl}
        fallback={slug ? null : "Defina seu slug nas Configurações"}
      />
      <CopyRow
        label="Link de cadastro (convite)"
        url={inviteUrl}
        fallback={
          !slug
            ? "Defina seu slug nas Configurações"
            : code.isLoading
              ? "Gerando código..."
              : null
        }
      />

      <SummaryRow
        icon={Wallet}
        label="Plano contratado"
        value={
          expiration.isLoading
            ? "Carregando..."
            : exp && exp.kind === "nutritionist"
              ? exp.planLabel
              : "Nenhum plano ativo"
        }
        tone={exp?.kind === "nutritionist" ? "ok" : "muted"}
      />
      <SummaryRow
        icon={Clock}
        label="Vence em"
        value={
          !exp || exp.kind !== "nutritionist"
            ? "—"
            : exp.daysLeft < 0
              ? `Vencido há ${pluralDays(Math.abs(exp.daysLeft))} (${formatTimestamp(exp.endsAt + "T00:00:00")})`
              : exp.daysLeft === 0
                ? "Vence hoje"
                : `${pluralDays(exp.daysLeft)} (${formatTimestamp(exp.endsAt + "T00:00:00")})`
        }
        tone={
          !exp || exp.kind !== "nutritionist"
            ? "muted"
            : exp.daysLeft < 0
              ? "danger"
              : exp.daysLeft <= 7
                ? "warn"
                : "ok"
        }
      />
    </>
  );
}

// ============================================================
// Building blocks
// ============================================================

function SummaryRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "ok" | "warn" | "danger" | "muted";
}) {
  const toneClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "warn"
        ? "text-amber-500"
        : tone === "ok"
          ? "text-primary"
          : "text-muted-foreground";
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-border/60 bg-surface/40">
      <Icon className={"size-4 shrink-0 " + toneClass} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={"text-sm truncate " + toneClass}>{value}</p>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  url,
  fallback,
}: {
  label: string;
  url: string | null;
  fallback: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // noop
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/60 bg-surface/40">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {url ? (
          <p className="text-xs font-mono truncate text-foreground">{url}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{fallback ?? "—"}</p>
        )}
      </div>
      {url && (
        <>
          <button
            type="button"
            onClick={handleCopy}
            title="Copiar link"
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 shrink-0"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            title="Abrir em nova aba"
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 shrink-0"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </>
      )}
    </div>
  );
}
