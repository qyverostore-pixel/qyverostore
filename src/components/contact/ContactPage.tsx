import {
  ArrowRight,
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
import { createMessage } from "@/services/messages";
import { cleanText, isValidEmail, isValidName } from "@/lib/validation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useStorefrontSettings } from "@/providers/StorefrontSettingsProvider";
import { emailUrl, externalUrl, whatsappUrl, type StorefrontSettings } from "@/services/store-settings";
import { useLocale } from "@/providers/LocaleProvider";

type ContactChannel = {
  name: string;
  handle: string;
  href: string;
  Icon: ElementType<SVGProps<SVGSVGElement>>;
};

function contactChannels(settings: StorefrontSettings): ContactChannel[] {
  return [
    { name: "WhatsApp", handle: settings.whatsapp, href: whatsappUrl(settings.whatsapp), Icon: MessageCircle },
    { name: "Email", handle: settings.email, href: emailUrl(settings.email), Icon: Mail },
    { name: "Instagram", handle: settings.instagram, href: externalUrl(settings.instagram), Icon: Instagram },
    { name: "Facebook", handle: settings.facebook, href: externalUrl(settings.facebook), Icon: Facebook },
    { name: "TikTok", handle: settings.tiktok, href: externalUrl(settings.tiktok), Icon: TikTokIcon },
  ].filter((channel) => channel.href);
}

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
  const { t } = useLocale();
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
        {t("contact.connectWithUs")}
        <ArrowRight className="ms-1 h-3 w-3 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
      </span>
    </a>
  );
}

function ContactForm() {
  const { t } = useLocale();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const name = cleanText(String(form.get("fullName") ?? ""));
    const email = cleanText(String(form.get("email") ?? ""));
    const subject = cleanText(String(form.get("subject") ?? ""));
    const message = cleanText(String(form.get("message") ?? ""));

    if (!name || !email || !subject || !message) {
      toast.error(t("contact.completeFields"));
      return;
    }
    if (!isValidName(name)) { toast.error(t("validation.validName")); return; }
    if (!isValidEmail(email)) { toast.error(t("validation.validEmail")); return; }

    setSubmitting(true);

    try {
      await createMessage({
        full_name: name,
        email,
        subject,
        message,
      });

      setSent(true);
      formElement.reset();

      toast.success(t("contact.messageSent"), {
        description: t("contact.teamReplySoon"),
      });
    } catch (error) {
      toast.error(t("contact.unableSend"), {
        description: t("common.tryAgain"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-2 h-12 rounded-xl border-white/15 bg-white/[0.025] px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:ring-2 focus:ring-teal/20";

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-[2rem] p-6 sm:p-9">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          {t("contact.fullName")}
          <input
            required
            name="fullName"
            autoComplete="name"
            placeholder={t("contact.yourName")}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          {t("auth.email")}
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("contact.emailPlaceholder")}
            className={inputClass}
          />
        </label>
      </div>
      <label className="mt-5 block text-sm font-medium">
        {t("contact.subject")}
        <input required name="subject" placeholder={t("contact.help")} className={inputClass} />
      </label>
      <label className="mt-5 block text-sm font-medium">
        {t("contact.message")}
        <textarea
          required
          name="message"
          rows={5}
          placeholder={t("contact.tellMore")}
          className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-white/[0.025] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
      </label>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {sent ? t("contact.thankYou") : t("contact.replyTime")}
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-xs font-semibold uppercase tracking-[0.18em] text-background transition hover:bg-foreground/90"
        >
          <Send className="h-4 w-4" />
          {submitting ? t("contact.sending") : sent ? t("contact.sent") : t("contact.send")}
        </button>
      </div>
    </form>
  );
}

function BusinessInfo() {
  const { t } = useLocale();
  const details = [
    { Icon: Clock3, title: t("contact.businessHours"), text: t("contact.businessHoursValue") },
    { Icon: MessageCircle, title: t("contact.responseTime"), text: t("contact.responseTimeValue") },
    { Icon: Truck, title: t("contact.delivery"), text: t("contact.deliveryValue") },
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
  const settings = useStorefrontSettings();
  const { t } = useLocale();
  const faqs = [
    [t("contact.faqOrderQuestion"), t("contact.faqOrderAnswer")],
    [t("contact.faqDeliveryQuestion"), t("contact.faqDeliveryAnswer")],
    [t("contact.faqNationwideQuestion"), t("contact.faqNationwideAnswer")],
    [t("contact.faqProductQuestion"), t("contact.faqProductAnswer")],
    [t("contact.faqUpdatesQuestion"), t("contact.faqUpdatesAnswer")],
  ];
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
            {t("contact.eyebrow")}
          </span>
          <h1 className="text-display mt-8 text-5xl font-light leading-none sm:text-7xl">
            {t("contact.title")}
          </h1>
          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            {t("contact.description")}
          </p>
        </div>
      </section>
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow={t("contact.findUs")}
            title={t("contact.connectTitle")}
            description={t("contact.connectDescription")}
          />
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {contactChannels(settings).map((channel) => (
              <ContactCard key={channel.name} channel={channel} />
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-white/10 bg-white/[0.015] py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow={t("contact.sendNote")}
              title={t("contact.noteTitle")}
              description={t("contact.noteDescription")}
              align="left"
            />
            <div className="mt-8 flex items-start gap-3 text-sm text-muted-foreground">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-teal/30 bg-teal/10 text-teal">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <p className="pt-1">
                {t("contact.secureMessage")}
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
              eyebrow={t("contact.helpfulAnswers")}
              title={t("contact.faqTitle")}
              description={t("contact.faqDescription")}
              align="left"
            />
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-5 w-5 text-teal" />
              {t("contact.basedInEgypt")}
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
