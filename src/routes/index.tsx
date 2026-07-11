import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Package, Truck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="bg-noise min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:py-8">
        <BrandMark size="md" />
        <nav className="flex items-center gap-3">
          <Link
            to="/auth/signin"
            className="hidden rounded-full px-4 py-2 text-sm text-foreground/80 transition hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/auth/signup"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            Create account <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-24 pt-16 text-center">
        <p className="text-[11px] uppercase tracking-[0.5em] text-teal">
          A new standard
        </p>
        <h1 className="mt-6 text-display text-5xl font-light leading-[1.05] text-foreground sm:text-6xl md:text-7xl">
          Own your style.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          More than a store — a modern men's lifestyle brand built for quality,
          style and everyday essentials.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth/signup"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-background transition hover:bg-foreground/90"
          >
            Get started
          </Link>
          <Link
            to="/auth/signin"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-foreground transition hover:border-white/30"
          >
            I already have an account
          </Link>
        </div>

        <div className="mt-20 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Premium quality", d: "Built to last." },
            { icon: Package, t: "Modern design", d: "Made for you." },
            { icon: Truck, t: "Fast delivery", d: "Nationwide shipping." },
          ].map((f) => (
            <div
              key={f.t}
              className="glass-card rounded-2xl p-6 text-left"
            >
              <f.icon className="h-5 w-5 text-teal" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                {f.t}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
