import logoVideo from "@/assets/fitjourney-logo.mp4.asset.json";

interface LogoMarkProps {
  className?: string;
}

/**
 * LOGO oficial FitJourney — vídeo em loop, sem fundo.
 * Substitui a imagem estática anterior (fitjourney-logo.png) em todos os lugares
 * onde a logo aparece ao lado do nome "FitJourney" (landing, app, auth).
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
      style={{ mixBlendMode: "screen" }}
    />
  );
}
