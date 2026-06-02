import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, ShieldCheck, Loader2 } from "lucide-react";
import { AnamnesisRunner } from "@/lib/anamnesis/v2/components/AnamnesisRunner";
import {
  recordPatientConsent,
  submitInitialAnamnesis,
} from "@/lib/onboarding/onboarding.functions";
import type { Answers } from "@/lib/anamnesis/v2/catalog/types";

export const Route = createFileRoute("/_authenticated/onboarding/patient")({
  head: () => ({ meta: [{ title: "Onboarding — FitJourney" }] }),
  component: PatientOnboardingPage,
});

function PatientOnboardingPage() {
  const navigate = useNavigate();
  const recordConsent = useServerFn(recordPatientConsent);
  const submit = useServerFn(submitInitialAnamnesis);

  const [step, setStep] = useState<"consent" | "anamnesis">("consent");
  const [lgpd, setLgpd] = useState(false);
  const [clinical, setClinical] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConsent() {
    if (!lgpd || !clinical) return;
    setSavingConsent(true);
    setError(null);
    try {
      await recordConsent({
        data: { consentTypes: ["lgpd", "clinical_data"] },
      });
      setStep("anamnesis");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao registrar consentimento.");
    } finally {
      setSavingConsent(false);
    }
  }

  async function handleSubmit(answers: Answers) {
    setSubmitting(true);
    setError(null);
    try {
      await submit({ data: { answers } });
      navigate({ to: "/my-dashboard", replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar anamnese.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Onboarding do paciente
            </p>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="size-7 text-primary" />
              FitJourney
            </h1>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {step === "consent" ? "1/2 Consentimento" : "2/2 Anamnese"}
          </div>
        </header>

        {step === "consent" && (
          <section className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                Termos & Consentimento
              </p>
              <h2 className="text-2xl font-bold tracking-tight">
                Antes de começar
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Para que seu nutricionista possa montar um plano alinhado ao seu
                perfil clínico, precisamos do seu consentimento explícito para
                tratar seus dados pessoais e clínicos. Você pode revogar a
                qualquer momento.
              </p>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 cursor-pointer">
              <input
                type="checkbox"
                checked={lgpd}
                onChange={(e) => setLgpd(e.target.checked)}
                className="mt-1 size-4 accent-primary"
              />
              <div>
                <p className="text-sm font-medium">
                  Concordo com o tratamento dos meus dados pessoais (LGPD)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Nome, e-mail, telefone e demais dados de cadastro serão usados
                  exclusivamente para o serviço de acompanhamento nutricional.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 cursor-pointer">
              <input
                type="checkbox"
                checked={clinical}
                onChange={(e) => setClinical(e.target.checked)}
                className="mt-1 size-4 accent-primary"
              />
              <div>
                <p className="text-sm font-medium">
                  Concordo em compartilhar meus dados clínicos com o
                  nutricionista responsável
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Respostas da anamnese (condições, sintomas, medicações,
                  exames) ficam visíveis apenas para você e seu nutricionista.
                </p>
              </div>
            </label>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleConsent}
              disabled={!lgpd || !clinical || savingConsent}
              className="w-full bg-primary text-primary-foreground rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
            >
              {savingConsent && <Loader2 className="size-4 animate-spin" />}
              Aceitar e continuar
            </button>
          </section>
        )}

        {step === "anamnesis" && (
          <section className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
                Anamnese clínica adaptativa
              </p>
              <h2 className="text-2xl font-bold tracking-tight">Sobre você</h2>
              <p className="text-sm text-muted-foreground">
                Algumas perguntas para entender seu perfil. Só aparece o que se
                aplica à sua resposta anterior.
              </p>
            </div>

            <AnamnesisRunner
              submitting={submitting}
              onSubmit={handleSubmit}
              submitLabel="Enviar anamnese"
              enableDbDraft
            />


            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
                {error}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
