import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { UserCheck, X } from "lucide-react";

type LayoutSearch = {
  readonly patientId?: string;
  readonly patientName?: string;
};

export const Route = createFileRoute("/_authenticated/protocolos")({
  validateSearch: (s: Record<string, unknown>): LayoutSearch => ({
    patientId: typeof s.patientId === "string" ? s.patientId : undefined,
    patientName: typeof s.patientName === "string" ? s.patientName : undefined,
  }),
  component: ProtocolosLayout,
});

function ProtocolosLayout() {
  const { patientId, patientName } = Route.useSearch();
  return (
    <>
      {patientId && (
        <div className="sticky top-0 z-30 border-b border-[var(--gold)]/40 bg-[color-mix(in_oklab,var(--gold)_8%,var(--background))] backdrop-blur">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:px-6">
            <p className="min-w-0 text-xs font-mono uppercase tracking-wider text-[var(--gold)] flex items-center gap-2">
              <UserCheck className="size-3.5 shrink-0" />
              <span className="truncate">Comparando com <span className="font-bold">{patientName ?? "paciente"}</span></span>
            </p>
            <Link
              to="/patients/$id"
              params={{ id: patientId }}
              className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-[var(--gold)] flex items-center gap-1"
            >
              <X className="size-3" /> sair do contexto
            </Link>
          </div>
        </div>
      )}
      <Outlet />
    </>
  );
}
