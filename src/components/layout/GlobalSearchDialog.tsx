import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  User,
  LayoutDashboard,
  Users,
  ClipboardList,
  MessageSquareHeart,
  FileStack,
  DollarSign,
  Settings,
  ShieldCheck,
  X,
  Phone,
  Mail,
} from "lucide-react";
import { searchMyPatients, type PatientSearchHit } from "@/lib/search/global-search.functions";
import { maskPhoneBR } from "@/lib/phone-mask";

type Shortcut = {
  to: string;
  label: string;
  keywords: string;
  icon: typeof Search;
  adminOnly?: boolean;
};

const SHORTCUTS: Shortcut[] = [
  { to: "/dashboard", label: "Dashboard", keywords: "dashboard inicio home painel", icon: LayoutDashboard },
  { to: "/patients", label: "Pacientes", keywords: "pacientes lista clientes", icon: Users },
  { to: "/patients/new", label: "Novo paciente", keywords: "novo paciente cadastrar adicionar criar convite", icon: User },
  { to: "/anamneses", label: "Anamneses", keywords: "anamneses pendentes revisar aprovar", icon: ClipboardList },
  { to: "/feedbacks", label: "Feedbacks", keywords: "feedback retorno paciente avaliacao", icon: MessageSquareHeart },
  { to: "/templates", label: "Templates", keywords: "templates dietas modelos cardapio biblioteca", icon: FileStack },
  { to: "/financeiro", label: "Financeiro", keywords: "financeiro mrr arr receita assinaturas cobranca", icon: DollarSign },
  { to: "/settings", label: "Configurações", keywords: "configuracoes ajustes perfil conta", icon: Settings },
  { to: "/admin/profissionais", label: "Admin · Profissionais", keywords: "admin profissionais nutricionistas", icon: ShieldCheck, adminOnly: true },
  { to: "/admin/pacientes", label: "Admin · Pacientes", keywords: "admin pacientes", icon: ShieldCheck, adminOnly: true },
  { to: "/admin/leads", label: "Admin · Leads", keywords: "admin leads landing", icon: ShieldCheck, adminOnly: true },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  isAdmin,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isAdmin: boolean;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const fetchPatients = useServerFn(searchMyPatients);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQ("");
    }
  }, [open]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const trimmed = q.trim();
  const nq = normalize(trimmed);

  const patientQuery = useQuery({
    queryKey: ["global-search-patients", trimmed],
    queryFn: () => fetchPatients({ data: { q: trimmed } }),
    enabled: open && trimmed.length >= 2,
    staleTime: 15_000,
  });

  const shortcuts = useMemo(() => {
    const pool = SHORTCUTS.filter((s) => !s.adminOnly || isAdmin);
    if (!nq) return pool.slice(0, 6);
    return pool.filter(
      (s) => normalize(s.label).includes(nq) || normalize(s.keywords).includes(nq),
    );
  }, [nq, isAdmin]);

  function go(to: string) {
    onOpenChange(false);
    navigate({ to });
  }

  if (!open) return null;

  const patients: PatientSearchHit[] = patientQuery.data ?? [];
  const showPatients = trimmed.length >= 2;
  const isLoading = patientQuery.isFetching;
  const nothing =
    showPatients && !isLoading && patients.length === 0 && shortcuts.length === 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-background/60 backdrop-blur-sm p-4 pt-[10vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
        role="dialog"
        aria-label="Busca global"
      >
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar pacientes ou ir para..."
            className="flex-1 h-12 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {showPatients && (
            <Section title={`Pacientes${isLoading ? " · buscando…" : ""}`}>
              {patients.length === 0 && !isLoading && (
                <EmptyRow text="Nenhum paciente encontrado." />
              )}
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go(`/patients/${p.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-accent/50 transition-colors"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-mono shrink-0">
                    {(p.full_name || "?").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">
                      {p.full_name}
                      {!p.is_active && (
                        <span className="ml-2 text-[10px] font-mono uppercase text-muted-foreground border border-border rounded px-1 py-0.5">
                          inativo
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-muted-foreground truncate flex items-center gap-2">
                      {p.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3" />
                          {p.email}
                        </span>
                      )}
                      {p.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" />
                          {maskPhoneBR(p.phone)}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </Section>
          )}

          {shortcuts.length > 0 && (
            <Section title="Ir para">
              {shortcuts.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.to}
                    onClick={() => go(s.to)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <span className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground shrink-0">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm">{s.label}</span>
                    <span className="ml-auto text-[10px] font-mono uppercase text-muted-foreground">
                      {s.to}
                    </span>
                  </button>
                );
              })}
            </Section>
          )}

          {!showPatients && shortcuts.length === 0 && (
            <EmptyRow text="Digite ao menos 2 caracteres para buscar pacientes." />
          )}
          {nothing && <EmptyRow text="Nada encontrado." />}
        </div>

        <div className="border-t border-border px-3 py-2 text-[10px] font-mono uppercase text-muted-foreground flex items-center justify-between">
          <span>Busca global</span>
          <span>esc para fechar</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-2 py-1">
      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="px-4 py-6 text-center text-xs text-muted-foreground">{text}</div>
  );
}
