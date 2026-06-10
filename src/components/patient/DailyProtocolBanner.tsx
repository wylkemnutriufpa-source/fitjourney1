// Modal diário do paciente — abre no 1º acesso do dia e mostra TODOS os
// protocolos ativados pelo nutricionista, em lista, com detalhes acionáveis
// (fase atual, semana, recomendações, link para detalhes do protocolo e
// para o plano alimentar). Persiste "já vi hoje" por protocolo no banco.

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  Clock,
  Droplets,
  Moon,
  Leaf,
  ArrowRight,
  Utensils,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  listMyActiveProtocols,
  markBannerShownToday,
  type ActiveProtocolRow,
} from "@/lib/protocols/active.functions";
import { getMyPatientProfile } from "@/lib/profile/patient-profile.functions";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstName(full?: string | null): string {
  if (!full) return "";
  return full.trim().split(/\s+/)[0] ?? "";
}

function currentWeek(row: ActiveProtocolRow): number {
  const started = new Date(row.started_at).getTime();
  const week = Math.floor((Date.now() - started) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(week, row.phase_snapshot.durationWeeks));
}

export function DailyProtocolBanner() {
  const fetchActive = useServerFn(listMyActiveProtocols);
  const fetchProfile = useServerFn(getMyPatientProfile);
  const mark = useServerFn(markBannerShownToday);

  const [open, setOpen] = useState(false);
  const [dismissedToday, setDismissedToday] = useState(false);

  const { data } = useQuery({
    queryKey: ["patient", "active-protocols", "banner"],
    queryFn: () => fetchActive(),
    staleTime: 5 * 60_000,
  });

  const { data: profile } = useQuery({
    queryKey: ["patient", "profile", "greeting"],
    queryFn: () => fetchProfile(),
    staleTime: 10 * 60_000,
  });

  const markMutation = useMutation({
    mutationFn: (activeProtocolId: string) =>
      mark({ data: { activeProtocolId } }),
  });

  const protocols = data?.protocols ?? [];

  // Algum protocolo ainda não teve banner exibido hoje?
  const pendingIds = useMemo(
    () =>
      protocols
        .filter((p) => p.last_banner_shown_date !== today())
        .map((p) => p.id),
    [protocols],
  );

  useEffect(() => {
    if (!dismissedToday && pendingIds.length > 0 && !open) {
      setOpen(true);
    }
  }, [pendingIds.length, open, dismissedToday]);

  if (protocols.length === 0) return null;

  const name = firstName(profile?.fullName);
  const count = protocols.length;

  const handleClose = () => {
    setOpen(false);
    setDismissedToday(true);
    // Marca todos os pendentes como exibidos hoje.
    pendingIds.forEach((id) => markMutation.mutate(id));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="max-w-lg border-[var(--gold)]/40 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--gold)] uppercase tracking-wide">
            <Sparkles className="size-4 animate-pulse" />
            Olá{name ? `, ${name}` : ""}!
          </DialogTitle>
          <DialogDescription>
            Seu nutricionista ativou{" "}
            <strong className="text-foreground">
              {count} {count === 1 ? "protocolo" : "protocolos"}
            </strong>{" "}
            para você. Toque em cada um para ver as dicas, fase atual e o
            plano alimentar.
          </DialogDescription>
        </DialogHeader>

        <Accordion type="single" collapsible className="w-full">
          {protocols.map((p, idx) => {
            const phase = p.phase_snapshot;
            const week = currentWeek(p);
            return (
              <AccordionItem
                key={p.id}
                value={p.id}
                className="border-[var(--gold)]/15"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex flex-col items-start text-left gap-0.5">
                    <span className="text-sm font-semibold">
                      {p.protocol_name}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {p.module_name} · {phase.name} · Semana {week}/
                      {phase.durationWeeks}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-1">
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground border-y border-[var(--gold)]/15 py-2">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3 text-[var(--gold)]/70" />
                      Sem. {week}/{phase.durationWeeks}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Droplets className="size-3 text-[var(--gold)]/70" />
                      {(phase.recommendations.waterMl / 1000).toFixed(1)}L
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Moon className="size-3 text-[var(--gold)]/70" />
                      {phase.recommendations.sleepHours}h
                    </span>
                  </div>

                  {phase.recommendations.strategies.length > 0 && (
                    <ul className="space-y-1 text-sm">
                      {phase.recommendations.strategies.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--gold)] mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {phase.recommendations.teaRoutine.length > 0 && (
                    <ul className="space-y-1 text-sm">
                      {phase.recommendations.teaRoutine.map((t, i) => (
                        <li
                          key={`tea-${i}`}
                          className="flex items-start gap-2"
                        >
                          <Leaf className="size-3.5 text-[var(--gold)] shrink-0 mt-1" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <Link to="/meu-plano/protocolos" onClick={handleClose}>
                        Ver dicas completas{" "}
                        <ArrowRight className="size-3 ml-1" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <Link to="/meu-plano" onClick={handleClose}>
                        <Utensils className="size-3 mr-1" />
                        Plano alimentar
                      </Link>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Entendi, vamos lá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
