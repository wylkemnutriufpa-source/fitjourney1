// Patient Settings — paciente edita nome e WhatsApp.
// Dados clínicos NÃO entram aqui: vão pelo Runner (anamnese versionada).

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Save, Loader2, ArrowLeft, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import {
  getMyPatientProfile,
  updateMyPatientProfile,
} from "@/lib/profile/patient-profile.functions";
import { getStoredTheme, setTheme, type ThemeMode } from "@/lib/patient/theme";

export const Route = createFileRoute("/_authenticated/my-plan/settings")({
  head: () => ({ meta: [{ title: "Minha conta — FitJourney" }] }),
  component: PatientSettings,
});

const inputCls =
  "w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-60";

function PatientSettings() {
  const fetchProfile = useServerFn(getMyPatientProfile);
  const updateProfile = useServerFn(updateMyPatientProfile);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-patient-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 10_000,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  function changeTheme(mode: ThemeMode) {
    setThemeState(mode);
    setTheme(mode);
  }

  useEffect(() => {
    if (data) {
      setFullName(data.fullName ?? "");
      setPhone(data.phone ?? "");
    }
  }, [data]);

  async function handleSave() {
    if (!fullName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        data: {
          fullName: fullName.trim(),
          phone: phone.trim(),
        },
      });
      toast.success("Conta atualizada");
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
          {saving ? "Salvando..." : "Salvar"}
        </button>
      }
    >
      <div className="space-y-8 max-w-2xl">
        <div className="space-y-1 border-b border-border pb-4">
          <Link
            to="/my-plan"
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="size-3" /> Voltar ao plano
          </Link>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Minha conta
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        </div>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-5">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            01 · Dados pessoais
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Nome completo
                </label>
                <input
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={saving}
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  WhatsApp
                </label>
                <input
                  className={inputCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving}
                  placeholder="+55 11 99999-9999"
                  inputMode="tel"
                  maxLength={32}
                />
                <p className="text-[10px] text-muted-foreground/70">
                  Usado pelo seu nutricionista para contato direto.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Email
                </label>
                <input
                  className={inputCls}
                  value={data?.email ?? ""}
                  disabled
                />
                <p className="text-[10px] text-muted-foreground/70">
                  Email não pode ser alterado por aqui.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            02 · Dados clínicos
          </h2>
          <p className="text-sm text-muted-foreground">
            Histórico clínico, condições, medicações e exames são versionados
            pela anamnese. Em breve você poderá atualizar diretamente daqui.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
