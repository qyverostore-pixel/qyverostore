import { createFileRoute } from "@tanstack/react-router";
import { CartPage } from "@/components/cart/CartPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/cart")({ head: () => seoHead({ title: "Your Cart", description: "Review the items in your QYVERO cart.", path: "/cart", robots: "noindex,nofollow" }), component: CartPage });
