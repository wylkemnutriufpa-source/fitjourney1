import logoVideo from "@/assets/fitjourney-logo.mp4.asset.json";

interface LogoMarkProps {
  className?: string;
}

/**
 * LOGO oficial FitJourney — vídeo em loop, fundo já transparente no arquivo.
 * Sem mix-blend, sem caixa: renderiza o vídeo cru.
 */
export function LogoMark({ className = "size-8 object-contain" }: LogoMarkProps) {
  return (
    <video
      src={logoVideo.url}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-label="FitJourney"
      className={className}
    />
  );
}

