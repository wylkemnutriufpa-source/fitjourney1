// Modal "ONLINE" — compartilha link de convite do nutricionista.
// Visual no padrão Nutrin: container branco com bordas suaves, padding generoso,
// inputs com float-label, botões pílula. Mantém os tokens semânticos do FJ
// (funciona em tema claro e escuro).

import { useEffect, useId, useMemo, useState } from "react";
import { publicUrl } from "@/lib/public-url";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Copy,
  Link2,
  MessageCircle,
  Mail,
  Loader2,
  Check,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { VideoLoader } from "@/components/VideoLoader";
import {
  getOrCreateMyReferralCode,
  getMyNutritionistProfile,
} from "@/lib/profile/nutritionist-profile.functions";

interface Props {
  open: boolean;
  onClose: () => void;
  patientName?: string;
}

/** Input com float-label estilo Nutrin (label sempre flutuando no topo). */
function FloatField({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="relative">
      <label
        htmlFor={htmlFor}
        className="absolute -top-2 left-3 px-1.5 text-[11px] font-medium text-muted-foreground bg-surface z-10"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function OnlineInviteDialog({ open, onClose, patientName }: Props) {
  const getReferral = useServerFn(getOrCreateMyReferralCode);
  const fetchProfile = useServerFn(getMyNutritionistProfile);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [message, setMessage] = useState("");
  const linkId = useId();
  const msgId = useId();

  const { data: profile } = useQuery({
    queryKey: ["my-nutritionist-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 0,
    refetchOnMount: "always",
    enabled: open,
  });

  const displayName =
    profile?.displayName?.trim() || profile?.fullName?.trim() || "Seu nutricionista";
  const avatarUrl = profile?.avatarUrl || null;

  const inviteUrl = useMemo(() => {
    if (!code) return "";
    if (!profile?.slug) return "";
    return publicUrl(`/c/${profile.slug}/${code}`);
  }, [code, profile?.slug]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const r = await getReferral();
        if (cancelled) return;
        setCode(r?.code ?? null);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Falha ao carregar convite"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [open, getReferral]);

  useEffect(() => {
    if (open) {
      const who = patientName ? ` ${patientName}` : "";
      const from = displayName && displayName !== "Seu nutricionista" ? ` ${displayName}` : "";
      setMessage(
        `Olá${who}! Aqui é${from}. Estou te enviando o link para você criar sua conta no FitJourney e começar sua anamnese: `
      );
    }
  }, [open, patientName, displayName]);

  const fullText = `${message}${inviteUrl}`;

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  async function copyFullMessage() {
    if (!fullText) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
      toast.success("Mensagem inteira copiada");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(
    "Convite FitJourney"
  )}&body=${encodeURIComponent(fullText)}`;

  const inputBase =
    "w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 " +
    "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-3xl w-full max-w-md relative shadow-[0_24px_70px_-20px_rgba(0,0,0,0.25)] border border-border/60 animate-in zoom-in-95 fade-in-0 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Convidar paciente
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              O paciente cria a conta sozinho via link e já cai na anamnese.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 size-9 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 grid place-items-center transition"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-7 pb-7 space-y-5 border-t border-border/60 pt-6">
          {/* Cartão de identidade do profissional */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-background/40">
            <div className="size-12 rounded-full bg-surface border border-border overflow-hidden flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
              ) : (
                <User className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80 font-medium">
                Convite de
              </p>
              <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
              {profile?.specialty && (
                <p className="text-xs text-muted-foreground truncate">{profile.specialty}</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <VideoLoader size="sm" label="Carregando convite…" />
            </div>
          ) : !code ? (
            <p className="text-sm text-destructive">
              Não foi possível gerar o link. Verifique seu perfil em Configurações.
            </p>
          ) : !profile?.slug ? (
            <p className="text-sm text-destructive leading-relaxed">
              Defina seu endereço público em Configurações para liberar o link bonito de convite.
            </p>
          ) : (
            <>
              <FloatField label="Link de convite" htmlFor={linkId}>
                <div className="flex gap-2">
                  <input
                    id={linkId}
                    readOnly
                    value={inviteUrl}
                    className={inputBase + " font-mono text-xs pr-2"}
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="shrink-0 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition"
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </FloatField>

              <FloatField label="Mensagem (editável)" htmlFor={msgId}>
                <textarea
                  id={msgId}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className={inputBase + " resize-none leading-relaxed"}
                />
              </FloatField>
              <p className="-mt-3 text-[11px] text-muted-foreground/70 px-1">
                O link será anexado automaticamente ao final.
              </p>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
                  className="flex flex-col items-center gap-2 py-3.5 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <MessageCircle className="size-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.open(mailUrl, "_blank", "noopener,noreferrer")}
                  className="flex flex-col items-center gap-2 py-3.5 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Mail className="size-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">Email</span>
                </button>
                <button
                  type="button"
                  onClick={copyFullMessage}
                  className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl border transition-colors ${
                    copiedAll
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {copiedAll ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Copy className="size-4 text-primary" />
                  )}
                  <span className={`text-xs font-medium ${copiedAll ? "text-primary" : "text-foreground"}`}>
                    {copiedAll ? "Copiado" : "Copiar tudo"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 flex items-center justify-between border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={copyLink}
            disabled={!code || loading}
            className="rounded-full bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {copied ? "Copiado" : "Copiar link"}
          </button>
        </div>
      </div>
    </div>
  );
}
