// Autocomplete simples sobre a base de pacientes (mock-data por enquanto).
// Sem cmdk, sem Popover — só input + lista. Determinístico.

import { useMemo, useState, useRef, useEffect } from "react";
import { Search, X, User } from "lucide-react";
import { patients as ALL_PATIENTS, type Patient } from "@/lib/mock-data";

export function PatientPicker({
  value,
  onChange,
  placeholder = "Buscar paciente por nome ou esporte...",
}: {
  readonly value: Patient | null;
  readonly onChange: (p: Patient | null) => void;
  readonly placeholder?: string;
}) {
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
    const term = q.trim().toLowerCase();
    if (!term) return ALL_PATIENTS.slice(0, 8);
    return ALL_PATIENTS.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sport.toLowerCase().includes(term) ||
        p.goal.toLowerCase().includes(term),
    ).slice(0, 8);
  }, [q]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 p-2.5 rounded border border-primary/40 bg-primary/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-full bg-background border border-border grid place-items-center text-[10px] font-mono shrink-0">
            {value.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{value.name}</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">
              {value.age}a · {value.sex} · {value.weightKg}kg · {value.goal}
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
        className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-popover border border-border rounded-md shadow-lg max-h-72 overflow-y-auto">
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
              <div className="size-7 rounded-full bg-background border border-border grid place-items-center text-[9px] font-mono shrink-0">
                {p.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{p.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground truncate">
                  {p.sport} · {p.goal} · {p.weightKg}kg · {p.tdee}kcal
                </p>
              </div>
              <User className="size-3 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
      {open && matches.length === 0 && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-popover border border-border rounded-md p-3 text-xs text-muted-foreground text-center">
          Nenhum paciente encontrado.
        </div>
      )}
    </div>
  );
}
