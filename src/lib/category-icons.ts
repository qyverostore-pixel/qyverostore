import {
  BriefcaseBusiness,
  Dumbbell,
  Gift,
  Handbag,
  Headphones,
  Laptop,
  type LucideIcon,
  Monitor,
  Mouse,
  Package,
  ShoppingBag,
  Shirt,
  Sparkles,
  Watch,
  Wallet,
  Waves,
} from "lucide-react";

/** Resolves the icon values stored in Supabase to their storefront icon. */
const categoryIconMap: Record<string, LucideIcon> = {
  wallet: Wallet,
  wallets: Wallet,
  watch: Watch,
  watches: Watch,
  gift: Gift,
  gifts: Gift,
  "for-her-gifts": Gift,
  dumbbell: Dumbbell,
  gym: Dumbbell,
  fitness: Dumbbell,
  headphones: Headphones,
  headphone: Headphones,
  earbuds: Headphones,
  briefcase: BriefcaseBusiness,
  bag: Handbag,
  bags: Handbag,
  crossbag: Handbag,
  "cross-bags": Handbag,
  shoppingbag: ShoppingBag,
  shirt: Shirt,
  clothing: Shirt,
  apparel: Shirt,
  socks: Waves,
  perfume: Sparkles,
  perfumes: Sparkles,
  fragrance: Sparkles,
  monitor: Monitor,
  laptop: Laptop,
  mouse: Mouse,
  tech: Laptop,
  accessories: Package,
  accessory: Package,
  belt: Package,
  belts: Package,
};

const normaliseIconName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

/** Returns the category's stored icon, with one neutral fallback for unknown values. */
export function getCategoryIcon(iconName?: string | null, slug?: string): LucideIcon {
  const candidates = [iconName, slug].filter((value): value is string => Boolean(value?.trim()));

  for (const candidate of candidates) {
    const key = normaliseIconName(candidate);
    const compactKey = key.replace(/-/g, "");
    const exactMatch = categoryIconMap[key] ?? categoryIconMap[compactKey];
    if (exactMatch) return exactMatch;

    const keywordMatch = Object.entries(categoryIconMap).find(([name]) => key.includes(name))?.[1];
    if (keywordMatch) return keywordMatch;
  }

  return Package;
}
