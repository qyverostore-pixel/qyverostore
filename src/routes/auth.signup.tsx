import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, Lock, User, AtSign, Phone } from "lucide-react";
import { AuthLayout, AuthSideVisual } from "@/components/auth-layout";
import { TextField } from "@/components/text-field";
import { GoogleButton } from "@/components/google-button";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: [
      { title: "Create your QYVERO account" },
      {
        name: "description",
        content:
          "Join QYVERO — a modern men's lifestyle brand built for quality, style and everyday essentials.",
      },
      { property: "og:title", content: "Create your QYVERO account" },
      {
        property: "og:description",
        content: "Own your style. Sign up for QYVERO today.",
      },
    ],
  }),
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

  const update =
    <K extends keyof typeof form>(k: K) =>
    (v: (typeof form)[K]) =>
      setForm((f) => ({ ...f, [k]: v }));

  function validate(): Errors {
    const e: Errors = {};
    if (form.firstName.trim().length < 2) e.firstName = "Enter your first name";
    if (form.lastName.trim().length < 2) e.lastName = "Enter your last name";
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(form.username))
      e.username = "3–20 chars, letters, numbers, . or _";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!/^[+\d][\d\s-]{6,}$/.test(form.phone))
      e.phone = "Enter a valid phone number";
    if (form.password.length < 8) e.password = "At least 8 characters";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    if (!form.terms) e.terms = "You must accept to continue";
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    // TODO: connect Supabase auth here
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    navigate({ to: "/" });
  }

  return (
    <AuthLayout
      eyebrow="A New Standard"
      title={
        <>
          Welcome to the <span className="text-teal">QYVERO</span> family.
        </>
      }
      subtitle="Create an account to shop premium essentials, track orders and unlock member-only drops."
      side={<AuthSideVisual variant="signup" />}
    >
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.4em] text-teal">
          Create account
        </p>
        <h1 className="mt-3 text-display text-3xl font-light text-foreground">
          Own your style.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/auth/signin"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
          .
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="First name"
            placeholder="John"
            autoComplete="given-name"
            icon={<User />}
            value={form.firstName}
            onChange={(e) => update("firstName")(e.target.value)}
            error={errors.firstName}
          />
          <TextField
            label="Last name"
            placeholder="Doe"
            autoComplete="family-name"
            icon={<User />}
            value={form.lastName}
            onChange={(e) => update("lastName")(e.target.value)}
            error={errors.lastName}
          />
        </div>

        <TextField
          label="Username"
          placeholder="johndoe"
          autoComplete="username"
          icon={<AtSign />}
          value={form.username}
          onChange={(e) => update("username")(e.target.value)}
          error={errors.username}
        />
        <TextField
          label="Email address"
          type="email"
          placeholder="you@qyvero.com"
          autoComplete="email"
          icon={<Mail />}
          value={form.email}
          onChange={(e) => update("email")(e.target.value)}
          error={errors.email}
        />
        <TextField
          label="Phone number"
          type="tel"
          placeholder="+20 150 596 7144"
          autoComplete="tel"
          icon={<Phone />}
          value={form.phone}
          onChange={(e) => update("phone")(e.target.value)}
          error={errors.phone}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            icon={<Lock />}
            value={form.password}
            onChange={(e) => update("password")(e.target.value)}
            error={errors.password}
          />
          <TextField
            label="Confirm"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            icon={<Lock />}
            value={form.confirm}
            onChange={(e) => update("confirm")(e.target.value)}
            error={errors.confirm}
          />
        </div>

        <label className="mt-1 flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={form.terms}
            onChange={(e) => update("terms")(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 accent-[color:var(--color-teal)]"
          />
          <span>
            I agree to the{" "}
            <a className="text-foreground underline-offset-4 hover:underline" href="#">
              Terms
            </a>{" "}
            &{" "}
            <a className="text-foreground underline-offset-4 hover:underline" href="#">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {errors.terms && (
          <p className="-mt-2 text-xs text-destructive">{errors.terms}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-background transition-all hover:bg-foreground/90 active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create account"}
        </button>

        <div className="my-1 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <GoogleButton />
      </form>
    </AuthLayout>
  );
}
