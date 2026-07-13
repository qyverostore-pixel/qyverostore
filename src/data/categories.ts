import type { Category, CategoryDefinition } from "@/types";

export const categories: CategoryDefinition[] = [
  { name: "Wallets" },
  { name: "Watches" },
  { name: "Belts" },
  { name: "Perfumes" },
  { name: "Cross Bags" },
  { name: "Accessories" },
  { name: "Tech", soon: true },
];

export const productCategoryFilters: Array<Category | "All Products"> = [
  "All Products",
  ...categories.map(({ name }) => name),
];

export const footerCategories = categories.map(({ name, soon }) => `${name}${soon ? " — Coming Soon" : ""}`);
