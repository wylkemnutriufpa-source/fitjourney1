import { useEffect, useState, type CSSProperties } from "react";
import logoWebm from "@/assets/fitjourney-logo.webm.asset.json";
import logoMp4 from "@/assets/fitjourney-logo.mp4.asset.json";
import logoStaticPng from "@/assets/fitjourney-logo-static.png.asset.json";

interface LogoVideoProps {
  className?: string;
  style?: CSSProperties;
}

export function LogoVideo({ className = "size-10 object-contain", style }: LogoVideoProps) {
  // Apenas Xiaomi/MIUI (Redmi/POCO) renderiza PNG estático — o webm transparente
  // pinta um quadrado branco nesses devices. Demais Android/iOS mantêm o vídeo.
  const [isXiaomi, setIsXiaomi] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    setIsXiaomi(/MIUI|XiaoMi|Xiaomi|Redmi|POCO|HMSCore.*Mi /i.test(ua));
  }, []);

  if (isXiaomi) {
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
