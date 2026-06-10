import { useEffect, useState, type CSSProperties } from "react";
import logoWebm from "@/assets/fitjourney-logo.webm.asset.json";
import logoMp4 from "@/assets/fitjourney-logo.mp4.asset.json";
import logoStaticPng from "@/assets/fitjourney-logo-static.png.asset.json";

interface LogoVideoProps {
  className?: string;
  style?: CSSProperties;
}

export function LogoVideo({ className = "size-10 object-contain", style }: LogoVideoProps) {
  // Em mobile (qualquer toque/coarse pointer) usamos PNG estático para evitar
  // o quadrado branco que aparece em Android/MIUI (Xiaomi) ao renderizar webm transparente.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  if (isMobile) {
    return (
      <img
        src={logoStaticPng.url}
        alt="FitJourney"
        className={className}
        style={{ background: "transparent", ...style }}
        decoding="async"
        draggable={false}
      />
    );
  }

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
