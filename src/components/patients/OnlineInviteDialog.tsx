// Modal "ONLINE" — compartilha link de convite do nutricionista.
// Reusa o referral code genérico (1 por nutri). Mensagem editável.
// Compartilhamento: copiar / WhatsApp / Email.

import { useEffect, useMemo, useState } from "react";
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
import {
  getOrCreateMyReferralCode,
  getMyNutritionistProfile,
} from "@/lib/profile/nutritionist-profile.functions";

interface Props {
  open: boolean;
  onClose: () => void;
  patientName?: string;
}

export function OnlineInviteDialog({ open, onClose, patientName }: Props) {
  const getReferral = useServerFn(getOrCreateMyReferralCode);
  const fetchProfile = useServerFn(getMyNutritionistProfile);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["my-nutritionist-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 30_000,
    enabled: open,
  });

  const displayName =
    profile?.displayName?.trim() || profile?.fullName?.trim() || "Seu nutricionista";
  const avatarUrl = profile?.avatarUrl || null;

  const inviteUrl = useMemo(() => {
    if (!code) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/signup/patient?code=${code}`;
  }, [code]);

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

  if (!open) return null;

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  const fullText = `${message}${inviteUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(
    "Convite FitJourney"
  )}&body=${encodeURIComponent(fullText)}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg w-full max-w-md p-6 space-y-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Convite Online
          </p>
          <h2 className="text-xl font-bold tracking-tight mt-1">
            Convidar paciente
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            O paciente cria a conta sozinho via link e cai direto na anamnese.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando convite…
          </div>
        ) : !code ? (
          <p className="text-xs text-destructive">
            Não foi possível gerar o link. Verifique seu perfil em
            Configurações.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Link de convite
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90"
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Mensagem (editável)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <p className="text-[10px] font-mono text-muted-foreground/70">
                O link será anexado automaticamente ao final.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
                className="flex flex-col items-center gap-1.5 py-3 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <MessageCircle className="size-4" />
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  WhatsApp
                </span>
              </button>
              <button
                type="button"
                onClick={() => window.open(mailUrl, "_blank", "noopener,noreferrer")}
                className="flex flex-col items-center gap-1.5 py-3 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Mail className="size-4" />
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  Email
                </span>
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="flex flex-col items-center gap-1.5 py-3 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Link2 className="size-4" />
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  Copiar
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
