import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useWishlist, useWishlistToggle } from "@/hooks/use-wishlist";
import type { StoreProduct } from "@/services/products";

export function WishlistButton({
  product,
  className,
  showLabel = false,
}: {
  product: StoreProduct;
  className?: string;
  showLabel?: boolean;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: wishlist = [] } = useWishlist(Boolean(user));
  const saved = wishlist.some((item) => item.product_id === product.id);
  const toggle = useWishlistToggle(product);
  const handleClick = () => {
    if (!user) {
      navigate({ to: "/auth/signin" });
      return;
    }
    toggle.toggle();
  };
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      onClick={handleClick}
      disabled={toggle.isPending}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition hover:text-teal disabled:opacity-60",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current text-teal")} />
      {showLabel && <span>{saved ? "Saved" : "Save to wishlist"}</span>}
    </button>
  );
}
