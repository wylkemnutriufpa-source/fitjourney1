import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoOrbital, type LogoEffect } from "@/components/LogoOrbital";

export const Route = createFileRoute("/logo-test")({
  component: LogoTestPage,
});

const variants: { id: LogoEffect; label: string; desc: string }[] = [
  { id: "orbit", label: "1 · Orbital (atual)", desc: "Bolinhas em órbita" },
  { id: "dust", label: "2 · Floating Dust", desc: "Partículas microscópicas flutuando" },
  { id: "comet", label: "3 · Comet Tail", desc: "Cometa com rastro luminoso" },
  { id: "ripple", label: "4 · Ripple", desc: "Anéis concêntricos expandindo" },
  { id: "energy", label: "8 · Energy Lines", desc: "Linhas curvas desenhando/sumindo" },
];

function LogoTestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">
              Logo — Comparador de Efeitos
            </h1>
            <p className="text-muted-foreground">
              Compare as variantes lado a lado. Me diga qual prefere.
            </p>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline">
            ← voltar
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {variants.map((v) => (
            <div
              key={v.id}
              className="glass rounded-xl p-8 flex flex-col items-center gap-5"
            >
              <div className="flex items-center justify-center h-56 w-56">
                <LogoOrbital effect={v.id} size="size-44" />
              </div>
              <div className="text-center">
                <div className="font-semibold">{v.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{v.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 glass rounded-xl p-8">
          <h2 className="font-display text-xl mb-6">Em escala real (header / auth)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 items-center justify-items-center">
            {variants.map((v) => (
              <div key={v.id} className="flex flex-col items-center gap-3">
                <LogoOrbital effect={v.id} size="size-24" />
                <span className="text-xs text-muted-foreground">{v.label.split(" · ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
