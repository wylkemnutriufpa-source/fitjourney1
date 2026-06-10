import type { CSSProperties } from "react";
import { LogoMark } from "@/components/LogoMark";
import { LogoVideo } from "@/components/LogoVideo";
import { useLogoSettings, type LogoSlot } from "@/lib/logo-settings";

export type LogoEffect = "none" | "orbit" | "dust" | "comet" | "ripple" | "energy" | "aura" | "sparkle" | "lines" | "halo";

interface LogoOrbitalProps {
  size?: string;
  sizePx?: number;
  className?: string;
  effect?: LogoEffect;
  slot?: LogoSlot;
}

/**
 * Logo FitJourney com efeito animado ao redor.
 * Quando `slot` é passado, lê tamanho/efeito/variant/customUrl/padding/margin das configurações do admin.
 */
export function LogoOrbital({
  size = "size-16",
  sizePx,
  className = "",
  effect = "halo",
  slot,
}: LogoOrbitalProps) {
  const settings = useLogoSettings(slot ?? "landing-header");
  const cfg = slot ? settings : null;
  const lockedLandingHeader = slot === "landing-header";
  const finalEffect: LogoEffect = lockedLandingHeader
    ? "none"
    : cfg?.variant === "static"
    ? ("none" as any)
    : cfg?.effect ?? effect;
  const finalSizePx = cfg?.sizePx ?? sizePx;
  const customUrl = cfg?.customUrl ?? null;
  const customIsVideo = !!customUrl && (/^data:video\//i.test(customUrl) || /\.(mp4|webm)(\?|$)/i.test(customUrl));
  const useVideo = cfg?.variant === "video" && !customUrl;


  const sizeStyle: CSSProperties | undefined = finalSizePx
    ? { width: finalSizePx, height: finalSizePx }
    : undefined;
  const sizeClass = finalSizePx ? "" : size;

  const wrapperStyle: CSSProperties = {
    ...(sizeStyle ?? {}),
    paddingLeft: lockedLandingHeader ? undefined : cfg?.paddingX || undefined,
    paddingRight: lockedLandingHeader ? undefined : cfg?.paddingX || undefined,
    paddingTop: lockedLandingHeader ? undefined : cfg?.paddingY || undefined,
    paddingBottom: lockedLandingHeader ? undefined : cfg?.paddingY || undefined,
    marginLeft: lockedLandingHeader ? undefined : cfg?.marginX || undefined,
    marginRight: lockedLandingHeader ? undefined : cfg?.marginX || undefined,
    marginTop: lockedLandingHeader ? undefined : cfg?.marginY || undefined,
    marginBottom: lockedLandingHeader ? undefined : cfg?.marginY || undefined,
    boxSizing: !lockedLandingHeader && (cfg?.paddingX || cfg?.paddingY) ? "content-box" : undefined,
  };

  // Logos customizadas (upload) não recebem a aura/pulse ambientes — só o efeito explícito.
  // Admin também pode forçar o desligamento da aura por slot via `showAura: false`.
  const auraDisabledBySlot = cfg ? cfg.showAura === false : false;
  const hideAmbient = lockedLandingHeader || !!customUrl || auraDisabledBySlot;

  return (
    <span
      className={`${hideAmbient ? "" : "fj-logo-aura"} relative inline-flex items-center justify-center shrink-0 ${sizeClass} ${className}`}
      style={wrapperStyle}
    >
      {!hideAmbient && <span className="fj-logo-pulse" aria-hidden />}


      {finalEffect === "orbit" && (
        <>
          <span className="fj-logo-orbit fj-logo-orbit-1" aria-hidden>
            <span className="fj-logo-particle" />
          </span>
          <span className="fj-logo-orbit fj-logo-orbit-2" aria-hidden>
            <span className="fj-logo-particle fj-logo-particle-gold" />
          </span>
          <span className="fj-logo-orbit fj-logo-orbit-3" aria-hidden>
            <span className="fj-logo-particle" />
          </span>
          <span className="fj-logo-orbit fj-logo-orbit-4" aria-hidden>
            <span className="fj-logo-particle fj-logo-particle-gold" />
          </span>
        </>
      )}

      {finalEffect === "dust" && (
        <span className="fj-dust" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} />
          ))}
        </span>
      )}

      {finalEffect === "comet" && (
        <>
          <span className="fj-comet" aria-hidden />
          <span className="fj-comet fj-comet-2" aria-hidden />
        </>
      )}

      {finalEffect === "ripple" && (
        <span className="fj-ripple" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      )}

      {finalEffect === "energy" && (
        <span className="fj-energy" aria-hidden>
          <svg viewBox="-60 -60 120 120">
            <circle cx="0" cy="0" r="45" />
            <circle cx="0" cy="0" r="38" />
            <circle cx="0" cy="0" r="52" />
          </svg>
        </span>
      )}

      {finalEffect === "aura" && (
        <span className="fj-aura" aria-hidden>
          <span className="fj-aura-blob fj-aura-blob-1" />
          <span className="fj-aura-blob fj-aura-blob-2" />
        </span>
      )}

      {finalEffect === "sparkle" && (
        <span className="fj-sparkle" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} />
          ))}
        </span>
      )}

      {finalEffect === "lines" && (
        <span className="fj-lines" aria-hidden>
          <svg viewBox="-60 -60 120 120">
            <path d="M -55 -10 C -40 -45, -10 -55, 20 -40 S 55 -5, 50 25" />
            <path d="M 55 10 C 40 45, 10 55, -20 40 S -55 5, -50 -25" />
            <path d="M -50 30 C -25 20, 25 -20, 50 -30" />
            <path d="M 50 35 C 20 25, -20 -25, -50 -35" />
          </svg>
        </span>
      )}

      {finalEffect === "halo" && (
        <span className="fj-halo" aria-hidden>
          <span className="fj-halo-ring fj-halo-ring-1" />
          <span className="fj-halo-ring fj-halo-ring-2" />
        </span>
      )}

      {lockedLandingHeader ? (
        <LogoVideo className="relative z-10 object-contain" style={sizeStyle} />
      ) : customIsVideo ? (
        <span className={`fj-logo-video-shell relative z-10 object-contain ${sizeClass}`} style={sizeStyle} aria-label="Logo">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            src={customUrl!}
            className="fj-logo-video-media size-full object-contain"
            style={{ background: "transparent" }}
          />
          <LogoMark className="fj-logo-video-ios-fallback size-full object-contain" />
        </span>
      ) : useVideo ? (
        <LogoVideo className={`relative z-10 object-contain ${sizeClass}`} style={sizeStyle} />
      ) : (
        <LogoMark className={`relative z-10 object-contain ${sizeClass}`} style={sizeStyle} src={customUrl} />
      )}

    </span>
  );
}
