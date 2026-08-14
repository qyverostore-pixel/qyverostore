import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Mail, Lock } from "lucide-react";
import { AuthLayout, AuthSideVisual } from "@/components/auth-layout";
import { TextField } from "@/components/text-field";
import { GoogleButton } from "@/components/google-button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/auth/signin")({
  head: () => seoHead({ title: "Sign in", description: "Access your QYVERO account.", path: "/auth/signin", robots: "noindex,nofollow" }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { t } = useLocale();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (profile?.role === "admin") {
        navigate({ to: "/admin", replace: true });
      } else {
        navigate({ to: "/", replace: true });
      }
    }
  }, [loading, navigate, user, profile]);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = t("auth.validEmail");
    if (form.password.length < 8) e.password = t("auth.minPassword");
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) {
        toast.error(t("auth.unableToSignIn"), { description: error.message });
        return;
      }
      toast.success(t("auth.signedIn"));
    } catch (error) {
      toast.error(t("auth.unableToSignIn"), { description: error instanceof Error ? error.message : t("common.tryAgain") });
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && user) {
    return null;
  }

  return (
    <AuthLayout
      eyebrow={t("auth.welcomeBack")}
      title={
        <>
          {t("auth.leaveYour")} <span className="text-teal">{t("auth.impression")}</span>.
        </>
      }
      subtitle={t("auth.signInSubtitle")}
      side={<AuthSideVisual variant="signin" />}
    >
      <div className="glass-card rounded-3xl p-8 sm:p-10">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-teal">
            {t("auth.signIn")}
          </p>
          <h1 className="mt-3 text-display text-3xl font-light text-foreground">
            {t("auth.welcomeBack")}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.newToQyvero")} {" "}
            <Link
              to="/auth/signup"
              className="text-foreground underline-offset-4 hover:underline"
            >
              {t("auth.createOne")}
            </Link>
            .
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <TextField
            label={t("auth.email")}
            type="email"
            placeholder="you@qyvero.com"
            autoComplete="email"
            icon={<Mail />}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
          />
          <TextField
            label={t("auth.password")}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            icon={<Lock />}
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            error={errors.password}
          />

          <div className="mt-1 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) =>
                  setForm((f) => ({ ...f, remember: e.target.checked }))
                }
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[color:var(--color-teal)]"
              />
              {t("auth.rememberMe")}
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-background transition-all hover:bg-foreground/90 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? t("auth.signingIn") : t("auth.login")}
          </button>

          <div className="my-1 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
            <span className="h-px flex-1 bg-white/10" />
            {t("auth.or")}
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <GoogleButton />
        </form>
      </div>
    </AuthLayout>
  );
}
