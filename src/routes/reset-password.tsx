import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { AuthLayout, AuthSideVisual } from "@/components/auth-layout";
import { TextField } from "@/components/text-field";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useLocale } from "@/providers/LocaleProvider";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  head: () => seoHead({ title: "Reset password", description: "Set a new password for your QYVERO account.", path: "/reset-password", robots: "noindex,nofollow" }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLocale();

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};

    if (password.length < 8) {
      e.password = t("auth.minPassword");
    }
    if (confirm !== password) {
      e.confirm = t("auth.passwordsMatch");
    }

    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(t("auth.unableToUpdate"), { description: error.message });
        return;
      }
      toast.success(t("auth.passwordUpdated"), { description: t("auth.passwordUpdatedDescription") });
      navigate({ to: "/auth/signin" });
    } catch (error) {
      toast.error(t("auth.unableToUpdate"), { description: error instanceof Error ? error.message : t("common.tryAgain") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow={t("auth.accountSecurity")}
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetSubtitle")}
      side={<AuthSideVisual variant="signin" />}
    >
      <div className="glass-card rounded-3xl p-8 sm:p-10">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-teal">
            {t("auth.security")}
          </p>
          <h1 className="mt-3 text-display text-3xl font-light text-foreground">
            {t("auth.resetPassword")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.enterNewPassword")}
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <TextField
            label={t("auth.newPassword")}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            icon={<Lock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <TextField
            label={t("auth.confirmPassword")}
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
            {submitting ? t("auth.updatingPassword") : t("auth.resetPassword")}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
