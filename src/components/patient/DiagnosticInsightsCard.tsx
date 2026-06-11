// Card colapsável do Diagnóstico Clínico no Dashboard do paciente.
// Renderer BURRO — apenas exibe o snapshot armazenado em patient_diagnoses.
// Sem recálculo, sem fetch de triggers, sem motor.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, ChevronDown, Lightbulb } from "lucide-react";
import { getMyDiagnosis } from "@/lib/diagnostic/patient-diagnosis.functions";
import type { DicaDetalhada } from "@/lib/diagnostic/engine";

function DicaRow({ item }: { item: DicaDetalhada }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-amber-200/40 bg-amber-50/40 dark:border-amber-400/20 dark:bg-amber-400/5 overflow-hidden">
      <div className="p-3 flex items-start gap-2">
        <Lightbulb className="size-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-foreground/90 leading-snug flex-1">{item.frase}</p>
      </div>
      {item.dica && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full text-left px-3 pb-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
          >
            <ChevronDown
              className={"size-3 transition-transform " + (open ? "rotate-180" : "")}
            />
            {open ? "Ocultar dica" : "Ver dica personalizada"}
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="px-3 pb-3 text-xs leading-relaxed text-foreground/80 border-t border-amber-200/40 dark:border-amber-400/20 pt-2">
                  💡 {item.dica}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </li>
  );
}

export function DiagnosticInsightsCard() {
  const fetchFn = useServerFn(getMyDiagnosis);
  const { data, isLoading } = useQuery({
    queryKey: ["patient", "diagnosis"],
    queryFn: () => fetchFn(),
    staleTime: 5 * 60_000,
  });
  const [expanded, setExpanded] = useState(true);

  if (isLoading || !data) return null;
  const d = data.diagnosis;
  const dicas = Array.isArray(d.dicasDetalhadas) ? d.dicasDetalhadas : [];

  return (
    <section
      aria-label="Seu Diagnóstico Personalizado"
      className="rounded-xl border border-amber-300/50 bg-gradient-to-br from-amber-50 via-background to-background dark:from-amber-500/10 dark:via-background dark:to-background overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-amber-100/30 dark:hover:bg-amber-400/5 transition-colors"
      >
        <div className="size-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Seu Diagnóstico Personalizado
          </p>
          <p className="text-xs text-muted-foreground">
            {dicas.length > 0
              ? `${dicas.length} ${dicas.length === 1 ? "ponto identificado" : "pontos identificados"} · toque para ${expanded ? "recolher" : "expandir"}`
              : "Análise do seu perfil clínico"}
          </p>
        </div>
        <ChevronDown
          className={"size-4 text-muted-foreground transition-transform " + (expanded ? "rotate-180" : "")}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {d.analisePeso && (
                <p className="text-sm text-foreground/90 leading-relaxed border-l-2 border-amber-400 pl-3 italic">
                  {d.analisePeso}
                </p>
              )}
              {dicas.length > 0 && (
                <ul className="space-y-2">
                  {dicas.map((item) => (
                    <DicaRow key={item.slug} item={item} />
                  ))}
                </ul>
              )}
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 pt-1">
                Gerado a partir da sua anamnese aprovada
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
