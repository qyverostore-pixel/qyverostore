import {
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useState, type ElementType, type FormEvent, type SVGProps } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type ContactChannel = {
  name: string;
  handle: string;
  href: string;
  Icon: ElementType<SVGProps<SVGSVGElement>>;
};

const contactChannels: ContactChannel[] = [
  {
    name: "WhatsApp",
    handle: "+20 150 596 7144",
    href: "https://wa.me/201505967144",
    Icon: MessageCircle,
  },
  {
    name: "Email",
    handle: "qyverostore@gmail.com",
    href: "mailto:qyverostore@gmail.com",
    Icon: Mail,
  },
  {
    name: "Instagram",
    handle: "@qyverostore",
    href: "https://www.instagram.com/qyverostore",
    Icon: Instagram,
  },
  {
    name: "Facebook",
    handle: "QYVERO Store",
    href: "https://www.facebook.com/share/1JiGemJjBM/",
    Icon: Facebook,
  },
  {
    name: "TikTok",
    handle: "@qyvero.store",
    href: "https://www.tiktok.com/@qyvero.store",
    Icon: TikTokIcon,
  },
];

const faqs = [
  [
    "How can I place an order?",
    "Choose a product and use its WhatsApp order button. Our team will confirm availability, delivery details, and payment with you directly.",
  ],
  [
    "How long does delivery take?",
    "Orders are prepared within 1–2 business days. Delivery times vary by location, and tracking details are shared once your order is dispatched.",
  ],
  [
    "Do you ship nationwide?",
    "Yes. QYVERO delivers across Egypt, so your selected essentials can reach you wherever you are.",
  ],
  [
    "Can I ask about a product before ordering?",
    "Absolutely. Message us on WhatsApp or Instagram and we will gladly help with product details, availability, and recommendations.",
  ],
  [
    "How do I stay updated on new releases?",
    "Follow QYVERO on Instagram and TikTok for new drops, product updates, and the stories behind the collection.",
  ],
] as const;

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.6 6.3a5.3 5.3 0 0 1-3.2-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.7a2.8 2.8 0 1 0 2 2.7V2h2.6a5.3 5.3 0 0 0 3.2 4.3v0Z" />
    </svg>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">{eyebrow}</p>
      <h2 className="text-display mt-4 text-3xl font-light leading-[1.1] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function ContactCard({ channel }: { channel: ContactChannel }) {
  const { Icon } = channel;
  return (
    <a
      href={channel.href}
      target={channel.href.startsWith("http") ? "_blank" : undefined}
      rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.04]"
    >
      <div
        aria-hidden
        className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-teal/15 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
      />
      <span className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-teal">
        <Icon className="h-5 w-5" />
      </span>
      <p className="relative text-display mt-8 text-lg font-medium">{channel.name}</p>
      <p className="relative mt-1 truncate text-sm text-muted-foreground">{channel.handle}</p>
      <span className="relative mt-5 inline-flex text-xs font-medium text-foreground/70 transition group-hover:text-teal">
        Connect with us{" "}
        <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
      </span>
    </a>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
    toast.success("Message sent", { description: "Our team will get back to you shortly." });
  };
  const inputClass =
    "mt-2 h-12 rounded-xl border-white/15 bg-white/[0.025] px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:ring-2 focus:ring-teal/20";
  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-[2rem] p-6 sm:p-9">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Full Name
          <input
            required
            name="fullName"
            autoComplete="name"
            placeholder="Your name"
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Email
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
          />
        </label>
      </div>
      <label className="mt-5 block text-sm font-medium">
        Subject
        <input required name="subject" placeholder="How can we help?" className={inputClass} />
      </label>
      <label className="mt-5 block text-sm font-medium">
        Message
        <textarea
          required
          name="message"
          rows={5}
          placeholder="Tell us a little more..."
          className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-white/[0.025] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
      </label>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {sent
            ? "Thank you — your message is ready for our team."
            : "We usually reply within one business day."}
        </p>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-xs font-semibold uppercase tracking-[0.18em] text-background transition hover:bg-foreground/90"
        >
          <Send className="h-4 w-4" />
          {sent ? "Message Sent" : "Send Message"}
        </button>
      </div>
    </form>
  );
}

function BusinessInfo() {
  const details = [
    { Icon: Clock3, title: "Business Hours", text: "Daily, 10:00 AM – 10:00 PM" },
    { Icon: MessageCircle, title: "Response Time", text: "Within 24 hours on business days" },
    { Icon: Truck, title: "Delivery", text: "Nationwide shipping across Egypt" },
  ];
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      {details.map(({ Icon, title, text }) => (
        <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
          <Icon className="h-5 w-5 text-teal" />
          <p className="mt-5 text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
        </div>
      ))}
    </div>
  );
}

export function ContactPage() {
  return (
    <main className="min-h-screen bg-noise pb-24 sm:pb-32">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
          <div className="absolute -right-20 top-12 h-64 w-64 rotate-45 rounded-[3rem] border border-teal/15" />
        </div>
        <div className="mx-auto flex min-h-[28rem] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center sm:min-h-[34rem]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.35em] text-foreground/85 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            Get in touch
          </span>
          <h1 className="text-display mt-8 text-5xl font-light leading-none sm:text-7xl">
            Contact <span className="italic text-teal">QYVERO.</span>
          </h1>
          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            We&apos;d love to hear from you.
          </p>
        </div>
      </section>
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Find us everywhere"
            title="The easiest way to connect."
            description="Reach out through the channel that feels most natural to you."
          />
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {contactChannels.map((channel) => (
              <ContactCard key={channel.name} channel={channel} />
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-white/10 bg-white/[0.015] py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Send a note"
              title="Let's start a conversation."
              description="Questions about an order, a product, or the brand? Leave us a message and our team will be in touch."
              align="left"
            />
            <div className="mt-8 flex items-start gap-3 text-sm text-muted-foreground">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-teal/30 bg-teal/10 text-teal">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <p className="pt-1">
                Your message is handled with care. There is no backend connected yet, so messages
                are not stored.
              </p>
            </div>
          </div>
          <div>
            <ContactForm />
            <BusinessInfo />
          </div>
        </div>
      </section>
      <section className="py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Helpful answers"
              title="Frequently asked questions."
              description="A few quick answers before you reach out."
              align="left"
            />
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-5 w-5 text-teal" />
              Based in Egypt, serving customers nationwide.
            </div>
          </div>
          <Accordion type="single" collapsible className="border-t border-white/10">
            {faqs.map(([question, answer], index) => (
              <AccordionItem key={question} value={`faq-${index}`} className="border-white/10">
                <AccordionTrigger className="py-5 text-base text-foreground hover:no-underline">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl leading-6 text-muted-foreground">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main>
  );
}

export default ContactPage;
