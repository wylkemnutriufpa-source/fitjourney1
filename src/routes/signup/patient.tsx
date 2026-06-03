// Cadastro de paciente via link de convite.
// Fluxo: ?code=XXX → valida → form (nome, email, senha) → cria conta
// auto-confirmada → login automático → /onboarding/patient (criado na Fase 2).
// Por enquanto, após login redireciona para /my-plan.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Activity, Loader2, Eye, EyeOff, CheckCircle2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  validateReferralCode,
  consumeReferralCodeAndCreatePatient,
} from "@/lib/signup/patient-signup.functions";
import { maskPhoneBR, normalizePhoneE164, isValidPhoneBR } from "@/lib/phone-mask";

const SearchSchema = z.object({
  code: z.string().trim().toUpperCase().optional(),
});

export const Route = createFileRoute("/signup/patient")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Convite — FitJourney" },
      { name: "description", content: "Cadastro de paciente via convite." },
    ],
  }),
  component: PatientSignupPage,
});

function PatientSignupPage() {
  const { code } = Route.useSearch();
  const navigate = useNavigate();
  const validate = useServerFn(validateReferralCode);
  const consume = useServerFn(consumeReferralCodeAndCreatePatient);

  const [validating, setValidating] = useState(true);
  const [validatedNutri, setValidatedNutri] = useState<{
    name: string;
    avatarUrl: string | null;
    specialty: string | null;
  } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!code) {
        setCodeError("Link de convite ausente.");
        setValidating(false);
        return;
      }
      try {
        const r = await validate({ data: { code } });
        if (cancelled) return;
        setValidatedNutri({
          name: r.nutritionistName,
          avatarUrl: r.nutritionistAvatarUrl,
          specialty: r.nutritionistSpecialty,
        });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Código inválido.";
        setCodeError(translateCodeError(msg));
      } finally {
        if (!cancelled) setValidating(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [code, validate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code) return;
    setError(null);
    setSubmitting(true);
    try {
      await consume({
        data: { code, fullName, email, password, phone: normalizePhone(phone) },
      });
      // login automático
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) throw signInErr;
      navigate({ to: "/onboarding/patient" as never, replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao criar conta.";
      setError(translateCodeError(message));
    } finally {
      setSubmitting(false);
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Validando convite…
        </div>
      </div>
    );
  }

  if (codeError) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground px-4">
        <div className="max-w-sm space-y-4 text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest text-destructive">
            Convite inválido
          </p>
          <h2 className="text-2xl font-bold">{codeError}</h2>
          <p className="text-sm text-muted-foreground">
            Peça um novo link ao seu nutricionista.
          </p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Entre em contato com seu nutricionista.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground px-4 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-7">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-primary" />
            Convite válido
          </p>
          {validatedNutri && (
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
              <div className="size-16 rounded-full bg-background border border-border overflow-hidden flex items-center justify-center shrink-0">
                {validatedNutri.avatarUrl ? (
                  <img
                    src={validatedNutri.avatarUrl}
                    alt={validatedNutri.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-7 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Convite de
                </p>
                <p className="text-lg font-bold tracking-tight truncate">
                  {validatedNutri.name}
                </p>
                {validatedNutri.specialty && (
                  <p className="text-xs text-muted-foreground truncate">
                    {validatedNutri.specialty}
                  </p>
                )}
              </div>
            </div>
          )}
          <h2 className="text-3xl font-bold tracking-tight mt-2">
            Cadastro de paciente
          </h2>
          {validatedNutri && (
            <p className="text-xs text-muted-foreground mt-2">
              Você foi convidado por <strong>{validatedNutri.name}</strong>.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Nome completo
          </label>
          <input
            required
            type="text"
            maxLength={255}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Email
          </label>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            WhatsApp
          </label>
          <input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+55 11 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <p className="text-[10px] text-muted-foreground/70 font-mono">
            Usado pelo seu nutricionista para contato direto.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Senha (mín. 8 caracteres)
          </label>
          <div className="relative">
            <input
              required
              minLength={8}
              maxLength={128}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface border border-border rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2 break-words">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Activity className="size-4" />
          )}
          Criar conta
        </button>

        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 text-center">
          Já tem conta?{" "}
          <Link to="/app" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}

function translateCodeError(msg: string): string {
  if (msg.includes("INVALID_CODE")) return "Código de convite inválido.";
  if (msg.includes("CODE_NOT_ACTIVE")) return "Este convite já foi utilizado.";
  if (msg.includes("CODE_EXPIRED")) return "Este convite expirou.";
  if (msg.includes("CODE_RACE_LOST"))
    return "Este convite foi consumido em outra aba. Solicite um novo.";
  if (msg.includes("EMAIL_ALREADY_EXISTS_UNLINKED"))
    return "Já existe uma conta com este email, mas ela não está vinculada a este convite. Entre com a senha original ou use outro email.";
  if (msg.toLowerCase().includes("already") && msg.toLowerCase().includes("registered"))
    return "Já existe uma conta com este email.";
  return msg;
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  return input.trim().startsWith("+") ? `+${digits}` : `+${digits}`;
}
