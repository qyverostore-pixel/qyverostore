import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { AuthLayout, AuthSideVisual } from "@/components/auth-layout";
import { TextField } from "@/components/text-field";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password - QYVERO" },
      {
        name: "description",
        content: "Reset your QYVERO account password.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email");
      return;
    }

    setSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        toast.error("Unable to send recovery email", { description: resetError.message });
        return;
      }
      toast.success("Recovery link sent", { description: "Please check your inbox to reset your password." });
      setEmail("");
    } catch (error) {
      toast.error("Unable to send recovery email", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Account Recovery"
      title="Access your collection."
      subtitle="Request a secure password reset link to recover your QYVERO account."
      side={<AuthSideVisual variant="signin" />}
    >
      <div className="glass-card rounded-3xl p-8 sm:p-10">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-teal">
            Recovery
          </p>
          <h1 className="mt-3 text-display text-3xl font-light text-foreground">
            Forgot Password?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send you a recovery link.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <TextField
            label="Email"
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
            {submitting ? "Sending Link…" : "Send Reset Link"}
          </button>

          <div className="mt-4 text-center">
            <Link
              to="/auth/signin"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
