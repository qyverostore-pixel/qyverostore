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
import { useFeaturedProducts } from "@/hooks/use-products";
import type { StoreProduct } from "@/services/products";
import { useStorefrontSettings } from "@/providers/StorefrontSettingsProvider";
import { emailUrl, externalUrl, whatsappUrl } from "@/services/store-settings";

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
  const socials = [
    { label: "Instagram", Icon: Instagram, href: externalUrl(settings.instagram) },
    { label: "Facebook", Icon: Facebook, href: externalUrl(settings.facebook) },
    { label: "TikTok", Icon: TikTokIcon, href: externalUrl(settings.tiktok) },
    { label: "WhatsApp", Icon: MessageCircle, href: whatsappUrl(settings.whatsapp) },
    { label: "Email", Icon: Mail, href: emailUrl(settings.email) },
  ].filter((social) => social.href);

  return (
    <section className="bg-noise relative isolate overflow-hidden">
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
          New Men's Lifestyle Brand
        </span>

        <h1
          className="animate-fade-up mt-8 text-display text-5xl font-light leading-[0.95] text-foreground sm:text-7xl md:text-[6.5rem]"
          style={{ animationDelay: "0.1s" }}
        >
          Own Your <span className="italic text-teal">Style.</span>
        </h1>

        <p
          className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: "0.2s" }}
        >
          Premium men's accessories, tech essentials and lifestyle products
          designed for modern everyday life.
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-background transition hover:bg-foreground/90"
          >
            Explore Collection
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-foreground transition hover:border-white/30 hover:bg-white/5"
          >
            Contact Us
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
            Scroll
          </span>
          <span className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}

/* ---------- categories ---------- */

const CATEGORIES = [
  {
    name: "Wallets & Bags",
    slug: "wallets-bags",
    Icon: Wallet,
    soon: false,
  },
  {
    name: "Watches",
    slug: "watches",
    Icon: Watch,
    soon: false,
  },
  {
    name: "Belts",
    slug: "belts",
    Icon: PiBeltFill,
    soon: false,
  },
  {
    name: "Perfumes",
    slug: "perfumes",
    Icon: Sparkles,
    soon: false,
  },
  {
    name: "Accessories",
    slug: "accessories",
    Icon: Gem,
    soon: false,
  },
  {
    name: "Tech & Computer Accessories",
    slug: "tech-computer-accessories",
    Icon: Cpu,
    soon: false,
  },
  {
    name: "Gym & Fitness Accessories",
    slug: "gym-fitness-accessories",
    Icon: Dumbbell,
    soon: false,
  },
  {
    name: "Clothing & Shoes & Socks",
    slug: "clothing-shoes-socks",
    Icon: Shirt,
    soon: true,
  },
];

function Categories() {
  return (
    <section id="categories" className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        <SectionHeading
          eyebrow="Featured Categories"
          title="Crafted for every essential"
          description="Explore curated collections that define the modern gentleman."
        />

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map(({ name, slug, Icon, soon }) => (
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
                  {soon ? "Coming Soon" : "Shop Collection"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- featured products ---------- */

function ProductCard({ product }: { product: StoreProduct }) {
  const settings = useStorefrontSettings();
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
            alt={product.images[0].alt_text ?? product.name}
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
          {product.category?.name ?? "Collection"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-display truncate text-base font-medium text-foreground">
              {product.name}
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
            View Details
          </Link>
          <a
            href={whatsappUrl(settings.whatsapp, `Hello QYVERO, I'm interested in the ${product.name}.`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Order via WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}

function FeaturedProducts() {
  const { data: products = [] } = useFeaturedProducts();
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Featured Products"
            title="Handpicked essentials"
            description="A tight edit of pieces we're proud to put our name on."
            align="left"
          />
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition hover:text-foreground"
          >
            View all
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
              title="No featured products"
              description="Featured products will appear here when they are available."
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- why qyvero ---------- */

function WhyQyvero() {
  const items = [
    {
      Icon: ShieldCheck,
      title: "Premium Quality",
      desc: "Every product is chosen and tested to hold up to everyday life.",
    },
    {
      Icon: Star,
      title: "Modern Design",
      desc: "Clean, timeless design language crafted for the modern man.",
    },
    {
      Icon: Truck,
      title: "Fast Nationwide Delivery",
      desc: "Quick, tracked shipping right to your door — anywhere in the country.",
    },
  ];

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        <SectionHeading
          eyebrow="Why QYVERO"
          title="Built on standards, not shortcuts."
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
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="glass-card grid grid-cols-1 gap-12 overflow-hidden rounded-[2rem] p-8 sm:p-14 lg:grid-cols-2 lg:p-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">
              Our Story
            </p>
            <h2 className="text-display mt-4 text-3xl font-light leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
              The Beginning of QYVERO
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>
                QYVERO started with one simple vision — to build a premium
                men's lifestyle brand where fashion meets technology.
              </p>
              <p>
                Instead of creating another online store, we chose to build a
                brand people can trust: thoughtful essentials, honest
                materials, and a design language that lasts longer than a
                trend.
              </p>
            </div>
            <Link
              to="/about"
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-foreground transition hover:border-teal hover:text-teal"
            >
              Read Our Story
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
              <span>Est. 2026</span>
              <span>Modern Men</span>
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
            {settings.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "@").replace(/\/$/, "") || "Instagram"}
          </p>
          <h2 className="text-display mt-4 text-3xl font-light leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
            Follow the brand on Instagram
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Fresh drops, styling, and behind the scenes.
          </p>

          <div className="mt-10 flex justify-center">
            <a
              href={externalUrl(settings.instagram)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-background transition hover:bg-foreground/90"
            >
              <Instagram className="h-4 w-4" />
              Follow Us
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
            Newsletter
          </p>
          <h2 className="text-display mt-4 text-3xl font-light leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
            Stay Connected
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Be the first to know about new collections and exclusive offers.
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
              placeholder="you@qyvero.com"
              className="w-full flex-1 rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-background transition hover:bg-foreground/90"
            >
              {done ? "Subscribed" : "Subscribe"}
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
