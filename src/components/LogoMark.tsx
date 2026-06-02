import logoStaticPng from "@/assets/fitjourney-logo-static.png.asset.json";
import type { CSSProperties } from "react";

interface LogoMarkProps {
  className?: string;
  style?: CSSProperties;
  src?: string | null;
}

export function LogoMark({ className = "size-10 object-contain", style, src }: LogoMarkProps) {
  return (
    <img
      src={src || logoStaticPng.url}
      alt="FitJourney"
      className={className}
      style={{ background: "transparent", ...style }}
      decoding="async"
      draggable={false}
    />
  );
}
