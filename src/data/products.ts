import type { Product } from "@/types";

export const homeProducts: Product[] = [
  { id: 1, name: "Bifold Leather Wallet", category: "Wallets", price: 89, tone: "from-neutral-800 to-neutral-950" },
  { id: 2, name: "Chrono Steel 42mm", category: "Watches", price: 349, tone: "from-teal/25 to-neutral-950" },
  { id: 3, name: "Signature Belt — Onyx", category: "Belts", price: 79, tone: "from-neutral-700 to-neutral-950" },
  { id: 4, name: "Noir Eau de Parfum", category: "Perfumes", price: 129, tone: "from-amber-900/40 to-neutral-950" },
  { id: 5, name: "Urban Cross Bag", category: "Cross Bags", price: 149, tone: "from-neutral-800 to-neutral-950" },
  { id: 6, name: "Minimal Card Holder", category: "Accessories", price: 49, tone: "from-neutral-900 to-neutral-950" },
  { id: 7, name: "Wireless Earbuds Pro", category: "Tech", price: 199, tone: "from-teal/20 to-neutral-950" },
  { id: 8, name: "Aviator Sunglasses", category: "Accessories", price: 119, tone: "from-neutral-800 to-neutral-950" },
];

export const products: Product[] = [
  { id: 1, name: "Bifold Leather Wallet", category: "Wallets", price: 89, rating: 4.9, reviews: 32, tone: "from-stone-700 to-neutral-950", accent: "bg-amber-200/20" },
  { id: 2, name: "Chrono Steel 42mm", category: "Watches", price: 349, rating: 4.8, reviews: 24, tone: "from-teal/30 to-neutral-950", accent: "bg-teal/30" },
  { id: 3, name: "Signature Belt — Onyx", category: "Belts", price: 79, rating: 4.7, reviews: 18, tone: "from-neutral-600 to-neutral-950", accent: "bg-white/15" },
  { id: 4, name: "Noir Eau de Parfum", category: "Perfumes", price: 129, rating: 4.9, reviews: 51, tone: "from-amber-900/50 to-neutral-950", accent: "bg-amber-500/25" },
  { id: 5, name: "Urban Cross Bag", category: "Cross Bags", price: 149, rating: 4.8, reviews: 29, tone: "from-neutral-800 to-neutral-950", accent: "bg-white/10" },
  { id: 6, name: "Minimal Card Holder", category: "Accessories", price: 49, rating: 4.6, reviews: 16, tone: "from-stone-800 to-neutral-950", accent: "bg-stone-300/20" },
  { id: 7, name: "Wireless Earbuds Pro", category: "Tech", price: 199, rating: 4.8, reviews: 43, tone: "from-teal/25 to-neutral-950", accent: "bg-teal/25" },
  { id: 8, name: "Aviator Sunglasses", category: "Accessories", price: 119, rating: 4.7, reviews: 36, tone: "from-neutral-700 to-neutral-950", accent: "bg-white/20" },
  { id: 9, name: "Saffiano Zip Wallet", category: "Wallets", price: 99, rating: 4.9, reviews: 22, tone: "from-rose-950/45 to-neutral-950", accent: "bg-rose-300/15" },
  { id: 10, name: "Essential Link Watch", category: "Watches", price: 279, rating: 4.7, reviews: 14, tone: "from-slate-600 to-neutral-950", accent: "bg-slate-200/20" },
  { id: 11, name: "Midnight Leather Belt", category: "Belts", price: 69, rating: 4.6, reviews: 20, tone: "from-neutral-700 to-black", accent: "bg-white/10" },
  { id: 12, name: "Pulse Charging Stand", category: "Tech", price: 109, rating: 4.8, reviews: 27, tone: "from-cyan-950/70 to-neutral-950", accent: "bg-cyan-300/20" },
];

export const productDetails: Record<string, Product> = {
  "1": { id: "1", name: "Bifold Leather Wallet", category: "Wallets", price: 699, oldPrice: 850, rating: 4.9, reviews: 32, description: "A quietly refined everyday essential, crafted to carry only what matters. Its slim silhouette slips into a pocket with effortless ease.", material: "Full-grain leather", dimensions: "11 × 9 × 1.5 cm", color: "Obsidian black" },
};

export const fallbackProductDetail: Product = { id: "product", name: "Signature Leather Wallet", category: "Wallets", price: 699, oldPrice: 850, rating: 4.9, reviews: 32, description: "A quietly refined everyday essential, crafted to carry only what matters. Its slim silhouette slips into a pocket with effortless ease.", material: "Full-grain leather", dimensions: "11 × 9 × 1.5 cm", color: "Obsidian black" };

export const productGalleryTones = ["from-stone-500 via-neutral-800 to-neutral-950", "from-amber-950/70 via-stone-800 to-neutral-950", "from-neutral-600 via-neutral-900 to-black", "from-stone-700 via-neutral-950 to-black"];

export const relatedProducts = ["Minimal Card Holder", "Saffiano Zip Wallet", "Signature Belt — Onyx", "Urban Cross Bag"];
export const relatedProductPrices = [499, 749, 599, 1_199];
