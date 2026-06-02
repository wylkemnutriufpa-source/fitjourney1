import logoWebp from "@/assets/fitjourney-logo.webp.asset.json";

interface LogoMarkProps {
  className?: string;
}

/**
 * LOGO oficial FitJourney — animated WebP transparente.
 * Substitui o vídeo VP9-alpha (que iOS Safari renderiza como caixa branca).
 * Animated WebP é suportado nativamente em iOS 14+, Android Chrome, Firefox e Edge.
 */
export function LogoMark({ className = "size-10 object-contain" }: LogoMarkProps) {
  return (
    <img
      src={logoWebp.url}
      alt="FitJourney"
      className={className}
      style={{ background: "transparent" }}
      draggable={false}
    />
  );
}
