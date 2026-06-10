import type { CSSProperties } from "react";
import { LogoMark } from "@/components/LogoMark";
import logoWebm from "@/assets/fitjourney-logo.webm.asset.json";
import logoMp4 from "@/assets/fitjourney-logo.mp4.asset.json";

interface LogoVideoProps {
  className?: string;
  style?: CSSProperties;
}

export function LogoVideo({ className = "size-10 object-contain", style }: LogoVideoProps) {
  return (
    <span className={`fj-logo-video-shell relative ${className}`} style={style} aria-label="FitJourney">
      {/* Poster estático: aparece imediatamente; o vídeo entra por cima quando estiver pronto */}
      <LogoMark className="absolute inset-0 size-full object-contain" />
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="fj-logo-video-media relative size-full object-contain"
        style={{ background: "transparent" }}
      >
        <source src={logoWebm.url} type="video/webm" />
        <source src={logoMp4.url} type="video/mp4" />
      </video>
    </span>
  );
}
