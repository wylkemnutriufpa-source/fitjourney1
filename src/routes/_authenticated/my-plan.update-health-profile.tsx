// Atualização da anamnese pós-onboarding. Não confundir com /onboarding/patient
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteBoundaries";
// (primeira entrada, bloqueada após conclusão). Aqui o paciente cria uma NOVA
// versão da anamnese — supersedes_id encadeia, version+1, review_status=submitted.

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, ArrowLeft, Info } from "lucide-react";
import { AnamnesisRunner } from "@/lib/anamnesis/v2/components/AnamnesisRunner";
import { submitPatientAnamnesisUpdate } from "@/lib/anamnesis/review.functions";
import { AppShell } from "@/components/AppShell";
import type { Answers } from "@/lib/anamnesis/v2/catalog/types";

export const Route = createFileRoute("/_authenticated/my-plan/update-health-profile")({
  head: () => ({ meta: [{ title: "Atualizar Perfil de Saúde — FitJourney" }] }),
  component: UpdateHealthProfilePage,
  errorComponent: ({ error, reset }) => (
    <RouteErrorFallback error={error} reset={reset} homeTo="/my-dashboard" homeLabel="Início" />
  ),
  notFoundComponent: () => <RouteNotFoundFallback homeTo="/my-dashboard" homeLabel="Início" />,
});

function UpdateHealthProfilePage() {
  const navigate = useNavigate();
  const submit = useServerFn(submitPatientAnamnesisUpdate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(answers: Answers) {
    setSubmitting(true);
    setError(null);
    try {
      await submit({ data: { answers } });
      navigate({ to: "/my-plan", replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar atualização.");
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <Link
          to="/my-plan"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar ao plano
        </Link>

        <header className="space-y-2 border-b border-border pb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Activity className="size-3.5" />
            Atualização clínica
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            Atualizar perfil de saúde
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Suas respostas geram uma <strong>nova versão</strong> da anamnese.
            O histórico anterior é preservado. Após enviar, seu nutricionista
            revisa antes de qualquer alerta clínico ser atualizado.
          </p>
        </header>

        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          <p>
            Preencha apenas o que mudou desde a última anamnese. O sistema
            mantém todas as suas respostas para comparação clínica.
          </p>
        </div>

        <AnamnesisRunner
          submitting={submitting}
          onSubmit={handleSubmit}
          submitLabel="Enviar atualização"
        />

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </AppShell>
  );
}
