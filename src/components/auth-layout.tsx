import type { ReactNode } from "react";
import { BrandMark } from "./brand-mark";

export function AuthLayout({
  children,
  eyebrow,
  title,
  subtitle,
  side,
}: {
  children: ReactNode;
  eyebrow: string;
  title: ReactNode;
  subtitle: ReactNode;
  side: ReactNode;
}) {
  return (
    <div className="bg-noise min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* Left / decorative */}
        <aside className="relative hidden overflow-hidden border-r border-white/5 lg:block">
          <div className="absolute inset-0">{side}</div>
          <div className="relative z-10 flex h-full flex-col justify-between p-10">
            <BrandMark size="md" showTagline />
            <div className="max-w-md">
              <p className="text-[11px] uppercase tracking-[0.4em] text-teal">
                {eyebrow}
              </p>
              <h2 className="mt-4 text-display text-4xl font-light leading-tight text-white xl:text-5xl">
                {title}
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
                {subtitle}
              </p>
              <div className="mt-10 flex items-center gap-6 text-[11px] uppercase tracking-[0.28em] text-white/50">
                <span>Premium</span>
                <span className="h-px w-8 bg-white/20" />
                <span>Modern</span>
                <span className="h-px w-8 bg-white/20" />
                <span>Made for you</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right / form */}
        <main className="relative flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="absolute right-6 top-6 lg:hidden">
            <BrandMark size="sm" />
          </div>
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AuthSideVisual({ variant }: { variant: "signup" | "signin" }) {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 30% 20%, color-mix(in oklab, var(--color-teal) 35%, transparent), transparent 60%), radial-gradient(60% 50% at 80% 90%, color-mix(in oklab, var(--color-teal) 20%, transparent), transparent 65%), linear-gradient(180deg, #0b0b0d, #0d0d0d)",
        }}
      />
      {/* huge outlined Q */}
      <div className="absolute -right-24 top-1/2 -translate-y-1/2 select-none">
        <div className="relative">
          <div className="h-[560px] w-[560px] rounded-full border-[3px] border-white/8" />
          <span
            className="absolute bottom-16 right-24 block h-4 w-24 rotate-[-25deg] rounded-[2px] bg-teal/70"
            style={{ boxShadow: "0 0 60px color-mix(in oklab, var(--color-teal) 50%, transparent)" }}
          />
        </div>
      </div>
      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(70% 60% at 40% 50%, black, transparent)",
        }}
      />
      {variant === "signup" ? null : null}
    </div>
  );
}
