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
    <span className={`fj-logo-video-shell ${className}`} style={style} aria-label="FitJourney">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="fj-logo-video-media size-full object-contain"
        style={{ background: "transparent" }}
      >
        <source src={logoMp4.url} type="video/mp4" />
        <source src={logoWebm.url} type="video/webm" />
      </video>
      <LogoMark className="fj-logo-video-ios-fallback size-full object-contain" />
    </span>
  );
}
