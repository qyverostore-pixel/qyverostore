import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/providers/AuthProvider";

export function WishlistPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { data: wishlist = [], isLoading, isError, refetch } = useWishlist(Boolean(user));
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/signin", replace: true });
  }, [loading, user, navigate]);
  if (loading || !user)
    return (
      <main className="grid min-h-screen place-items-center bg-noise">
        <div className="size-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </main>
    );
  const items = wishlist.filter((item) => item.product);
  return (
    <main className="min-h-screen bg-noise pb-24 pt-12 sm:pb-32">
      <section className="mx-auto max-w-7xl px-6 pt-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.35em] text-foreground/85">
          <Heart className="size-3 text-teal" />
          Member Space
        </span>
        <h1 className="text-display mt-6 text-4xl font-light leading-none sm:text-5xl">
          My <span className="italic text-teal">Wishlist.</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your saved QYVERO essentials, ready whenever you are.
        </p>
        {isLoading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/[0.025]"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.025] p-10 text-center">
            <h2 className="text-display text-2xl">We couldn't load your wishlist.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
            <Button className="mt-5" onClick={() => void refetch()}>
              Try Again
            </Button>
          </div>
        ) : items.length ? (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const product = item.product!;
              const image = product.images[0];
              return (
                <article
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition hover:-translate-y-1 hover:border-white/25"
                >
                  <div className="relative aspect-[4/3] bg-neutral-950">
                    {image ? (
                      <img
                        src={image.image_url}
                        alt={image.alt_text ?? product.name}
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-display text-4xl text-white/10">
                        QY
                      </span>
                    )}
                    <WishlistButton
                      product={product}
                      className="absolute right-3 top-3 grid size-9 rounded-full bg-background/75 text-foreground backdrop-blur hover:bg-background"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-teal">
                      {product.category?.name ?? "Collection"}
                    </p>
                    <h2 className="text-display mt-2 text-lg font-medium">{product.name}</h2>
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-300">
                      <Star className="size-3.5 fill-current" />
                      {Number(product.rating).toFixed(1)}
                    </div>
                    <p className="mt-3 text-base font-semibold text-teal">
                      {Number(product.price)} EGP
                    </p>
                    <div className="mt-5 grid gap-2">
                      <Link
                        to="/products/$productId"
                        params={{ productId: product.slug }}
                        className="rounded-full border border-white/15 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.16em] transition hover:border-teal hover:text-teal"
                      >
                        View Details
                      </Link>
                      <Button onClick={() => addItem(product, 1)}>
                        <ShoppingBag />
                        Add to Cart
                      </Button>
                      <WishlistButton
                        product={product}
                        showLabel
                        className="rounded-full px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-red-300"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.025] p-10 text-center sm:p-14">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-teal/20 bg-teal/10 text-teal">
              <Heart className="size-7" />
            </div>
            <h2 className="text-display mt-6 text-2xl">No saved products</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Save the pieces you love and return to them whenever you're ready.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/products">Explore Products</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
