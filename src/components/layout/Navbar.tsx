import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Instagram,
  Facebook,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/products", label: "Products" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const SOCIALS = [
  { href: "#", label: "Instagram", Icon: Instagram },
  { href: "#", label: "Facebook", Icon: Facebook },
  {
    href: "#",
    label: "TikTok",
    Icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.6 6.3a5.3 5.3 0 0 1-3.2-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.7a2.8 2.8 0 1 0 2 2.7V2h2.6a5.3 5.3 0 0 0 3.2 4.3v0Z" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "WhatsApp",
    Icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M20 3.9A11.2 11.2 0 0 0 3.6 18.4L2 22l3.7-1.6A11.2 11.2 0 1 0 20 3.9Zm-8 18.2a9.3 9.3 0 0 1-4.7-1.3l-.3-.2-2.2 1 1-2.1-.2-.3a9.3 9.3 0 1 1 6.4 2.9Zm5.3-6.9c-.3-.1-1.7-.9-2-1s-.4-.1-.6.2-.7.9-.8 1.1-.3.1-.5 0a7.6 7.6 0 0 1-2.2-1.4 8.4 8.4 0 0 1-1.6-2c-.2-.3 0-.4.1-.6l.4-.5.2-.4a.5.5 0 0 0 0-.5c0-.2-.6-1.5-.8-2s-.5-.5-.6-.5h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1.1 2.7s1.9 3 4.7 4.1a5.6 5.6 0 0 0 1.6.5 3.8 3.8 0 0 0 1.7-.1 2.9 2.9 0 0 0 1.9-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z" />
      </svg>
    ),
  },
];

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "text-foreground" }}
      inactiveProps={{ className: "text-foreground/70" }}
      activeOptions={{ exact: to === "/" }}
      className="group relative text-sm font-medium tracking-wide transition-colors hover:text-foreground"
    >
      {label}
      <span className="pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-teal transition-transform duration-300 ease-out group-hover:origin-left group-hover:scale-x-100 group-data-[status=active]:origin-left group-data-[status=active]:scale-x-100" />
    </Link>
  );
}

function IconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "border-b border-white/10 bg-background/60 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-6 sm:h-20">
          {/* Left: Logo */}
          <div className="flex min-w-0 items-center">
            <BrandMark size="sm" />
          </div>

          {/* Center: Nav */}
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} />
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden items-center sm:flex">
              <IconButton label="Search">
                <Search className="h-[18px] w-[18px]" />
              </IconButton>
              <IconButton label="Wishlist">
                <Heart className="h-[18px] w-[18px]" />
              </IconButton>
              <IconButton label="Cart">
                <ShoppingBag className="h-[18px] w-[18px]" />
              </IconButton>
            </div>

            <div className="ml-1 hidden items-center gap-2 lg:flex">
              <Link
                to="/auth/signin"
                className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90"
              >
                Create Account
              </Link>
            </div>

            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-foreground/90 transition hover:bg-white/5 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer to preserve layout under fixed navbar */}
      <div aria-hidden className="h-16 sm:h-20" />

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-background/95 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <BrandMark size="sm" />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-4 pt-6">
            {NAV_LINKS.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-foreground bg-white/5" }}
                inactiveProps={{ className: "text-foreground/80" }}
                className="rounded-2xl px-4 py-4 text-text-display text-lg font-medium tracking-wide transition-colors hover:bg-white/5"
                style={{
                  animation: open
                    ? `qy-fade-up 0.5s ${0.05 * i + 0.1}s both cubic-bezier(0.22,1,0.36,1)`
                    : undefined,
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="grid grid-cols-2 gap-3 px-6 pb-6 pt-4">
            <Link
              to="/auth/signin"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/15 px-4 py-3 text-center text-sm font-medium text-foreground transition hover:border-white/30"
            >
              Sign In
            </Link>
            <Link
              to="/auth/signup"
              onClick={() => setOpen(false)}
              className="rounded-full bg-foreground px-4 py-3 text-center text-sm font-semibold text-background transition hover:bg-foreground/90"
            >
              Create Account
            </Link>
          </div>

          <div className="border-t border-white/10 px-6 py-6">
            <p className="text-[10px] uppercase tracking-[0.4em] text-teal">
              Follow QYVERO
            </p>
            <div className="mt-4 flex items-center gap-2">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-foreground/80 transition hover:border-white/30 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default Navbar;
