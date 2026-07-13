import { Link } from "@tanstack/react-router";
import { getSocialLink } from "@/data/social";
import {
  ArrowRight,
  Check,
  CircuitBoard,
  Gem,
  Globe2,
  Instagram,
  Lightbulb,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
};

const timeline = [
  "Brand Started",
  "First Collection",
  "100 Customers",
  "1000 Customers",
  "Private Label",
  "Global Brand",
];

const values = [
  {
    title: "Premium Quality",
    description: "Considered materials and details that earn their place in your everyday.",
    Icon: Gem,
  },
  {
    title: "Innovation",
    description: "A technology mindset applied to how products look, feel, and function.",
    Icon: Lightbulb,
  },
  {
    title: "Trust",
    description: "Clear choices, honest standards, and a customer experience built to last.",
    Icon: ShieldCheck,
  },
  {
    title: "Modern Lifestyle",
    description: "Objects designed for the pace, ambition, and taste of modern life.",
    Icon: Sparkles,
  },
];

function SectionHeading({ eyebrow, title, description, align = "center" }: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">{eyebrow}</p>
      <h2 className="text-display mt-4 text-3xl font-light leading-[1.1] text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-noise">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07]" />
        <div className="absolute -right-20 top-20 h-64 w-64 rotate-45 rounded-[3rem] border border-teal/15" />
      </div>
      <div className="mx-auto flex min-h-[34rem] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center sm:min-h-[40rem]">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.35em] text-foreground/85 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          About QYVERO
        </span>
        <h1 className="text-display mt-8 max-w-4xl text-5xl font-light leading-[0.98] sm:text-7xl md:text-[6.25rem]">
          The story behind <span className="italic text-teal">QYVERO.</span>
        </h1>
        <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          A modern men&apos;s lifestyle brand, engineered around the things worth carrying every
          day.
        </p>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-24">
        <div className="relative min-h-[25rem] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-teal/20 via-neutral-900 to-black p-8 sm:min-h-[31rem]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,.18), transparent 25%), radial-gradient(circle at 80% 80%, rgba(15,90,90,.65), transparent 40%)",
            }}
          />
          <div className="absolute inset-8 rounded-[1.5rem] border border-white/10" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative grid h-36 w-36 place-items-center rounded-[2.5rem] border border-white/15 bg-black/20 text-teal shadow-2xl backdrop-blur">
              <CircuitBoard className="h-12 w-12" />
              <span className="absolute -bottom-14 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.4em] text-foreground/65">
                Fashion meets technology
              </span>
            </div>
          </div>
        </div>
        <div>
          <SectionHeading
            eyebrow="Our beginning"
            title="Two students, one considered idea."
            align="left"
          />
          <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              QYVERO began with two Computer Science students who saw the same gap in the things men
              use every day: too much noise, too little intention.
            </p>
            <p>
              We shared a belief that fashion and technology should speak the same language — clean,
              purposeful, and quietly capable. What started as late-night conversations about design
              systems and everyday carry became a vision for a premium men&apos;s lifestyle brand.
            </p>
            <p>
              Today, QYVERO selects accessories and essentials with the precision of a product team
              and the restraint of a timeless wardrobe. Every piece is here to make the everyday
              feel more considered.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Timeline() {
  return (
    <section className="border-y border-white/10 bg-white/[0.015] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="The roadmap"
          title="Designed with the long view."
          description="A small beginning, shaped by a clear ambition."
        />
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="relative space-y-0 before:absolute before:bottom-5 before:left-[1.1rem] before:top-5 before:w-px before:bg-gradient-to-b before:from-teal before:via-white/15 before:to-transparent sm:before:left-1/2">
            {timeline.map((item, index) => (
              <div
                key={item}
                className="relative grid grid-cols-[2.25rem_1fr] gap-5 pb-9 last:pb-0 sm:grid-cols-2 sm:gap-12"
              >
                <span className="relative z-10 grid h-9 w-9 place-items-center rounded-full border border-teal/40 bg-background text-[10px] font-semibold text-teal">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="pt-1 sm:col-start-2">
                  {index === 0 && (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-teal">
                      2026
                    </p>
                  )}
                  <p className="text-display text-xl font-medium text-foreground">{item}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {index === 0
                      ? "The first line of the QYVERO story."
                      : "The next chapter is being written with intention."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Purpose() {
  const items = [
    {
      label: "Mission",
      title: "Make the everyday more intentional.",
      text: "To bring together premium design, useful innovation, and honest quality in objects that accompany modern men through their day.",
      Icon: Sparkles,
    },
    {
      label: "Vision",
      title: "A globally recognised modern essential.",
      text: "To build QYVERO into the reference for men who value quiet confidence, considered design, and a lifestyle that moves with the future.",
      Icon: Globe2,
    },
  ];
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-5 px-6 md:grid-cols-2">
        {items.map(({ label, title, text, Icon }) => (
          <article
            key={label}
            className="glass-card group relative overflow-hidden rounded-[2rem] p-8 sm:p-12"
          >
            <div
              aria-hidden
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
            />
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-teal">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.35em] text-teal">
              {label}
            </p>
            <h2 className="text-display mt-4 max-w-md text-3xl font-light leading-tight">
              {title}
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Values() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="What guides us" title="Principles in every detail." />
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ title, description, Icon }) => (
            <article
              key={title}
              className="group rounded-3xl border border-white/10 bg-white/[0.02] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.04]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-teal">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-display mt-7 text-xl font-medium">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderCard({
  role,
  initials,
  name,
  tone,
}: {
  role: string;
  initials: string;
  name: string;
  tone: string;
}) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02]">
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${tone}`}>
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 20%, rgba(255,255,255,.25), transparent 30%)",
          }}
        />
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-display text-7xl font-light tracking-[0.15em] text-white/30">
            {initials}
          </span>
        </div>
        <span className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-foreground/85 backdrop-blur">
          QYVERO
        </span>
      </div>
      <div className="p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-teal">{role}</p>
        <h3 className="text-display mt-3 text-2xl font-medium">{name}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Computer Science student and co-architect of the QYVERO vision.
        </p>
      </div>
    </article>
  );
}

function Founders() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading
          eyebrow="The people behind it"
          title="Meet the founders."
          description="Two minds with a shared standard for what modern essentials should be."
        />
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          <FounderCard
            role="Founder"
            name="Founder Name"
            initials="FN"
            tone="from-teal/30 via-neutral-800 to-neutral-950"
          />
          <FounderCard
            role="Co-Founder"
            name="Co-Founder Name"
            initials="CN"
            tone="from-stone-600 via-neutral-800 to-neutral-950"
          />
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="pb-24 pt-8 sm:pb-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="glass-card relative overflow-hidden rounded-[2rem] px-7 py-14 text-center sm:px-16 sm:py-20">
          <div
            aria-hidden
            className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-teal/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-teal/15 blur-3xl"
          />
          <p className="relative text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">
            The journey continues
          </p>
          <h2 className="text-display relative mx-auto mt-5 max-w-2xl text-4xl font-light leading-tight sm:text-5xl">
            Join our journey.
          </h2>
          <p className="relative mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Follow the evolution of QYVERO — new drops, ideas, and the details behind a more
            considered everyday.
          </p>
          <div className="relative mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-background transition hover:bg-foreground/90"
            >
              Explore products <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={getSocialLink("Instagram").href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-foreground transition hover:border-teal hover:text-teal"
            >
              <Instagram className="h-4 w-4" />
              Follow us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutPage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Story />
      <Timeline />
      <Purpose />
      <Values />
      <Founders />
      <CallToAction />
    </main>
  );
}

export default AboutPage;
