import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, Lock } from "lucide-react";
import { AuthLayout, AuthSideVisual } from "@/components/auth-layout";
import { TextField } from "@/components/text-field";
import { GoogleButton } from "@/components/google-button";

export const Route = createFileRoute("/auth/signin")({
  head: () => ({
    meta: [
      { title: "Sign in to QYVERO" },
      {
        name: "description",
        content: "Access your QYVERO account. Own your style.",
      },
      { property: "og:title", content: "Sign in to QYVERO" },
      {
        property: "og:description",
        content: "Access your QYVERO account. Own your style.",
      },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (form.password.length < 8) e.password = "At least 8 characters";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    // TODO: connect Supabase auth here
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    navigate({ to: "/" });
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title={
        <>
          Leave your <span className="text-teal">impression</span>.
        </>
      }
      subtitle="Sign in to continue shopping premium essentials curated for the modern gentleman."
      side={<AuthSideVisual variant="signin" />}
    >
      <div className="glass-card rounded-3xl p-8 sm:p-10">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-teal">
            Sign in
          </p>
          <h1 className="mt-3 text-display text-3xl font-light text-foreground">
            Welcome back.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            New to QYVERO?{" "}
            <Link
              to="/auth/signup"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Create one
            </Link>
            .
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <TextField
            label="Email"
            type="email"
            placeholder="you@qyvero.com"
            autoComplete="email"
            icon={<Mail />}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
          />
          <TextField
            label="Password"
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
              Remember me
            </label>
            <a
              href="#"
              className="text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-background transition-all hover:bg-foreground/90 active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Login"}
          </button>

          <div className="my-1 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <GoogleButton />
        </form>
      </div>
    </AuthLayout>
  );
}
