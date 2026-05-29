import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Save } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — FitJourney" }] }),
  component: Settings,
});

const inputCls =
  "w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary";

function Settings() {
  const [notify, setNotify] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [weekly, setWeekly] = useState(false);

  return (
    <AppShell
      header={
        <button className="bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 flex items-center gap-2 rounded-md hover:bg-primary/90">
          <Save className="size-3.5" />
          Salvar Configurações
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Nome completo
              </label>
              <input className={inputCls} defaultValue="Dr. Marco Silva" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Registro CRN
              </label>
              <input className={inputCls} defaultValue="CRN-3 12345" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Especialidade
              </label>
              <input className={inputCls} defaultValue="Nutrição Esportiva" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Telefone
              </label>
              <input className={inputCls} defaultValue="(11) 99999-0000" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input className={inputCls} type="email" defaultValue="marco@fitjourney.app" />
            </div>
          </div>
        </section>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            02 · Notificações
          </h2>
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

        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">
            03 · Sessão
          </h2>
          <div className="flex justify-between items-center p-4 border border-border rounded-md bg-background">
            <div>
              <p className="text-sm font-medium">Encerrar todas as sessões</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Desconecta este usuário de todos os dispositivos
              </p>
            </div>
            <button className="text-xs font-mono uppercase tracking-widest text-destructive hover:text-destructive/80 border border-destructive/40 rounded-md px-3 py-2">
              Encerrar
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
