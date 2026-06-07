// Reusable error/notFound boundaries for routes — keeps `_authenticated`
// child routes from blanking the app when a serverFn fails.
import { Link } from "@tanstack/react-router";

export function RouteErrorFallback({
  error,
  reset,
  homeTo = "/",
  homeLabel = "Voltar",
}: {
  error: Error;
  reset: () => void;
  homeTo?: string;
  homeLabel?: string;
}) {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div className="max-w-sm space-y-4 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-destructive">
          Erro ao carregar
        </p>
        <h2 className="text-xl font-bold">Algo deu errado nesta tela.</h2>
        <p className="text-sm text-muted-foreground break-words">{error?.message ?? "Erro desconhecido"}</p>
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={reset}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-semibold"
          >
            Tentar novamente
          </button>
          <Link
            to={homeTo}
            className="px-4 py-2 rounded border border-border text-xs font-semibold hover:bg-accent/40"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function RouteNotFoundFallback({
  message = "Página não encontrada.",
  homeTo = "/",
  homeLabel = "Voltar",
}: {
  message?: string;
  homeTo?: string;
  homeLabel?: string;
}) {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div className="max-w-sm space-y-4 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          404
        </p>
        <h2 className="text-xl font-bold">{message}</h2>
        <Link
          to={homeTo}
          className="inline-block px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-semibold"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
