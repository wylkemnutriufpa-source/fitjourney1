// Banner diário do paciente — aparece 1x por dia (primeiro acesso) e avisa
// em que protocolo / fase / semana ele está, com as recomendações.
// Persiste o "já mostrei hoje" no banco (last_banner_shown_date).

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sparkles, Clock, Droplets, Moon, Leaf, ArrowRight } from "lucide-react";
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
  listMyActiveProtocols,
  markBannerShownToday,
  type ActiveProtocolRow,
} from "@/lib/protocols/active.functions";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentWeek(row: ActiveProtocolRow): number {
  const started = new Date(row.started_at).getTime();
  const week = Math.floor((Date.now() - started) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(week, row.phase_snapshot.durationWeeks));
}

export function DailyProtocolBanner() {
  const fetchActive = useServerFn(listMyActiveProtocols);
  const mark = useServerFn(markBannerShownToday);
  const [open, setOpen] = useState(false);
  const [acked, setAcked] = useState<Set<string>>(() => new Set());

  const { data } = useQuery({
    queryKey: ["patient", "active-protocols", "banner"],
    queryFn: () => fetchActive(),
    staleTime: 5 * 60_000,
  });

  const markMutation = useMutation({
    mutationFn: (activeProtocolId: string) =>
      mark({ data: { activeProtocolId } }),
  });

  // Pega o protocolo ativo cujo banner ainda não foi visto hoje.
  const pending: ActiveProtocolRow | null =
    data?.protocols.find(
      (p) => p.last_banner_shown_date !== today() && !acked.has(p.id),
    ) ?? null;

  useEffect(() => {
    if (pending && !open) setOpen(true);
  }, [pending, open]);

  if (!pending) return null;

  const phase = pending.phase_snapshot;
  const week = currentWeek(pending);

  const handleClose = () => {
    setOpen(false);
    setAcked((s) => {
      const next = new Set(s);
      next.add(pending.id);
      return next;
    });
    markMutation.mutate(pending.id);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="max-w-md border-[var(--gold)]/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--gold)] uppercase tracking-wide">
            <Sparkles className="size-4 animate-pulse" />
            Você está no {pending.protocol_name}
          </DialogTitle>
          <DialogDescription>
            {pending.module_name} · {phase.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3 text-[10px] font-mono text-muted-foreground border-y border-[var(--gold)]/15 py-3">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 text-[var(--gold)]/70" />
              Semana {week} / {phase.durationWeeks}
            </span>
            <span className="inline-flex items-center gap-1">
              <Droplets className="size-3 text-[var(--gold)]/70" />
              {(phase.recommendations.waterMl / 1000).toFixed(1)}L água
            </span>
            <span className="inline-flex items-center gap-1">
              <Moon className="size-3 text-[var(--gold)]/70" />
              {phase.recommendations.sleepHours}h sono
            </span>
          </div>

          <p className="text-sm">
            <strong>Esta semana, faça:</strong>
          </p>
          <ul className="space-y-1.5 text-sm">
            {phase.recommendations.strategies.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--gold)] mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
            {phase.recommendations.teaRoutine.map((t, i) => (
              <li key={`tea-${i}`} className="flex items-start gap-2">
                <Leaf className="size-3.5 text-[var(--gold)] shrink-0 mt-1" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" asChild>
            <Link to="/my-plan/protocolos" onClick={handleClose}>
              Ver detalhes <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button onClick={handleClose}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
