// Modal acionado pelo avatar no header.
// Substitui o atalho antigo que abria /configurações direto.
// Mostra resumo do usuário e atalhos diferenciados por papel
// (paciente, nutricionista, admin).
//
// READ-ONLY. Não dispara mutations clínicas. Apenas leitura + navegação +
// criação preguiçosa do código de convite (reusa o existente quando há).

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Settings,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Link as LinkIcon,
  Users,
  LayoutDashboard,
  MessageSquareHeart,
  ClipboardList,
  ShieldCheck,
  CalendarClock,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { getMyActiveSubscription } from "@/lib/finance/subscriptions.functions";
import { getMyFeedbackStatus } from "@/lib/feedback/feedback.functions";
import {
  getMyNutritionistProfile,
  getOrCreateMyReferralCode,
} from "@/lib/profile/nutritionist-profile.functions";

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

function daysUntil(dateISO: string | null): number | null {
  if (!dateISO) return null;
  const end = new Date(dateISO).getTime();
  const now = Date.now();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

export function AvatarMenuDialog({
  open,
  onOpenChange,
  role,
  email,
  displayName,
  avatarUrl,
  settingsHref,
  onSignOut,
}: Props) {
  const navigate = useNavigate();
  const initials = (email || displayName).slice(0, 2).toUpperCase();

  function go(to: string) {
    onOpenChange(false);
    navigate({ to });
  }

  const roleLabel =
    role === "admin" ? "Admin" : role === "nutritionist" ? "Nutricionista" : "Paciente";

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
              <DialogTitle className="text-base truncate">{displayName}</DialogTitle>
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

        {role === "patient" && <PatientSummary open={open} />}
        {role === "nutritionist" && <NutritionistSummary open={open} />}

        <div className="grid gap-1.5 pt-2">
          {role === "patient" && <PatientShortcuts onGo={go} settingsHref={settingsHref} />}
          {role === "nutritionist" && (
            <NutritionistShortcuts onGo={go} settingsHref={settingsHref} open={open} />
          )}
          {role === "admin" && <AdminShortcuts onGo={go} settingsHref={settingsHref} />}

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onSignOut();
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left"
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
// Patient
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
  const isSubActive = !!sub && sub.status === "active";
  const fbDaysRemaining =
    fb && fb.lastFeedbackAt && fb.daysSinceLast !== null
      ? fb.frequencyDays - fb.daysSinceLast
      : null;

  return (
    <div className="grid gap-2 pt-1">
      <SummaryRow
        icon={CalendarClock}
        label="Plano"
        value={
          subQuery.isLoading
            ? "Carregando..."
            : !isSubActive
              ? "Sem plano ativo"
              : subDays === null
                ? "Ativo"
                : subDays < 0
                  ? `Expirado há ${pluralDays(Math.abs(subDays))}`
                  : `Vence em ${pluralDays(subDays)}`
        }
        tone={
          !isSubActive
            ? "muted"
            : subDays !== null && subDays < 0
              ? "danger"
              : subDays !== null && subDays <= 7
                ? "warn"
                : "ok"
        }
      />
      <SummaryRow
        icon={MessageSquareHeart}
        label="Próximo feedback"
        value={
          fbQuery.isLoading
            ? "Carregando..."
            : !fb?.hasNutritionist
              ? "Sem profissional vinculado"
              : fb.lastFeedbackAt === null
                ? "Envie seu primeiro feedback"
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
    </div>
  );
}

function PatientShortcuts({
  onGo,
  settingsHref,
}: {
  onGo: (to: string) => void;
  settingsHref: string;
}) {
  return (
    <>
      <MenuItem icon={LayoutDashboard} label="Início" onClick={() => onGo("/my-dashboard")} />
      <MenuItem icon={LayoutDashboard} label="Meu Plano" onClick={() => onGo("/my-plan")} />
      <MenuItem
        icon={MessageSquareHeart}
        label="Feedback"
        onClick={() => onGo("/my-plan/feedback")}
      />
      <MenuItem icon={Settings} label="Configurações" onClick={() => onGo(settingsHref)} />
    </>
  );
}

// ============================================================
// Nutritionist
// ============================================================

function NutritionistSummary({ open }: { open: boolean }) {
  const fetchProfile = useServerFn(getMyNutritionistProfile);
  const profile = useQuery({
    queryKey: ["avatar-menu", "nutri-profile"],
    queryFn: () => fetchProfile(),
    enabled: open,
    staleTime: 60_000,
  });

  if (!profile.data) return null;

  return (
    <div className="grid gap-2 pt-1">
      <SummaryRow
        icon={LinkIcon}
        label="Sua landing"
        value={profile.data.slug ? `/n/${profile.data.slug}` : "Defina seu slug nas Configurações"}
        tone={profile.data.slug ? "ok" : "warn"}
      />
    </div>
  );
}

function NutritionistShortcuts({
  onGo,
  settingsHref,
  open,
}: {
  onGo: (to: string) => void;
  settingsHref: string;
  open: boolean;
}) {
  const fetchProfile = useServerFn(getMyNutritionistProfile);
  const fetchOrCreateCode = useServerFn(getOrCreateMyReferralCode);

  const profile = useQuery({
    queryKey: ["avatar-menu", "nutri-profile"],
    queryFn: () => fetchProfile(),
    enabled: open,
    staleTime: 60_000,
  });

  const code = useQuery({
    queryKey: ["avatar-menu", "nutri-referral"],
    queryFn: () => fetchOrCreateCode(),
    enabled: open,
    staleTime: 60_000,
  });

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const slug = profile.data?.slug ?? null;
  const landingUrl = slug ? `${origin}/n/${slug}` : null;
  const inviteUrl =
    slug && code.data?.code ? `${origin}/c/${slug}/${code.data.code}` : null;

  return (
    <>
      <MenuItem icon={LayoutDashboard} label="Dashboard" onClick={() => onGo("/dashboard")} />
      <MenuItem icon={Users} label="Pacientes" onClick={() => onGo("/patients")} />
      <MenuItem
        icon={ClipboardList}
        label="Anamneses"
        onClick={() => onGo("/anamneses")}
      />
      <MenuItem icon={Settings} label="Configurações" onClick={() => onGo(settingsHref)} />

      <div className="my-1 h-px bg-border/60" />

      <CopyRow
        label="Link da sua landing"
        url={landingUrl}
        fallback={slug ? null : "Defina seu slug nas Configurações"}
      />
      <CopyRow
        label="Link de convite"
        url={inviteUrl}
        fallback={
          !slug
            ? "Defina seu slug nas Configurações"
            : code.isLoading
              ? "Gerando código..."
              : null
        }
      />
    </>
  );
}

// ============================================================
// Admin
// ============================================================

function AdminShortcuts({
  onGo,
  settingsHref,
}: {
  onGo: (to: string) => void;
  settingsHref: string;
}) {
  return (
    <>
      <MenuItem icon={LayoutDashboard} label="Dashboard" onClick={() => onGo("/dashboard")} />
      <MenuItem icon={Users} label="Pacientes" onClick={() => onGo("/patients")} />
      <MenuItem
        icon={ShieldCheck}
        label="Admin · Profissionais"
        onClick={() => onGo("/admin/profissionais")}
      />
      <MenuItem icon={Settings} label="Configurações" onClick={() => onGo(settingsHref)} />
    </>
  );
}

// ============================================================
// Building blocks
// ============================================================

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left"
    >
      <Icon className="size-4" />
      <span className="flex-1">{label}</span>
    </button>
  );
}

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
