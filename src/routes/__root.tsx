import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { IntroOverlay } from "@/components/IntroOverlay";
import { CookieBanner } from "@/components/CookieBanner";

const fallbackQueryClient = new QueryClient();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FitJourney — Nutrição clínica e esportiva" },
      { name: "description", content: "Plataforma de nutrição clínica e esportiva. Anamnese, dieta cirúrgica e acompanhamento de pacientes." },
      { name: "author", content: "FitJourney" },
      { name: "application-name", content: "FitJourney" },
      { name: "apple-mobile-web-app-title", content: "FitJourney" },
      { property: "og:site_name", content: "FitJourney" },
      { property: "og:title", content: "FitJourney — Nutrição clínica e esportiva" },
      { property: "og:description", content: "Plataforma de nutrição clínica e esportiva. Anamnese, dieta cirúrgica e acompanhamento de pacientes." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fitjourney.com.br" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@fitjourney" },
      { name: "twitter:title", content: "FitJourney — Nutrição clínica e esportiva" },
      { name: "twitter:description", content: "Plataforma de nutrição clínica e esportiva. Anamnese, dieta cirúrgica e acompanhamento de pacientes." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/StdQ07rPbDMv4Qh75goHxDt3m4e2/social-images/social-1780433875841-WhatsApp_Image_2026-06-02_at_17.56.54.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/StdQ07rPbDMv4Qh75goHxDt3m4e2/social-images/social-1780433875841-WhatsApp_Image_2026-06-02_at_17.56.54.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" translate="no">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&display=swap"
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const routeContext = Route.useRouteContext();
  const queryClient = routeContext?.queryClient ?? fallbackQueryClient;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <IntroOverlay />
        <CookieBanner />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
