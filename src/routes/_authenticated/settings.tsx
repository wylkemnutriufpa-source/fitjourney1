import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getMyNutritionistProfile,
  updateMyNutritionistProfile,
} from "@/lib/profile/nutritionist-profile.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — FitJourney" }] }),
  component: Settings,
});

const inputCls =
  "w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-60";

function Settings() {
  const fetchProfile = useServerFn(getMyNutritionistProfile);
  const updateProfile = useServerFn(updateMyNutritionistProfile);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["my-nutritionist-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 10_000,
  });

  const [fullName, setFullName] = useState("");
  const [crn, setCrn] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setCrn(profile.crn ?? "");
      setEmail(profile.email);
    }
  }, [profile]);

  const [notify, setNotify] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [weekly, setWeekly] = useState(false);

  async function handleSave() {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        data: {
          fullName: fullName.trim(),
          crn: crn.trim() || undefined,
          email: email.trim(),
        },
      });
      toast.success("Configurações salvas");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      header={
        <button
          onClick={handleSave}
          disabled={saving || isLoading}
          className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      }
    >
      <div className="space-y-8 max-w-3xl">
        <div className="space-y-1 border-b border-border pb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Perfil & Preferências
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        </div>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-5">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            01 · Dados Profissionais
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando perfil…</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Nome completo
                </label>
                <input
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Registro CRN
                </label>
                <input
                  className={inputCls}
                  value={crn}
                  onChange={(e) => setCrn(e.target.value)}
                  disabled={saving}
                  placeholder="CRN-3 12345"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Email
                </label>
                <input
                  className={inputCls}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          )}
        </section>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            02 · Notificações
          </h2>
          <p className="text-xs text-muted-foreground -mt-1">
            Preferências locais (ainda não persistidas).
          </p>
          {[
            { l: "Notificações por email", d: "Novos resultados e atualizações", v: notify, set: setNotify },
            { l: "Lembretes de consulta", d: "Avisar 24h antes de cada atendimento", v: reminders, set: setReminders },
            { l: "Relatório semanal", d: "Resumo da base toda segunda às 08:00", v: weekly, set: setWeekly },
          ].map((t) => (
            <label
              key={t.l}
              className="flex items-center justify-between p-4 border border-border rounded-md bg-background cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium">{t.l}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.d}</p>
              </div>
              <button
                type="button"
                onClick={() => t.set(!t.v)}
                className={
                  "relative w-11 h-6 rounded-full transition-colors " +
                  (t.v ? "bg-primary" : "bg-border")
                }
              >
                <span
                  className={
                    "absolute top-0.5 size-5 rounded-full bg-background transition-all " +
                    (t.v ? "left-[22px]" : "left-0.5")
                  }
                />
              </button>
            </label>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
