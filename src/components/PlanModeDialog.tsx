// Modal de escolha: Plano Diário x Plano Semanal.
// Único ponto de entrada para criação de plano/template novo.
// Ambos os modos publicam no mesmo `plans.snapshot` — paciente vê uma única coisa.

import { CalendarDays, CalendarRange } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type PlanMode = "daily" | "weekly";

type Props = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onChoose: (mode: PlanMode) => void;
};

export function PlanModeDialog({ open, onOpenChange, onChoose }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Como você quer montar o plano?</DialogTitle>
          <DialogDescription>
            Escolha a estrutura. Você ainda edita tudo depois — o paciente vê uma
            única tela do plano dele, independente do modo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          <button
            type="button"
            onClick={() => onChoose("daily")}
            className="text-left rounded-lg border border-border bg-surface hover:border-primary hover:bg-primary/5 transition p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <span className="font-semibold">Plano Diário</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Um dia com refeição principal e até 4 substituições por refeição.
              Ideal para rotina fixa.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onChoose("weekly")}
            className="text-left rounded-lg border border-border bg-surface hover:border-primary hover:bg-primary/5 transition p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <CalendarRange className="size-4 text-primary" />
              <span className="font-semibold">Plano Semanal</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              7 dias com refeições rotacionadas: as opções do dia 1 viram a
              refeição principal nos dias 2, 3, 4… O sistema plota as
              equivalentes em cada dia.
            </p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
