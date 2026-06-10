import { useEffect, useState, type CSSProperties } from "react";
import logoWebm from "@/assets/fitjourney-logo.webm.asset.json";
import logoMp4 from "@/assets/fitjourney-logo.mp4.asset.json";
import logoStaticPng from "@/assets/fitjourney-logo-static.png.asset.json";

interface LogoVideoProps {
  className?: string;
  style?: CSSProperties;
}

export function LogoVideo({ className = "size-10 object-contain", style }: LogoVideoProps) {
  // Xiaomi/MIUI (Redmi/POCO/HyperOS) pinta um quadrado branco no webm transparente.
  // Como o UA do Chrome no MIUI frequentemente omite "Xiaomi/MIUI" e expõe só
  // códigos de modelo (ex.: M2101K6G, 2201116SG), fazemos detecção por UA + model
  // code e também caímos para PNG estático se o vídeo falhar/estagnar.
  const [useStatic, setUseStatic] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    if (/MIUI|XiaoMi|Xiaomi|Redmi|POCO|HyperOS|HMSCore.*Mi |Mi \d|M2\d{3}|2\d{9,}[A-Z]{1,2}/i.test(ua)) {
      setUseStatic(true);
    }
  }, []);

  if (useStatic) {
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
      onError={() => setUseStatic(true)}
      onStalled={() => setUseStatic(true)}
    >
      <source src={logoWebm.url} type="video/webm" />
      <source src={logoMp4.url} type="video/mp4" />
    </video>
  );
}
