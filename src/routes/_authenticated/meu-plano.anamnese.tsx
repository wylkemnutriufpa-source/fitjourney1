// Visualização (read-only) da própria anamnese aprovada pelo paciente.
// Reusa o mesmo AnamnesisAnswersView do perfil profissional → uma única
// fonte de verdade para a renderização das respostas.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ClipboardList, CheckCircle2, Pencil } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AnamnesisAnswersView } from "@/components/anamnesis/AnamnesisAnswersView";
import { getMyApprovedAnamnesisFull } from "@/lib/anamnesis/review.functions";

export const Route = createFileRoute("/_authenticated/meu-plano/anamnese")({
  head: () => ({ meta: [{ title: "Minha Anamnese — FitJourney" }] }),
  component: MyAnamnesePage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="text-sm text-destructive" role="alert">
        Não foi possível carregar sua anamnese: {error.message}
      </div>
    </AppShell>
  ),
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function MyAnamnesePage() {
  const fetchFn = useServerFn(getMyApprovedAnamnesisFull);
  const { data, isLoading } = useQuery({
    queryKey: ["my-approved-anamnesis-full"],
    queryFn: () => fetchFn(),
    staleTime: 60_000,
  });

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <Link
              to="/my-dashboard"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3" /> voltar
            </Link>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              Minha anamnese
            </h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Estas são as respostas da sua última anamnese aprovada — a base
              clínica usada pelo seu nutricionista para montar seu plano.
            </p>
          </div>
          {data && (
            <div className="text-right text-[11px] font-mono text-muted-foreground space-y-0.5">
              <p className="inline-flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="size-3" /> aprovada
              </p>
              <p>versão v{data.version}</p>
              <p>em {formatDate(data.approvedAt)}</p>
            </div>
          )}
        </header>

        {isLoading && (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        )}

        {!isLoading && !data && (
          <div className="bg-surface border border-border rounded-lg p-6 space-y-2">
            <p className="text-sm">
              Você ainda não tem uma anamnese aprovada.
            </p>
            <p className="text-xs text-muted-foreground">
              Assim que seu nutricionista aprovar sua anamnese, as respostas
              ficam disponíveis aqui.
            </p>
          </div>
        )}

        {data && (
          <>
            <div className="bg-surface border border-border rounded-lg p-5">
              <AnamnesisAnswersView rawJson={data.rawAnswersJson} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="space-y-1 max-w-md">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Pencil className="size-3.5 text-primary" /> Algo mudou?
                </p>
                <p className="text-xs text-muted-foreground">
                  Crie uma nova versão da sua anamnese. O histórico anterior é
                  preservado e seu nutricionista revisa antes de virar verdade
                  clínica.
                </p>
              </div>
              <Link
                to="/meu-plano/update-health-profile"
                className="text-xs font-semibold py-2 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2"
              >
                <Pencil className="size-3.5" /> Atualizar minha anamnese
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
