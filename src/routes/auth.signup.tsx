import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Mail, Lock, User, AtSign, Phone } from "lucide-react";
import { AuthLayout, AuthSideVisual } from "@/components/auth-layout";
import { TextField } from "@/components/text-field";
import { GoogleButton } from "@/components/google-button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { normalizeEgyptianPhone } from "@/lib/validation";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/auth/signup")({
  head: () => seoHead({ title: "Create an account", description: "Create a QYVERO customer account.", path: "/auth/signup", robots: "noindex,nofollow" }),
  component: SignUpPage,
});

type Errors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "username"
    | "email"
    | "phone"
    | "password"
    | "confirm"
    | "terms",
    string
  >
>;

function SignUpPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { t } = useLocale();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Errors>({});
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

  const update =
    <K extends keyof typeof form>(k: K) =>
    (v: (typeof form)[K]) =>
      setForm((f) => ({ ...f, [k]: v }));

  function validate(): Errors {
    const e: Errors = {};
    if (form.firstName.trim().length < 2) e.firstName = t("auth.enterFirstName");
    if (form.lastName.trim().length < 2) e.lastName = t("auth.enterLastName");
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(form.username))
      e.username = t("auth.usernameHint");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = t("auth.validEmail");
    if (!normalizeEgyptianPhone(form.phone))
      e.phone = t("auth.validPhone");
    if (form.password.length < 8) e.password = t("auth.minPassword");
    if (form.confirm !== form.password) e.confirm = t("auth.passwordsMatch");
    if (!form.terms) e.terms = t("auth.acceptTerms");
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { first_name: form.firstName.trim(), last_name: form.lastName.trim(), username: form.username.trim(), phone: normalizeEgyptianPhone(form.phone) } },
      });
      if (error) {
        toast.error(t("auth.unableToCreate"), { description: error.message });
        return;
      }
      if (data.session) {
        toast.success(t("auth.accountCreated"));
        return;
      }
      toast.success(t("auth.checkEmail"));
      navigate({ to: "/auth/signin" });
    } catch (error) {
      toast.error(t("auth.unableToCreate"), { description: error instanceof Error ? error.message : t("common.tryAgain") });
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && user) {
    return null;
  }

  return (
    <AuthLayout
      eyebrow={t("auth.newStandard")}
      title={
        <>
          {t("auth.welcomeToThe")} <span className="text-teal">QYVERO</span> {t("auth.family")}.
        </>
      }
      subtitle={t("auth.signUpSubtitle")}
      side={<AuthSideVisual variant="signup" />}
    >
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.4em] text-teal">
          {t("auth.createAccount")}
        </p>
        <h1 className="mt-3 text-display text-3xl font-light text-foreground">
          {t("brand.tagline")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.alreadyHaveAccount")} {" "}
          <Link
            to="/auth/signin"
            className="text-foreground underline-offset-4 hover:underline"
          >
            {t("auth.signIn")}
          </Link>
          .
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label={t("auth.firstName")}
            placeholder="John"
            autoComplete="given-name"
            icon={<User />}
            value={form.firstName}
            onChange={(e) => update("firstName")(e.target.value)}
            error={errors.firstName}
          />
          <TextField
            label={t("auth.lastName")}
            placeholder="Doe"
            autoComplete="family-name"
            icon={<User />}
            value={form.lastName}
            onChange={(e) => update("lastName")(e.target.value)}
            error={errors.lastName}
          />
        </div>

        <TextField
          label={t("auth.username")}
          placeholder="johndoe"
          autoComplete="username"
          icon={<AtSign />}
          value={form.username}
          onChange={(e) => update("username")(e.target.value)}
          error={errors.username}
        />

        <TextField
          label={t("auth.email")}
          type="email"
          placeholder="you@qyvero.com"
          autoComplete="email"
          icon={<Mail />}
          value={form.email}
          onChange={(e) => update("email")(e.target.value)}
          error={errors.email}
        />

        <TextField
          label={t("auth.phone")}
          placeholder="+20 123 456 789"
          autoComplete="tel"
          icon={<Phone />}
          value={form.phone}
          onChange={(e) => update("phone")(e.target.value)}
          error={errors.phone}
        />

        <TextField
          label={t("auth.password")}
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          icon={<Lock />}
          value={form.password}
          onChange={(e) => update("password")(e.target.value)}
          error={errors.password}
        />

        <TextField
          label={t("auth.confirmPassword")}
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          icon={<Lock />}
          value={form.confirm}
          onChange={(e) => update("confirm")(e.target.value)}
          error={errors.confirm}
        />

        <label className="mt-2 flex items-start gap-3 text-sm text-muted-foreground select-none cursor-pointer">
          <input
            type="checkbox"
            checked={form.terms}
            onChange={(e) => update("terms")(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 accent-[color:var(--color-teal)]"
          />
          <span className="leading-tight">
            {t("auth.agreeToThe")} {" "}
            <Link to="/" className="text-foreground underline underline-offset-2">
              {t("auth.termsOfService")}
            </Link>{" "}
            {t("auth.and")} {" "}
            <Link to="/" className="text-foreground underline underline-offset-2">
              {t("legal.privacyTitle")}
            </Link>
            .
          </span>
        </label>
        {errors.terms && <p className="text-[11px] text-red-500">{errors.terms}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-background transition-all hover:bg-foreground/90 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {submitting ? t("auth.creatingAccount") : t("auth.createAccount")}
        </button>

        <div className="my-1 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          <span className="h-px flex-1 bg-white/10" />
          {t("auth.or")}
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <GoogleButton />
      </form>
    </AuthLayout>
  );
}
