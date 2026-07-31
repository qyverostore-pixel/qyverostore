import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { subscribeNewsletter } from "@/services/email";
import { useStorefrontSettings } from "@/providers/StorefrontSettingsProvider";
import { emailUrl, externalUrl, whatsappUrl } from "@/services/store-settings";
import { Facebook, Instagram, Mail, MessageCircle, Music2 } from "lucide-react";

const QUICK_LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/", hash: "categories", label: "Categories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/connect", label: "Connect" },
  { to: "/auth/signin", label: "Sign In" },
] as const;

const CATEGORIES = [
  { label: "Wallets", slug: "wallets" },
  { label: "Watches", slug: "watches" },
  { label: "Belts", slug: "belts" },
  { label: "Perfumes", slug: "perfumes" },
  { label: "Cross Bags", slug: "cross-bags" },
  { label: "Accessories", slug: "accessories" },
  { label: "Tech", slug: "tech" },
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-teal">{children}</p>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const settings = useStorefrontSettings();
  const contact = [
    { label: "WhatsApp", href: whatsappUrl(settings.whatsapp), Icon: MessageCircle },
    { label: "Email", href: emailUrl(settings.email), Icon: Mail },
    { label: "Instagram", href: externalUrl(settings.instagram), Icon: Instagram },
    { label: "Facebook", href: externalUrl(settings.facebook), Icon: Facebook },
    { label: "TikTok", href: externalUrl(settings.tiktok), Icon: Music2 },
  ].filter((item) => item.href);
  const subscribe = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await subscribeNewsletter(email);
      setEmail("");
      toast.success("You’re on the list.");
    } catch (error) {
      toast.error("Unable to subscribe", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };
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
              Modern men's lifestyle brand combining fashion and technology — crafted for the ones
              who own their style.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <ColumnHeading>Newsletter</ColumnHeading>
            <p className="text-sm leading-relaxed text-muted-foreground">
              New arrivals, private offers, and considered edits.
            </p>
            <form onSubmit={subscribe} className="flex gap-2">
              <input
                required
                type="email"
                aria-label="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                className="h-10 min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.03] px-4 text-sm outline-none transition focus:border-teal"
              />
              <button
                disabled={submitting}
                className="rounded-full bg-teal px-4 text-xs font-semibold text-teal-foreground disabled:opacity-60"
              >
                {submitting ? "…" : "Join"}
              </button>
            </form>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-5">
            <ColumnHeading>Quick Links</ColumnHeading>
            <ul className="flex flex-col gap-3">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    hash={"hash" in l ? l.hash : undefined}
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
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    to="/products"
                    search={{ category: category.slug }}
                    className="group inline-flex items-center gap-2 text-sm text-foreground/75 transition-colors hover:text-foreground"
                  >
                    <span className="h-px w-4 bg-white/20 transition-all duration-300 group-hover:w-6 group-hover:bg-teal" />
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-5">
            <ColumnHeading>Contact</ColumnHeading>
            <ul className="flex flex-col gap-3">
              {contact.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    className="group inline-flex items-center gap-3 text-sm text-foreground/75 transition-colors hover:text-foreground"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 transition-all duration-300 group-hover:border-teal group-hover:text-teal">
                      {Icon && <Icon className="h-4 w-4" />}
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
