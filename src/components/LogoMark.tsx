import logoWebm from "@/assets/fitjourney-logo.webm.asset.json";
import logoMp4 from "@/assets/fitjourney-logo.mp4.asset.json";

interface LogoMarkProps {
  className?: string;
}

/**
 * LOGO oficial FitJourney — vídeo em loop com fundo realmente transparente.
 * Fonte: MP4 H.264 (sem alpha) re-codificado para WebM VP9 (yuva420p) via
 * chromakey do branco. Sem mix-blend e sem caixa de fundo: o <video> usa
 * transparent letterboxing nativo.
 */
export function LogoMark({ className = "size-10 object-contain" }: LogoMarkProps) {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-label="FitJourney"
      className={className}
      style={{ background: "transparent" }}
    >
      <source src={logoWebm.url} type="video/webm" />
      <source src={logoMp4.url} type="video/mp4" />
    </video>
  );
}
