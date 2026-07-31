import { createFileRoute } from "@tanstack/react-router";
import { WishlistPage } from "@/components/wishlist/WishlistPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/wishlist")({
  head: () =>
    seoHead({
      title: "Your Wishlist",
      description: "Your saved QYVERO products.",
      path: "/wishlist",
      robots: "noindex,nofollow",
    }),
  component: WishlistPage,
});
