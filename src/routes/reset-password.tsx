import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { AuthLayout, AuthSideVisual } from "@/components/auth-layout";
import { TextField } from "@/components/text-field";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password - QYVERO" },
      {
        name: "description",
        content: "Set a new password for your QYVERO account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};

    if (password.length < 8) {
      e.password = "Password must be at least 8 characters";
    }
    if (confirm !== password) {
      e.confirm = "Passwords do not match";
    }

    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Unable to update password", { description: error.message });
        return;
      }
      toast.success("Password updated successfully", { description: "You can now sign in with your new password." });
      navigate({ to: "/auth/signin" });
    } catch (error) {
      toast.error("Unable to update password", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Account Security"
      title="Secure your style."
      subtitle="Choose a new password for your QYVERO account. Make it strong and unique."
      side={<AuthSideVisual variant="signin" />}
    >
      <div className="glass-card rounded-3xl p-8 sm:p-10">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-teal">
            Security
          </p>
          <h1 className="mt-3 text-display text-3xl font-light text-foreground">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <TextField
            label="New Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            icon={<Lock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <TextField
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            icon={<Lock />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-background transition-all hover:bg-foreground/90 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Updating Password…" : "Reset Password"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
