import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getMyIdentityState, type IdentityStateDTO } from "@/lib/phase2/identity.functions";

const STORAGE_KEY = "fj_intro_pending";
const EVENT_NAME = "fj:play-intro";

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

  useEffect(() => {
    if (!show) return;
    const t1 = window.setTimeout(() => setTextVisible(true), 600);
    const t2 = window.setTimeout(() => setFadeOut(true), 6500);
    const t3 = window.setTimeout(() => finish(), 7200);
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
        const identity = await getMyIdentityState();
        navigate({ to: pickLandingRoute(identity) });
      } catch {
        navigate({ to: "/app" });
      }
    }
  }

  function close() {
    setFadeOut(true);
    window.setTimeout(() => finish(), 500);
  }

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      onClick={close}
    >
      <video
        ref={videoRef}
        src="/videos/intro-reference.mp4"
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />

      <div className="relative z-10 text-center px-6">
        <h1
          className={`fj-wordmark text-5xl md:text-7xl lg:text-8xl tracking-tight transition-all duration-1000 ${
            textVisible
              ? "opacity-100 translate-y-0 blur-0"
              : "opacity-0 translate-y-6 blur-sm"
          }`}
          style={{
            color: "oklch(0.85 0.14 155)",
            textShadow:
              "0 0 40px oklch(0.62 0.16 155 / 0.6), 0 0 80px oklch(0.62 0.16 155 / 0.35)",
          }}
        >
          Bem-vindo ao FitJourney
        </h1>
        <p
          className={`mt-6 text-sm md:text-base font-mono uppercase tracking-[0.35em] transition-all duration-1000 delay-500 ${
            textVisible ? "opacity-80 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ color: "oklch(0.78 0.09 85)" }}
        >
          Performance · Nutrition · Lab
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
  );
}
