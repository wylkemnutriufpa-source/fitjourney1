import logoStaticPng from "@/assets/fitjourney-logo-static.png.asset.json";

interface LogoMarkProps {
  className?: string;
}

/**
 * LOGO oficial FitJourney — PNG transparente estático em alta resolução.
 * Mantém a nitidez sem o frame claro/caixa branca do WebP animado.
 */
export function LogoMark({ className = "size-10 object-contain" }: LogoMarkProps) {
  return (
    <img
      src={logoStaticPng.url}
      alt="FitJourney"
      className={className}
      style={{ background: "transparent" }}
      decoding="async"
      draggable={false}
    />
  );
}
