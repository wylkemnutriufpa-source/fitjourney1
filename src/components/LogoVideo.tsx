import logoWebm from "@/assets/fitjourney-logo.webm.asset.json";
import logoMp4 from "@/assets/fitjourney-logo.mp4.asset.json";

interface LogoVideoProps {
  className?: string;
}

/**
 * Logo animada (boomerang) — usada nas áreas internas (auth e sidebar do app).
 * Landing page continua usando LogoMark estático.
 */
export function LogoVideo({ className = "size-10 object-contain" }: LogoVideoProps) {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className={className}
      style={{ background: "transparent" }}
      aria-label="FitJourney"
    >
      <source src={logoWebm.url} type="video/webm" />
      <source src={logoMp4.url} type="video/mp4" />
    </video>
  );
}
