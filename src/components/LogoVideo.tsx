import type { CSSProperties } from "react";
import logoWebm from "@/assets/fitjourney-logo.webm.asset.json";
import logoMp4 from "@/assets/fitjourney-logo.mp4.asset.json";

interface LogoVideoProps {
  className?: string;
  style?: CSSProperties;
}

export function LogoVideo({ className = "size-10 object-contain", style }: LogoVideoProps) {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className={`fj-logo-video-media bg-transparent ${className}`}
      style={{ background: "transparent", ...style }}
      aria-label="FitJourney"
    >
      <source src={logoWebm.url} type="video/webm" />
      <source src={logoMp4.url} type="video/mp4" />
    </video>
  );
}
