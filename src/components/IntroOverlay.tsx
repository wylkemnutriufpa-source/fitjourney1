import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getMyIdentityState, type IdentityStateDTO } from "@/lib/phase2/identity.functions";
import { createLead } from "@/lib/landing/leads.functions";
import introVideo from "@/assets/intro-reference.mp4.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "fj_intro_pending";
const EVENT_NAME = "fj:play-intro";
// Velocidade do vídeo da intro — menor que 1 deixa o giro mais lento e cinematográfico
const INTRO_PLAYBACK_RATE = 0.85;

export function markIntroPending() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function playIntro() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function pickLandingRoute(identity: IdentityStateDTO): "/dashboard" | "/my-dashboard" | "/onboarding/patient" | "/onboarding/nutritionist" | "/auth/check-email" {
  if (identity.appRoles.includes("admin")) return "/dashboard";
  if (identity.state === "S1") return "/auth/check-email";
  if (identity.role === "patient") {
    return identity.patient?.onboardingCompletedAt ? "/my-dashboard" : "/onboarding/patient";
  }
  if (identity.state === "S2") return "/onboarding/nutritionist";
  return "/dashboard";
}

export function IntroOverlay() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const manualRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        sessionStorage.removeItem(STORAGE_KEY);
        manualRef.current = false;
        setShow(true);
      }
    } catch {
      // ignore
    }
    const handler = () => {
      manualRef.current = true;
      setFadeOut(false);
      setTextVisible(false);
      setShow(true);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  // Aplica playbackRate quando o vídeo carrega
  useEffect(() => {
    if (!show) return;
    const v = videoRef.current;
    if (v) {
      v.playbackRate = INTRO_PLAYBACK_RATE;
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;
    // Texto entra acompanhando o giro (vídeo agora roda em ~0.55x ⇒ tempos ajustados)
    const t1 = window.setTimeout(() => setTextVisible(true), 2000);
    const t2 = window.setTimeout(() => setFadeOut(true), 6200);
    const t3 = window.setTimeout(() => finish(), 6800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  async function finish() {
    const wasManual = manualRef.current;
    setShow(false);
    setFadeOut(false);
    setTextVisible(false);
    manualRef.current = false;
    if (wasManual) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          // Visitante: abre modal premium de captura de lead
          setShowLeadModal(true);
          return;
        }
        const identity = await getMyIdentityState();
        navigate({ to: pickLandingRoute(identity) });
      } catch {
        setShowLeadModal(true);
      }
    }
  }

  function close() {
    setFadeOut(true);
    window.setTimeout(() => finish(), 500);
  }

  return (
    <>
      {show && (
        <div
          className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
          onClick={close}
        >
          <video
            ref={videoRef}
            src={introVideo.url}
            autoPlay
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60" />

          <div className="relative z-10 text-center px-6">
            <h1
              className={`fj-wordmark text-4xl md:text-6xl lg:text-7xl tracking-tight ${
                textVisible
                  ? "opacity-100 translate-y-0 blur-0"
                  : "opacity-0 translate-y-8 blur-md"
              }`}
              style={{
                color: "oklch(0.85 0.14 155)",
                textShadow:
                  "0 0 40px oklch(0.62 0.16 155 / 0.6), 0 0 80px oklch(0.62 0.16 155 / 0.35)",
                transition:
                  "opacity 2200ms cubic-bezier(0.22, 1, 0.36, 1), transform 2200ms cubic-bezier(0.22, 1, 0.36, 1), filter 2200ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              Bem-vindo ao sistema FitJourney
            </h1>
            <p
              className={`mt-6 text-sm md:text-base font-mono uppercase tracking-[0.35em] ${
                textVisible ? "opacity-80 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{
                color: "oklch(0.78 0.13 85)",
                textShadow: "0 0 20px oklch(0.65 0.14 85 / 0.4)",
                transition:
                  "opacity 1800ms ease-out 900ms, transform 1800ms ease-out 900ms",
              }}
            >
              Tecnologia, inovação e praticidade em um só lugar.
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute bottom-6 right-6 z-20 text-xs uppercase tracking-widest text-white/60 hover:text-white border border-white/20 hover:border-white/60 px-3 py-1.5 rounded-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      )}

      {showLeadModal && (
        <LeadCaptureModal onClose={() => setShowLeadModal(false)} />
      )}
    </>
  );
}

function LeadCaptureModal({ onClose }: { onClose: () => void }) {
  const submitLead = useServerFn(createLead);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitLead({
        data: {
          fullName: fullName.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          source: "landing_intro",
        },
      });
      setDone(true);
      toast.success("Recebemos seu contato. Em breve falaremos com você!");
      window.setTimeout(() => onClose(), 1800);
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4 animate-fade-in"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 70%)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border p-8 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)] animate-scale-in"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.18 0.02 240) 0%, oklch(0.12 0.02 240) 100%)",
          borderColor: "oklch(0.62 0.16 155 / 0.35)",
          boxShadow:
            "0 0 0 1px oklch(0.62 0.16 155 / 0.15), 0 30px 120px -20px rgba(0,0,0,0.8), inset 0 1px 0 oklch(0.85 0.14 155 / 0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white text-xl leading-none"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <p
            className="text-[10px] font-mono uppercase tracking-[0.4em] mb-3"
            style={{ color: "oklch(0.78 0.13 85)" }}
          >
            Acesso premium
          </p>
          <h2
            className="fj-wordmark text-2xl md:text-3xl tracking-tight"
            style={{ color: "oklch(0.92 0.05 155)" }}
          >
            Cadastre-se para receber<br />informações e promoções
          </h2>
          <p className="mt-3 text-sm text-white/60 leading-relaxed">
            Seja o primeiro a saber das novidades, lançamentos e ofertas exclusivas
            do FitJourney.
          </p>
        </div>

        {done ? (
          <div className="py-8 text-center">
            <div
              className="mx-auto mb-4 size-14 rounded-full grid place-items-center"
              style={{
                background: "oklch(0.62 0.16 155 / 0.15)",
                border: "1px solid oklch(0.62 0.16 155 / 0.4)",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-7" stroke="oklch(0.85 0.14 155)" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-white/80 font-medium">Cadastro confirmado!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              type="text"
              placeholder="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[oklch(0.62_0.16_155/0.6)] focus:bg-white/10 transition"
            />
            <input
              required
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[oklch(0.62_0.16_155/0.6)] focus:bg-white/10 transition"
            />
            <input
              required
              type="tel"
              placeholder="WhatsApp (DDD + número)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              maxLength={40}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[oklch(0.62_0.16_155/0.6)] focus:bg-white/10 transition"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 rounded-lg font-semibold tracking-wide text-black transition disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.85 0.14 155) 0%, oklch(0.78 0.13 85) 100%)",
                boxShadow: "0 8px 30px -10px oklch(0.62 0.16 155 / 0.6)",
              }}
            >
              {submitting ? "Enviando..." : "Quero receber"}
            </button>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 text-center pt-2">
              Seus dados ficam seguros e nunca são compartilhados.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
