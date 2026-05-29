import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitJourney — Acesso" },
      { name: "description", content: "Plataforma para nutricionistas esportivos." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar border-r border-border relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary rounded-sm grid place-items-center">
            <div className="size-4 border-2 border-background rotate-45" />
          </div>
          <span className="text-lg font-bold tracking-tight uppercase italic">
            FitJourney
          </span>
        </div>

        <div className="space-y-6 relative z-10">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Performance / Nutrition / Lab
          </p>
          <h1 className="text-5xl font-bold tracking-tighter leading-[0.95]">
            Anamnese clínica.
            <br />
            <span className="italic text-muted-foreground">Dieta cirúrgica.</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Métricas metabólicas calculadas em segundos, templates editáveis e
            substituições equivalentes que se atualizam em tempo real.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 relative z-10">
          {[
            { k: "TMB", v: "Mifflin-St Jeor" },
            { k: "GET", v: "Fator atividade" },
            { k: "TDEE", v: "Objetivo final" },
          ].map((m) => (
            <div key={m.k} className="border border-border rounded-md p-3 bg-surface/60">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {m.v}
              </p>
              <p className="text-lg font-bold font-mono mt-1">{m.k}</p>
            </div>
          ))}
        </div>

        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-8">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {mode === "signin" ? "Acesso" : "Cadastro"}
            </p>
            <h2 className="text-3xl font-bold tracking-tight mt-2">
              {mode === "signin" ? "Entrar no painel" : "Criar conta"}
            </h2>
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Nome
              </label>
              <input
                required
                type="text"
                placeholder="Dr. Marco Silva"
                className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              required
              type="email"
              placeholder="voce@clinica.com"
              defaultValue="marco@fitjourney.app"
              className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Senha
              </label>
              {mode === "signin" && (
                <button type="button" className="text-[10px] font-mono uppercase text-primary hover:underline">
                  Recuperar
                </button>
              )}
            </div>
            <input
              required
              type="password"
              placeholder="••••••••"
              defaultValue="demo1234"
              className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Activity className="size-4" />
            {mode === "signin" ? "Entrar" : "Cadastrar"}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            {mode === "signin" ? "Sem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary hover:underline font-medium"
            >
              {mode === "signin" ? "Criar conta" : "Entrar"}
            </button>
          </p>

          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 text-center">
            <Link to="/dashboard" className="hover:text-primary">
              Pular acesso → demo
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
