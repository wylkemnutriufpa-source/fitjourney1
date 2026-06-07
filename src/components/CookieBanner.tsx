// Cookie consent banner — armazena escolha em localStorage.
// Não bloqueia uso; informa e dá link para Política de Privacidade.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "fj_cookie_consent_v1";

type Choice = "accepted" | "essential-only";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage indisponível: não exibir para não travar UX.
    }
  }, []);

  function persist(choice: Choice) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: new Date().toISOString() }),
      );
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-xl bg-surface border border-border rounded-lg shadow-lg p-4 flex items-start gap-3"
    >
      <div className="size-8 rounded-full bg-primary/10 grid place-items-center shrink-0">
        <Cookie className="size-4 text-primary" />
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        <p className="text-xs text-foreground leading-relaxed">
          Usamos cookies essenciais para o funcionamento da plataforma e cookies analíticos para
          melhorar sua experiência. Veja nossa{" "}
          <Link to="/privacidade" className="text-primary hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => persist("accepted")}
            className="text-[11px] font-semibold py-1.5 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Aceitar todos
          </button>
          <button
            type="button"
            onClick={() => persist("essential-only")}
            className="text-[11px] font-semibold py-1.5 px-3 rounded-md border border-border text-muted-foreground hover:text-foreground"
          >
            Apenas essenciais
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => persist("essential-only")}
        aria-label="Fechar"
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
