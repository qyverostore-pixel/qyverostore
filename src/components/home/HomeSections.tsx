import { Link } from "@tanstack/react-router";
import type { SVGProps } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Wallet,
  Watch,
  Sparkles,
  Cpu,
  ShieldCheck,
  Truck,
  Instagram,
  Facebook,
  Mail,
  MessageCircle,
  Star,
  Gem,
  Dumbbell,
  Shirt,
} from "lucide-react";
import { PiBeltFill } from "react-icons/pi";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { EmptyState } from "@/components/ui/empty-state";
import { useCategories, useFeaturedProducts } from "@/hooks/use-products";
import type { StoreProduct } from "@/services/products";
import { useStorefrontSettings } from "@/providers/StorefrontSettingsProvider";
import { emailUrl, externalUrl, whatsappUrl } from "@/services/store-settings";
import { useLocale } from "@/providers/LocaleProvider";
import {
  localizedCategoryDescription,
  localizedCategoryName,
  localizedProductName,
} from "@/lib/localized-content";

/* ---------- shared bits ---------- */

const TikTokIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.6 6.3a5.3 5.3 0 0 1-3.2-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.7a2.8 2.8 0 1 0 2 2.7V2h2.6a5.3 5.3 0 0 0 3.2 4.3v0Z" />
  </svg>
);

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-2xl text-center"
          : "max-w-2xl text-left"
      }
    >
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-4 text-display text-3xl font-light leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

/* ---------- hero ---------- */

function Hero() {
  const settings = useStorefrontSettings();
  const { language, t } = useLocale();
  const heroTitleWords = t("home.ownYourStyle").trim().split(" ");
  const heroTitleHighlight = heroTitleWords.pop() ?? "";
  const heroTitlePrefix = heroTitleWords.join(" ");
  const socials = [
    { label: t("home.instagram"), Icon: Instagram, href: externalUrl(settings.instagram) },
    { label: "Facebook", Icon: Facebook, href: externalUrl(settings.facebook) },
    { label: "TikTok", Icon: TikTokIcon, href: externalUrl(settings.tiktok) },
    { label: language === "ar" ? "واتساب" : "WhatsApp", Icon: MessageCircle, href: whatsappUrl(settings.whatsapp) },
    { label: language === "ar" ? "إيميل" : "Email", Icon: Mail, href: emailUrl(settings.email) },
  ].filter((social) => social.href);

  return (
    <section className="qy-hero bg-noise relative isolate overflow-hidden">
      {/* geometric shapes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
        <div className="absolute left-1/2 top-1/2 h-[920px] w-[920px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.03]" />
        <div className="absolute -right-24 top-24 h-72 w-72 rotate-45 rounded-3xl border border-white/5" />
        <div className="absolute -left-16 bottom-16 h-56 w-56 rotate-12 rounded-3xl border border-white/5" />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
        <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.4em] text-foreground/85 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          {t("home.newMensLifestyleBrand")}
        </span>

        <h1
          className="animate-fade-up mt-8 text-display text-5xl font-light leading-[0.95] text-foreground sm:text-7xl md:text-[6.5rem]"
          style={{ animationDelay: "0.1s" }}
        >
          {heroTitlePrefix} <span className="italic text-teal">{heroTitleHighlight}</span>
        </h1>

        <p
          className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: "0.2s" }}
        >
          {t("home.heroDescription")}
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            to="/products"
            className="qy-hero-primary group inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-background transition-all duration-200 hover:-translate-y-px hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("home.exploreCollection")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/contact"
            className="qy-hero-secondary inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-px hover:border-white/30 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("home.contactUs")}
          </Link>
        </div>

        <div
          className="animate-fade-up mt-14 flex items-center gap-2"
          style={{ animationDelay: "0.4s" }}
        >
          {socials.map(({ label, Icon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-foreground/80 transition hover:-translate-y-0.5 hover:border-teal hover:text-teal"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <div
          className="animate-fade-up absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
          style={{ animationDelay: "0.6s" }}
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {t("home.scroll")}
          </span>
          <span className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}

/* ---------- categories ---------- */

const categoryIcons = { wallets: Wallet, watches: Watch, belts: PiBeltFill, perfumes: Sparkles, accessories: Gem, tech: Cpu, gym: Dumbbell, clothing: Shirt };

function categoryIcon(icon: string | null, slug: string) {
  const key = (icon || slug).toLowerCase();
  return Object.entries(categoryIcons).find(([name]) => key.includes(name))?.[1] ?? Sparkles;
}

function Categories() {
  const { data: categories = [] } = useCategories();
  const { language, t } = useLocale();
  return (
    <section id="categories" className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        <SectionHeading
          eyebrow={t("home.featuredCategories")}
          title={t("home.craftedForEveryEssential")}
          description={t("home.categoriesDescription")}
        />

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const { slug, icon } = category;
            const name = localizedCategoryName(category, language);
            const description = localizedCategoryDescription(category, language);
            const Icon = categoryIcon(icon, slug);
            return (
            <Link
              key={slug}
              to="/products"
              search={{ category: slug }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.04] active:scale-[0.98]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              />
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-foreground transition-colors group-hover:border-teal/50 group-hover:text-teal">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-5 w-5 text-foreground/40 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal" />
              </div>
              <div className="mt-10">
                <p className="text-display text-lg font-medium text-foreground">
                  {name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  {description?.trim() || t("home.shopCollection")}
                </p>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- featured products ---------- */

function ProductCard({ product }: { product: StoreProduct }) {
  const settings = useStorefrontSettings();
  const { language, t } = useLocale();
  const name = localizedProductName(product, language);
  const categoryName = product.category
    ? localizedCategoryName(product.category, language)
    : t("home.collection");
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition-all duration-500 hover:-translate-y-1 hover:border-white/25">
      <div
        className="relative aspect-square overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-950"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15), transparent 60%)",
          }}
        />
        {product.images[0] ? (
          <img
            src={product.images[0].image_url}
            alt={name}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-display text-6xl font-light text-white/10">
              QY
            </span>
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-foreground/90 backdrop-blur">
          {categoryName}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-display truncate text-base font-medium text-foreground">
              {name}
            </h3>
            <p className="mt-1 text-sm font-semibold text-teal">
              ${Number(product.price)}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Link
            to="/products/$productId"
            params={{ productId: product.slug }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-background transition hover:bg-foreground/90 text-center"
          >
            {t("home.viewDetails")}
          </Link>
          <a
            href={whatsappUrl(
              settings.whatsapp,
              language === "ar"
                ? `أهلاً QYVERO، أنا مهتم بـ ${name}.`
                : `Hello QYVERO, I'm interested in the ${name}.`,
            )}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {t("home.orderViaWhatsApp")}
          </a>
        </div>
      </div>
    </article>
  );
}

function FeaturedProducts() {
  const { data: products = [] } = useFeaturedProducts();
  const { t } = useLocale();
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow={t("home.featuredProducts")}
            title={t("home.handpickedEssentials")}
            description={t("home.featuredProductsDescription")}
            align="left"
          />
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition hover:text-foreground"
          >
            {t("home.viewAll")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {!products.length && (
          <div className="mt-14">
            <EmptyState
              title={t("home.noFeaturedProducts")}
              description={t("home.featuredProductsWillAppear")}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- why qyvero ---------- */

function WhyQyvero() {
  const { t } = useLocale();
  const items = [
    {
      Icon: ShieldCheck,
      title: t("home.premiumQuality"),
      desc: t("home.premiumQualityDescription"),
    },
    {
      Icon: Star,
      title: t("home.modernDesign"),
      desc: t("home.modernDesignDescription"),
    },
    {
      Icon: Truck,
      title: t("home.fastNationwideDelivery"),
      desc: t("home.fastNationwideDeliveryDescription"),
    },
  ];

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        <SectionHeading
          eyebrow={t("home.whyQyvero")}
          title={t("home.builtOnStandards")}
        />

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="glass-card group relative overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:-translate-y-1"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-teal/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              />
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-teal">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="text-display mt-8 text-xl font-medium text-foreground">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- brand story ---------- */

function BrandStory() {
  const { t } = useLocale();
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="glass-card grid grid-cols-1 gap-12 overflow-hidden rounded-[2rem] p-8 sm:p-14 lg:grid-cols-2 lg:p-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">
              {t("home.ourStory")}
            </p>
            <h2 className="text-display mt-4 text-3xl font-light leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
              {t("home.beginningOfQyvero")}
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>{t("home.storyParagraphOne")}</p>
              <p>{t("home.storyParagraphTwo")}</p>
            </div>
            <Link
              to="/about"
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-foreground transition hover:border-teal hover:text-teal"
            >
              {t("home.readOurStory")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
            <div
              aria-hidden
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 20%, rgba(15,61,62,0.6), transparent 60%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08), transparent 60%)",
              }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <BrandMark size="lg" showTagline asLink={false} />
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              <span>{t("home.est2026")}</span>
              <span>{t("home.modernMen")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- instagram preview ---------- */

function InstagramPreview() {
  const settings = useStorefrontSettings();
  const { t } = useLocale();
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="glass-card relative overflow-hidden rounded-[2rem] px-8 py-16 text-center sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-teal/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-teal/10 blur-3xl"
          />

          <span className="grid h-16 w-16 mx-auto place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-teal">
            <Instagram className="h-7 w-7" />
          </span>

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">
            {settings.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "@").replace(/\/$/, "") || t("home.instagram")}
          </p>
          <h2 className="text-display mt-4 text-3xl font-light leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
            {t("home.followBrandOnInstagram")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            {t("home.instagramDescription")}
          </p>

          <div className="mt-10 flex justify-center">
            <a
              href={externalUrl(settings.instagram)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-background transition hover:bg-foreground/90"
            >
              <Instagram className="h-4 w-4" />
              {t("home.followUs")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- newsletter ---------- */

function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const { t } = useLocale();
  return (
    <section className="relative pb-24 pt-8 sm:pb-32">
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="glass-card relative overflow-hidden rounded-[2rem] p-10 text-center sm:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-teal/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-teal/10 blur-3xl"
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">
            {t("home.newsletter")}
          </p>
          <h2 className="text-display mt-4 text-3xl font-light leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
            {t("home.stayConnected")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            {t("home.newsletterDescription")}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              setDone(true);
              setEmail("");
              setTimeout(() => setDone(false), 3000);
            }}
            className="mx-auto mt-10 flex w-full max-w-lg flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("home.emailPlaceholder")}
              className="w-full flex-1 rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-background transition hover:bg-foreground/90"
            >
              {done ? t("home.subscribed") : t("home.subscribe")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ---------- page ---------- */

export function HomePage() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <WhyQyvero />
      <BrandStory />
      <InstagramPreview />
      <Newsletter />
    </>
  );
}

export default HomePage;
