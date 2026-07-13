import { Link } from "@tanstack/react-router";
import {
  Instagram,
  Facebook,
  Mail,
  MessageCircle,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/products", label: "Categories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/auth/signin", label: "Sign In" },
] as const;

const CATEGORIES = [
  "Wallets",
  "Watches",
  "Belts",
  "Perfumes",
  "Cross Bags",
  "Accessories",
  "Tech — Coming Soon",
];

const CONTACT = [
  { label: "WhatsApp", href: "#", Icon: MessageCircle },
  { label: "Email", href: "#", Icon: Mail },
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "Facebook", href: "#", Icon: Facebook },
  {
    label: "TikTok",
    href: "#",
    Icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.6 6.3a5.3 5.3 0 0 1-3.2-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.7a2.8 2.8 0 1 0 2 2.7V2h2.6a5.3 5.3 0 0 0 3.2 4.3v0Z" />
      </svg>
    ),
  },
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-teal">
      {children}
    </p>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      <div className="mx-auto w-full max-w-7xl px-6 pb-10 pt-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <BrandMark size="md" showTagline />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Modern men's lifestyle brand combining fashion and technology —
              crafted for the ones who own their style.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-5">
            <ColumnHeading>Quick Links</ColumnHeading>
            <ul className="flex flex-col gap-3">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="group inline-flex items-center gap-2 text-sm text-foreground/75 transition-colors hover:text-foreground"
                  >
                    <span className="h-px w-4 bg-white/20 transition-all duration-300 group-hover:w-6 group-hover:bg-teal" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-5">
            <ColumnHeading>Categories</ColumnHeading>
            <ul className="flex flex-col gap-3">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link
                    to="/products"
                    className="group inline-flex items-center gap-2 text-sm text-foreground/75 transition-colors hover:text-foreground"
                  >
                    <span className="h-px w-4 bg-white/20 transition-all duration-300 group-hover:w-6 group-hover:bg-teal" />
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-5">
            <ColumnHeading>Contact</ColumnHeading>
            <ul className="flex flex-col gap-3">
              {CONTACT.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    className="group inline-flex items-center gap-3 text-sm text-foreground/75 transition-colors hover:text-foreground"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 transition-all duration-300 group-hover:border-teal group-hover:text-teal">
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="mt-8 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            © 2026 QYVERO. All Rights Reserved.
          </p>
          <p className="text-xs tracking-[0.2em] text-muted-foreground/80 uppercase">
            Designed with passion for modern men.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
