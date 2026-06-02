import { LogoMark } from "@/components/LogoMark";

export type LogoEffect = "orbit" | "dust" | "comet" | "ripple" | "energy" | "aura" | "sparkle";

interface LogoOrbitalProps {
  size?: string;
  className?: string;
  effect?: LogoEffect;
}

/**
 * Logo FitJourney com efeito animado ao redor.
 * Variantes: orbit (default), dust, comet, ripple, energy.
 */
export function LogoOrbital({
  size = "size-16",
  className = "",
  effect = "sparkle",
}: LogoOrbitalProps) {
  return (
    <span
      className={`fj-logo-aura relative inline-flex items-center justify-center shrink-0 ${size} ${className}`}
    >
      <span className="fj-logo-pulse" aria-hidden />

      {effect === "orbit" && (
        <>
          <span className="fj-logo-orbit fj-logo-orbit-1" aria-hidden>
            <span className="fj-logo-particle" />
          </span>
          <span className="fj-logo-orbit fj-logo-orbit-2" aria-hidden>
            <span className="fj-logo-particle fj-logo-particle-gold" />
          </span>
          <span className="fj-logo-orbit fj-logo-orbit-3" aria-hidden>
            <span className="fj-logo-particle" />
          </span>
          <span className="fj-logo-orbit fj-logo-orbit-4" aria-hidden>
            <span className="fj-logo-particle fj-logo-particle-gold" />
          </span>
        </>
      )}

      {effect === "dust" && (
        <span className="fj-dust" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} />
          ))}
        </span>
      )}

      {effect === "comet" && (
        <>
          <span className="fj-comet" aria-hidden />
          <span className="fj-comet fj-comet-2" aria-hidden />
        </>
      )}

      {effect === "ripple" && (
        <span className="fj-ripple" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      )}

      {effect === "energy" && (
        <span className="fj-energy" aria-hidden>
          <svg viewBox="-60 -60 120 120">
            <circle cx="0" cy="0" r="45" />
            <circle cx="0" cy="0" r="38" />
            <circle cx="0" cy="0" r="52" />
          </svg>
        </span>
      )}

      {effect === "aura" && (
        <span className="fj-aura" aria-hidden>
          <span className="fj-aura-blob fj-aura-blob-1" />
          <span className="fj-aura-blob fj-aura-blob-2" />
        </span>
      )}

      <LogoMark className={`relative z-10 ${size} object-contain`} />
    </span>
  );
}
