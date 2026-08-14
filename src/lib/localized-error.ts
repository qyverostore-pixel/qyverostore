import type { TranslationKey } from "@/i18n/translations";

type Translate = (key: TranslationKey) => string;

/** Converts implementation-specific auth/backend failures into safe storefront copy. */
export function localizedError(error: unknown, t: Translate, fallback: TranslationKey = "common.tryAgain") {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("invalid login credentials")) return t("auth.invalidCredentials");
  if (message.includes("already registered") || message.includes("already been registered")) return t("auth.emailRegistered");
  if (message.includes("email not confirmed")) return t("auth.emailNotConfirmed");
  if (message.includes("password") && (message.includes("weak") || message.includes("short"))) return t("auth.weakPassword");
  if (message.includes("rate limit") || message.includes("too many requests")) return t("errors.rateLimited");
  if (message.includes("network") || message.includes("failed to fetch")) return t("errors.network");
  if (message.includes("jwt") || message.includes("session") || message.includes("unauthorized") || message.includes("not authenticated")) return t("errors.sessionExpired");
  return t(fallback);
}
