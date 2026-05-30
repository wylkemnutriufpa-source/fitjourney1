import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Loader2, ShieldCheck, LogOut } from "lucide-react";
import { createNutritionistProfile } from "@/domain/write/nutritionist.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/onboarding/nutritionist")({
  head: () => ({
    meta: [{ title: "Onboarding — FitJourney" }],
  }),
  component: OnboardingNutritionistPage,
});

function OnboardingNutritionistPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const createProfile = useServerFn(createNutritionistProfile);

  const [fullName, setFullName] = useState("");
  const [crn, setCrn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createProfile({
        data: {
          fullName: fullName.trim(),
          crn: crn.trim() || undefined,
        },
      });
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao criar perfil.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-7">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary">
            <ShieldCheck className="size-3.5" />
            Email confirmado
          </div>
          <h2 className="text-3xl font-bold tracking-tight mt-2">
            Complete seu perfil
          </h2>
          <p className="text-xs text-muted-foreground mt-2 break-all">
            {user?.email}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Nome completo
          </label>
          <input
            required
            maxLength={255}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            CRN (opcional)
          </label>
          <input
            maxLength={64}
            value={crn}
            onChange={(e) => setCrn(e.target.value)}
            placeholder="ex: CRN-1 12345"
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
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
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Concluir cadastro
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-3" />
          Sair
        </button>
      </form>
    </div>
  );
}
