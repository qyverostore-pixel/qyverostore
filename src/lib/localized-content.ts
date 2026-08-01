import type { StoreCategory, StoreProduct } from "@/services/products";
import type { Language } from "@/i18n/translations";

export const localizedProductName = (
  product: Pick<StoreProduct, "name" | "name_en" | "name_ar">,
  language: Language,
) =>
  language === "ar"
    ? product.name_ar || product.name_en || product.name
    : product.name_en || product.name;
export const localizedProductDescription = (
  product: Pick<StoreProduct, "description" | "description_en" | "description_ar">,
  language: Language,
) =>
  language === "ar"
    ? product.description_ar || product.description_en || product.description
    : product.description_en || product.description;
export const localizedCategoryName = (
  category: Pick<StoreCategory, "name" | "name_en" | "name_ar">,
  language: Language,
) =>
  language === "ar"
    ? category.name_ar || category.name_en || category.name
    : category.name_en || category.name;
export const localizedCategoryDescription = (
  category: Pick<StoreCategory, "description" | "description_en" | "description_ar">,
  language: Language,
) =>
  language === "ar"
    ? category.description_ar || category.description_en || category.description
    : category.description_en || category.description;
