import { Link } from "@tanstack/react-router";
import { useLocale } from "@/providers/LocaleProvider";

const content = {
  privacy: ["legal.privacyEyebrow", "legal.privacyTitle", "legal.privacyText"],
  terms: ["legal.termsEyebrow", "legal.termsTitle", "legal.termsText"],
  shipping: ["legal.shippingEyebrow", "legal.shippingTitle", "legal.shippingText"],
  returns: ["legal.returnsEyebrow", "legal.returnsTitle", "legal.returnsText"],
} as const;

export function LegalPage({ type }: { type: keyof typeof content }) {
  const { t } = useLocale();
  const [eyebrow, title, text] = content[type];
  return <main className="min-h-screen bg-noise py-24 sm:py-32"><div className="mx-auto max-w-3xl px-6"><p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">{t(eyebrow)}</p><h1 className="text-display mt-5 text-4xl font-light sm:text-6xl">{t(title)}</h1><div className="glass-card mt-10 rounded-[2rem] p-7 sm:p-10"><p className="text-base leading-8 text-muted-foreground">{t(text)}</p><p className="mt-6 text-sm leading-7 text-muted-foreground">{t("legal.questions")}</p></div><Link to="/contact" className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm transition hover:border-teal hover:text-teal">{t("legal.contactQyvero")}</Link></div></main>;
}
