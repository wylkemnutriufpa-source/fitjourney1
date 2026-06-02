import loaderVideo from "@/assets/loader.mp4.asset.json";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<Size, string> = {
  sm: "w-16 h-16",
  md: "w-24 h-24 sm:w-28 sm:h-28",
  lg: "w-36 h-36 sm:w-44 sm:h-44",
  xl: "w-48 h-48 sm:w-64 sm:h-64",
};

interface VideoLoaderProps {
  size?: Size;
  label?: string;
  className?: string;
}

/**
 * Loader oficial FitJourney — substitui spinners de "tela carregando".
 * Usa o vídeo da intro em loop, adaptável a mobile.
 */
export function VideoLoader({ size = "md", label, className = "" }: VideoLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`${SIZE_MAP[size]} relative overflow-hidden rounded-full`}>
        <video
          src={loaderVideo.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      {label && (
        <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-wide text-center px-4">
          {label}
        </p>
      )}
    </div>
  );
}

/**
 * Variante fullscreen para gates de acesso / splash de rota.
 */
export function VideoLoaderFullscreen({ label }: { label?: string }) {
  return (
    <div className="min-h-screen w-full bg-background grid place-items-center px-6">
      <VideoLoader size="xl" label={label} />
    </div>
  );
}
