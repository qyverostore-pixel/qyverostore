import { supabase } from "@/lib/supabase";

export type StorefrontSettings = {
  whatsapp: string;
  email: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
};

export const storefrontSettingsKey = ["storefront", "settings"] as const;

export const defaultStorefrontSettings: StorefrontSettings = {
  whatsapp: "",
  email: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",
};

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("whatsapp,email,facebook,instagram,tiktok,youtube")
    .eq("id", true)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    whatsapp: data?.whatsapp?.trim() || "",
    email: data?.email?.trim() || "",
    facebook: data?.facebook?.trim() || "",
    instagram: data?.instagram?.trim() || "",
    tiktok: data?.tiktok?.trim() || "",
    youtube: data?.youtube?.trim() || "",
  };
}

export function whatsappUrl(value: string, message?: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  const base = /^https?:\/\//i.test(normalized) ? normalized : `https://wa.me/${normalized.replace(/\D/g, "")}`;
  return message ? `${base}${base.includes("?") ? "&" : "?"}text=${encodeURIComponent(message)}` : base;
}

export function emailUrl(value: string) {
  const normalized = value.trim();
  return normalized ? (normalized.startsWith("mailto:") ? normalized : `mailto:${normalized}`) : "";
}

export function externalUrl(value: string) {
  return /^https?:\/\//i.test(value.trim()) ? value.trim() : "";
}