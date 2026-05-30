// Real patient picker — lê de public.patients via server fn (RLS).
// Sem mock-data. Sem fallback. Sem invenção.

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, X, User, Loader2 } from "lucide-react";
import { listMyPatientsForPlan, type PatientLite } from "@/lib/plans/plans.functions";

export function RealPatientPicker({
  value,
  onChange,
  placeholder = "Buscar paciente por nome ou e-mail...",
}: {
  readonly value: PatientLite | null;
  readonly onChange: (p: PatientLite | null) => void;
  readonly placeholder?: string;
}) {
  const fetchPatients = useServerFn(listMyPatientsForPlan);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-patients-for-plan"],
    queryFn: () => fetchPatients(),
    staleTime: 30_000,
  });

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = useMemo(() => {
    const all = data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return all.slice(0, 8);
    return all
      .filter(
        (p) =>
          p.fullName.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term),
      )
      .slice(0, 8);
  }, [data, q]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 p-2.5 rounded border border-primary/40 bg-primary/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-full bg-background border border-border grid place-items-center text-[10px] font-mono shrink-0">
            <User className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{value.fullName}</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">
              {value.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-foreground shrink-0"
          title="Trocar paciente"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-md pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-primary"
      />
      {isLoading && (
        <Loader2 className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
      )}
      {open && !isLoading && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-popover border border-border rounded-md shadow-lg max-h-72 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs text-destructive">
              Erro ao carregar pacientes.
            </div>
          )}
          {!error && matches.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground text-center">
              {(data?.length ?? 0) === 0
                ? "Você ainda não tem pacientes cadastrados."
                : "Nenhum paciente encontrado."}
            </div>
          )}
          {matches.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p);
                setOpen(false);
                setQ("");
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent border-b border-border last:border-0"
            >
              <div className="size-7 rounded-full bg-background border border-border grid place-items-center shrink-0">
                <User className="size-3 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{p.fullName}</p>
                <p className="text-[10px] font-mono text-muted-foreground truncate">
                  {p.email}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
