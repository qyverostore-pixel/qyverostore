import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="bg-noise flex min-h-screen items-center justify-center px-6">
      <div className="glass-card max-w-lg rounded-[2rem] p-9 text-center sm:p-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">Lost in the collection</p>
        <h1 className="text-display mt-5 text-7xl font-light text-foreground sm:text-8xl">404</h1>
        <h2 className="text-display mt-4 text-2xl font-medium text-foreground">This page is not here.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            Back to home
          </Link>
          <Link to="/products" className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:border-teal hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">Browse products</Link>
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
      { title: "QYVERO — Own Your Style." },
      {
        name: "description",
        content:
          "QYVERO is a modern men's lifestyle brand built for quality, style and everyday essentials.",
      },
      { name: "author", content: "QYVERO" },
      { name: "theme-color", content: "#0D0D0D" },
      { property: "og:title", content: "QYVERO — Own Your Style." },
      {
        property: "og:description",
        content:
          "QYVERO is a modern men's lifestyle brand built for quality, style and everyday essentials.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "QYVERO — Own Your Style." },
      {
        name: "twitter:description",
        content: "QYVERO is a modern men's lifestyle brand built for quality, style and everyday essentials.",
      },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/ssOqc5b86yePsdrhmD9rbIJcCPl2/social-images/social-1783812691813-WhatsApp_Image_2026-07-11_at_21.26.09_(7).webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/ssOqc5b86yePsdrhmD9rbIJcCPl2/social-images/social-1783812691813-WhatsApp_Image_2026-07-11_at_21.26.09_(7).webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
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
    <html lang="en">
      <head>
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
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideChrome = pathname.startsWith("/auth") || pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PostLoginRedirect />
        {!hideChrome && <Navbar />}
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <PageTransition><Outlet /></PageTransition>
        {!hideChrome && <Footer />}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function PostLoginRedirect() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile?.role === "admin" && pathname === "/") {
      navigate({ to: "/admin", replace: true });
    }
  }, [loading, navigate, pathname, profile?.role, user]);

  return null;
}
