import { FileText, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLocale } from "@/providers/LocaleProvider";

const policies = [
  { to: "/privacy-policy", title: "legal.privacyTitle", description: "policies.privacyDescription", Icon: ShieldCheck },
  { to: "/terms-and-conditions", title: "legal.termsTitle", description: "policies.termsDescription", Icon: FileText },
  { to: "/return-policy", title: "legal.returnsTitle", description: "policies.returnsDescription", Icon: RotateCcw },
  { to: "/shipping-policy", title: "legal.shippingTitle", description: "policies.shippingDescription", Icon: Truck },
] as const;

export function PoliciesPage() {
  const { t } = useLocale();

  return (
    <main className="min-h-screen bg-noise py-24 sm:py-32">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">{t("policies.eyebrow")}</p>
          <h1 className="text-display mt-5 text-4xl font-light sm:text-6xl">{t("policies.title")}</h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">{t("policies.description")}</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {policies.map(({ to, title, description, Icon }) => (
            <article key={to} className="glass-card flex flex-col rounded-[2rem] p-7 sm:p-8">
              <span className="grid size-11 place-items-center rounded-2xl border border-teal/25 bg-teal/10 text-teal"><Icon className="size-5" /></span>
              <h2 className="text-display mt-6 text-2xl font-medium">{t(title)}</h2>
              <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{t(description)}</p>
              <Link to={to} className="mt-7 inline-flex w-fit rounded-full border border-white/15 px-5 py-2.5 text-sm transition hover:border-teal hover:text-teal">{t("policies.readPolicy")}</Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
