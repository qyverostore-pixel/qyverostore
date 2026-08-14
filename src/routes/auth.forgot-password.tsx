import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { AuthLayout, AuthSideVisual } from "@/components/auth-layout";
import { TextField } from "@/components/text-field";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useLocale } from "@/providers/LocaleProvider";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => seoHead({ title: "Forgot password", description: "Reset your QYVERO account password.", path: "/auth/forgot-password", robots: "noindex,nofollow" }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLocale();

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("auth.validEmail"));
      return;
    }

    setSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        toast.error(t("auth.unableToSend"), { description: resetError.message });
        return;
      }
      toast.success(t("auth.recoverySent"), { description: t("auth.recoverySentDescription") });
      setEmail("");
    } catch (error) {
      toast.error(t("auth.unableToSend"), { description: error instanceof Error ? error.message : t("common.tryAgain") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow={t("auth.accountRecovery")}
      title={t("auth.recoveryTitle")}
      subtitle={t("auth.recoverySubtitle")}
      side={<AuthSideVisual variant="signin" />}
    >
      <div className="glass-card rounded-3xl p-8 sm:p-10">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-teal">
            {t("auth.recovery")}
          </p>
          <h1 className="mt-3 text-display text-3xl font-light text-foreground">
            {t("auth.forgotPassword")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.recoveryInstruction")}
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <TextField
            label={t("auth.email")}
            type="email"
            placeholder="you@qyvero.com"
            autoComplete="email"
            icon={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-background transition-all hover:bg-foreground/90 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? t("auth.sendingLink") : t("auth.sendResetLink")}
          </button>

          <div className="mt-4 text-center">
            <Link
              to="/auth/signin"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("auth.backToSignIn")}
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
