import { Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { BrandMark } from "@/components/brand-mark";
import { subscribeNewsletter } from "@/services/email";
import { useStorefrontSettings } from "@/providers/StorefrontSettingsProvider";
import {
  emailUrl,
  externalUrl,
  whatsappUrl,
} from "@/services/store-settings";
import {
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  Music2,
  Youtube,
} from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import { useCategories } from "@/hooks/use-products";
import { localizedCategoryName } from "@/lib/localized-content";

function ColumnHeading({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-teal">
      {children}
    </p>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const settings = useStorefrontSettings();
  const { language, t } = useLocale();
  const { data: categories = [] } = useCategories();

  const quickLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/products", label: t("nav.products") },
    { to: "/", hash: "categories", label: t("nav.categories") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
    { to: "/connect", label: t("nav.connect") },
    { to: "/auth/signin", label: t("nav.signIn") },
  ] as const;

  const policyLinks = [
    { to: "/policies", label: t("footer.policies") },
    { to: "/privacy-policy", label: t("legal.privacyTitle") },
    { to: "/terms-and-conditions", label: t("legal.termsTitle") },
    { to: "/return-policy", label: t("legal.returnsTitle") },
    { to: "/shipping-policy", label: t("legal.shippingTitle") },
  ] as const;

  const contact = [
    {
      label: "WhatsApp",
      href: whatsappUrl(settings.whatsapp),
      Icon: MessageCircle,
    },
    {
      label: "Email",
      href: emailUrl(settings.email),
      Icon: Mail,
    },
    {
      label: "Instagram",
      href: externalUrl(settings.instagram),
      Icon: Instagram,
    },
    {
      label: "Facebook",
      href: externalUrl(settings.facebook),
      Icon: Facebook,
    },
    {
      label: "TikTok",
      href: externalUrl(settings.tiktok),
      Icon: Music2,
    },
    {
      label: "YouTube",
      href: externalUrl(settings.youtube),
      Icon: Youtube,
    },
  ].filter((item) => item.href);

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitting(true);

    try {
      await subscribeNewsletter(email);

      setEmail("");

      toast.success(t("footer.subscribed"));
    } catch {
      toast.error(t("footer.unableToSubscribe"), {
        description: t("common.tryAgain"),
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
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <BrandMark size="md" showTagline />

            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.description")}
            </p>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-5">
            <ColumnHeading>{t("footer.newsletter")}</ColumnHeading>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("footer.newsletterDescription")}
            </p>

            <form onSubmit={subscribe} className="flex gap-2">
              <input
                required
                type="email"
                aria-label={t("footer.emailAddress")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("footer.emailPlaceholder")}
                className="h-10 min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.03] px-4 text-sm outline-none transition focus:border-teal"
              />

              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-teal px-4 text-xs font-semibold text-teal-foreground disabled:opacity-60"
              >
                {submitting ? "…" : t("footer.join")}
              </button>
            </form>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-5">
            <ColumnHeading>{t("footer.quickLinks")}</ColumnHeading>

            <ul className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    hash={"hash" in link ? link.hash : undefined}
                    className="group inline-flex items-center gap-2 text-sm text-foreground/75 transition-colors hover:text-foreground"
                  >
                    <span className="h-px w-4 bg-white/20 transition-all duration-300 group-hover:w-6 group-hover:bg-teal" />

                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-5">
            <ColumnHeading>{t("footer.categories")}</ColumnHeading>

            <ul className="flex flex-col gap-3">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    to="/products"
                    search={{ category: category.slug }}
                    className="group inline-flex items-center gap-2 text-sm text-foreground/75 transition-colors hover:text-foreground"
                  >
                    <span className="h-px w-4 bg-white/20 transition-all duration-300 group-hover:w-6 group-hover:bg-teal" />

                    {localizedCategoryName(category, language)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="flex flex-col gap-5">
            <ColumnHeading>
              {t("footer.customerService")}
            </ColumnHeading>

            <ul className="flex flex-col gap-3">
              {policyLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group inline-flex items-center gap-2 text-sm text-foreground/75 transition-colors hover:text-foreground"
                  >
                    <span className="h-px w-4 bg-white/20 transition-all duration-300 group-hover:w-6 group-hover:bg-teal" />

                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / Social */}
          <div className="flex flex-col gap-5">
            <ColumnHeading>{t("footer.contact")}</ColumnHeading>

            <ul className="flex flex-col gap-3">
              {contact.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
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

        {/* Divider */}
        <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Bottom */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("footer.allRightsReserved")}
          </p>

          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
            {t("footer.designedForModernMen")}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;