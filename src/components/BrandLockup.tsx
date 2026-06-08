import type { CSSProperties, ReactNode } from "react";
import { LogoOrbital } from "@/components/LogoOrbital";
import { useLogoSettings, type LogoSlot } from "@/lib/logo-settings";

interface BrandLockupProps {
  slot: LogoSlot;
  /** Texto do wordmark. Pode ser substituído por um nó (ex.: Link). */
  wordmarkText?: string;
  wordmarkAs?: ReactNode;
  wordmarkClassName?: string;
  className?: string;
  /** Permite envolver a logo em um botão/link sem perder o lockup. */
  logoWrapper?: (logo: ReactNode) => ReactNode;
  onLogoClick?: () => void;
}

/**
 * Lockup oficial logo + wordmark "FitJourney". Lê posição/gap/tamanho/offset
 * do `useLogoSettings(slot)` — todo o sistema reflete o que o admin configurar
 * em /admin/logos.
 */
export function BrandLockup({
  slot,
  wordmarkText = "FitJourney",
  wordmarkAs,
  wordmarkClassName = "fj-wordmark leading-none",
  className = "",
  logoWrapper,
  onLogoClick,
}: BrandLockupProps) {
  const cfg = useLogoSettings(slot);
  const wm = cfg.wordmark;

  const logoNode = <LogoOrbital slot={slot} />;
  const wrappedLogo = logoWrapper
    ? logoWrapper(logoNode)
    : onLogoClick
    ? (
        <button type="button" onClick={onLogoClick} className="focus:outline-none cursor-pointer">
          {logoNode}
        </button>
      )
    : logoNode;

  if (!wm.show) {
    return <span className={`inline-flex items-center ${className}`}>{wrappedLogo}</span>;
  }

  const isVertical = wm.position === "above" || wm.position === "below";
  const flexDir =
    wm.position === "right"
      ? "flex-row"
      : wm.position === "left"
      ? "flex-row-reverse"
      : wm.position === "below"
      ? "flex-col"
      : "flex-col-reverse";

  const containerStyle: CSSProperties = {
    gap: `${wm.gap}px`,
  };

  const wordmarkStyle: CSSProperties = {
    fontSize: `${wm.sizePx}px`,
    transform: `translate(${wm.offsetX}px, ${wm.offsetY}px)`,
  };

  const alignment = isVertical ? "items-center" : "items-center";

  const wordmarkNode = wordmarkAs ? (
    <span className="inline-flex leading-none" style={wordmarkStyle}>
      {wordmarkAs}
    </span>
  ) : (
    <span className={wordmarkClassName} style={wordmarkStyle}>
      {wordmarkText}
    </span>
  );

  return (
    <span className={`inline-flex ${flexDir} ${alignment} ${className}`} style={containerStyle}>
      {wrappedLogo}
      {wordmarkNode}
    </span>
  );
}
