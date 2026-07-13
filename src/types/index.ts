import type { ElementType, SVGProps } from "react";

export type IconComponent = ElementType<SVGProps<SVGSVGElement>>;

export type Category = "Wallets" | "Watches" | "Belts" | "Perfumes" | "Cross Bags" | "Accessories" | "Tech";

export interface Product {
  id: number | string;
  name: string;
  category: Category;
  price: number;
  rating?: number;
  reviews?: number;
  tone?: string;
  accent?: string;
  oldPrice?: number;
  description?: string;
  material?: string;
  dimensions?: string;
  color?: string;
}

export interface CategoryDefinition {
  name: Category;
  soon?: boolean;
}

export interface Company {
  name: string;
  tagline: string;
  description: string;
  email: string;
  whatsappNumber: string;
  foundedYear: number;
}

export interface SocialLink {
  label: string;
  href: string;
  handle?: string;
  Icon?: IconComponent;
}
