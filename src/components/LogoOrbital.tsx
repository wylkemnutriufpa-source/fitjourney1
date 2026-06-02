import { LogoMark } from "@/components/LogoMark";

interface LogoOrbitalProps {
  /** Tailwind size class para o container, ex: "size-16" */
  size?: string;
  className?: string;
}

/**
 * Logo FitJourney com efeito orbital (pulse + partículas).
 * Wrapper reutilizável: usa o vídeo transparente da LogoMark + as órbitas
 * definidas em src/styles.css (.fj-logo-aura / .fj-logo-orbit-*).
 */
export function LogoOrbital({ size = "size-16", className = "" }: LogoOrbitalProps) {
  return (
    <span
      className={`fj-logo-aura relative inline-flex items-center justify-center shrink-0 ${size} ${className}`}
    >
      <span className="fj-logo-pulse" aria-hidden />
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
      <LogoMark className={`relative z-10 ${size} object-contain`} />
    </span>
  );
}
