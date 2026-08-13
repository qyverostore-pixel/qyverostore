import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, MessageCircle, Minus, Plus, Star, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductDetailsSkeleton } from "@/components/ui/loading-skeletons";
import { cn } from "@/lib/utils";
import { useProduct, useRelatedProducts } from "@/hooks/use-products";
import {
  getDefaultVariant,
  getEffectivePrice,
  getEffectiveStock,
  type ProductVariant,
  type StoreProduct,
} from "@/services/products";
import { useCart } from "@/hooks/use-cart";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { ReviewsSection } from "@/components/products/ReviewsSection";
import { Seo, breadcrumbSchema, productSchema } from "@/lib/seo";
import { useLocale } from "@/providers/LocaleProvider";
import {
  localizedCategoryName,
  localizedProductDescription,
  localizedProductName,
} from "@/lib/localized-content";

// Product images and variant images differ in their foreign key
// (product_id vs variant_id), but the gallery only ever needs these three
// fields, so it can render whichever list is passed in.
type GalleryImage = { id: string; image_url: string; alt_text: string | null };
function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const { t } = useLocale();
  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950">
        {images[selected] ? (
          <img
            src={images[selected].image_url}
            alt={images[selected].alt_text ?? name}
            fetchPriority="high"
            decoding="async"
            sizes="(min-width: 1024px) 55vw, 100vw"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <span className="grid h-full place-items-center text-display text-6xl font-light text-white/10">
            QY
          </span>
        )}
        <span className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-foreground/75 opacity-0 backdrop-blur transition group-hover:opacity-100">
          {t("product.hoverToZoom")}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setSelected(index)}
            aria-label={`${t("product.viewImage")} ${index + 1}`}
            className={cn(
              "aspect-square overflow-hidden rounded-2xl border transition",
              selected === index
                ? "border-teal ring-2 ring-teal/25"
                : "border-white/10 hover:border-white/30",
            )}
          >
            <img
              src={image.image_url}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
function Rating({ product }: { product: StoreProduct }) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5 text-amber-300" aria-label={`${product.rating} ${t("product.ratingOutOfFive")}`}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <span className="text-sm font-medium text-foreground">
        {Number(product.rating).toFixed(1)}
      </span>
      <span className="text-sm text-muted-foreground">({product.reviews_count} {t("product.reviewsCount")})</span>
    </div>
  );
}
function QuantitySelector({
  quantity,
  max,
  onChange,
}: {
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="flex h-12 w-36 items-center justify-between rounded-full border border-white/15 bg-white/[0.02] px-2">
      <button
        type="button"
        aria-label={t("product.decreaseQuantity")}
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="grid h-8 w-8 place-items-center rounded-full text-foreground/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold tabular-nums">{quantity}</span>
      <button
        type="button"
        aria-label={t("product.increaseQuantity")}
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="grid h-8 w-8 place-items-center rounded-full text-foreground/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
function VariantSelector({
  variants,
  selected,
  onSelect,
}: {
  variants: ProductVariant[];
  selected: ProductVariant | null;
  onSelect: (variant: ProductVariant) => void;
}) {
  const { t } = useLocale();
  const colors = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const variant of variants) {
      const color = variant.color?.trim();
      if (color && !seen.has(color)) {
        seen.add(color);
        list.push(color);
      }
    }
    return list;
  }, [variants]);

  const sizes = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const variant of variants) {
      const size = variant.size?.trim();
      if (size && !seen.has(size)) {
        seen.add(size);
        list.push(size);
      }
    }
    return list;
  }, [variants]);

  if (colors.length < 2 && sizes.length < 2) return null;

  const selectColor = (color: string) => {
    const candidates = variants.filter((variant) => variant.color === color);
    const keepSize = candidates.find((variant) => variant.size === selected?.size);
    const withStock = candidates.find((variant) => variant.stock > 0);
    const next = keepSize ?? withStock ?? candidates[0];
    if (next) onSelect(next);
  };

  const selectSize = (size: string) => {
    if (!selected) return;
    const match = variants.find(
      (variant) => variant.color === selected.color && variant.size === size,
    );
    if (match) onSelect(match);
  };

  return (
    <div className="mt-7 space-y-6">
      {colors.length >= 2 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("product.color")}
            {selected?.color ? <span className="text-foreground"> — {selected.color}</span> : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {colors.map((color) => {
              const active = selected?.color === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => selectColor(color)}
                  aria-pressed={active}
                  aria-label={`${t("product.selectColor")} ${color}`}
                  title={color}
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full border-2 transition",
                    active
                      ? "border-teal ring-2 ring-teal/25"
                      : "border-white/15 hover:border-white/40",
                  )}
                >
                  <span
                    className="h-7 w-7 rounded-full border border-white/20"
                    style={{ backgroundColor: color }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
      {sizes.length >= 2 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("product.size")}
            {selected?.size ? <span className="text-foreground"> — {selected.size}</span> : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((size) => {
              const match = variants.find(
                (variant) => variant.color === selected?.color && variant.size === size,
              );
              const available = Boolean(match);
              const active = available && selected?.size === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!available}
                  onClick={() => selectSize(size)}
                  aria-pressed={active}
                  className={cn(
                    "min-w-11 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                    !available &&
                      "cursor-not-allowed border-white/5 text-muted-foreground/30 line-through",
                    available && active && "border-teal bg-teal/10 text-teal",
                    available &&
                      !active &&
                      "border-white/15 text-foreground/80 hover:border-white/40",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
function OrderActions({
  product,
  variant,
  quantity,
  compact = false,
  inStock,
}: {
  product: StoreProduct;
  variant: ProductVariant | null;
  quantity: number;
  compact?: boolean;
  inStock: boolean;
}) {
  const { addItem, startBuyNow } = useCart();
  const { t } = useLocale();
  const addToCart = () => {
    if (addItem(product, quantity, variant)) toast.success(t("cart.added"));
  };
  const buyNow = () => startBuyNow(product, quantity, variant);
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-[1fr_auto]")}>
      {inStock ? (
        <button type="button" onClick={addToCart} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-xs font-semibold uppercase tracking-[0.18em] text-background transition hover:bg-foreground/90">
          <MessageCircle className="h-4 w-4" />
          {t("cart.addToCart")}
        </button>
      ) : (
        <span className="inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/10 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("product.outOfStock")}
        </span>
      )}
      {inStock && <Link to="/checkout" onClick={buyNow} className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-teal hover:text-teal">{t("cart.buyNow")}</Link>}
      {!compact && (
        <WishlistButton
          product={product}
          showLabel
          className="h-12 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:border-teal"
        />
      )}
    </div>
  );
}
function ProductTabs({ product }: { product: StoreProduct }) {
  const { language, t } = useLocale();
  const dimensions = [product.length, product.width, product.height]
    .filter((value) => value != null)
    .join(" × ");
  return (
    <Tabs defaultValue="description" className="mt-20 border-t border-white/10 pt-8 sm:mt-28">
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0">
        <TabsTrigger
          value="description"
          className="rounded-full border border-transparent px-4 py-2.5 text-xs data-[state=active]:border-white/15 data-[state=active]:bg-white/[0.05]"
        >
          {t("product.description")}
        </TabsTrigger>
        <TabsTrigger
          value="specifications"
          className="rounded-full border border-transparent px-4 py-2.5 text-xs data-[state=active]:border-white/15 data-[state=active]:bg-white/[0.05]"
        >
          {t("product.specifications")}
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="rounded-full border border-transparent px-4 py-2.5 text-xs data-[state=active]:border-white/15 data-[state=active]:bg-white/[0.05]"
        >
          {t("product.reviews")}
        </TabsTrigger>
        <TabsTrigger
          value="shipping"
          className="rounded-full border border-transparent px-4 py-2.5 text-xs data-[state=active]:border-white/15 data-[state=active]:bg-white/[0.05]"
        >
          {t("product.shipping")}
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="description"
        className="max-w-2xl py-7 text-sm leading-7 text-muted-foreground"
      >
        {localizedProductDescription(product, language) || product.short_description}
      </TabsContent>
      <TabsContent value="specifications" className="py-7">
        <dl className="grid max-w-2xl grid-cols-1 divide-y divide-white/10 text-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="py-4 sm:px-5 sm:first:pl-0">
            <dt className="text-muted-foreground">{t("product.brand")}</dt>
            <dd className="mt-1 text-foreground">{product.brand || "QYVERO"}</dd>
          </div>
          <div className="py-4 sm:px-5">
            <dt className="text-muted-foreground">{t("product.dimensions")}</dt>
            <dd className="mt-1 text-foreground">{dimensions || t("product.notSpecified")}</dd>
          </div>
          <div className="py-4 sm:px-5 sm:pl-0">
            <dt className="text-muted-foreground">{t("product.weight")}</dt>
            <dd className="mt-1 text-foreground">
              {product.weight ? `${product.weight} kg` : t("product.notSpecified")}
            </dd>
          </div>
          <div className="py-4 sm:px-5">
            <dt className="text-muted-foreground">{t("product.care")}</dt>
            <dd className="mt-1 text-foreground">{t("product.wipeClean")}</dd>
          </div>
        </dl>
      </TabsContent>
      <TabsContent value="reviews">
        <ReviewsSection productId={product.id} />
      </TabsContent>
      <TabsContent value="shipping" className="py-7 text-sm leading-7 text-muted-foreground">
        {t("product.shippingDescription")}
      </TabsContent>
    </Tabs>
  );
}
function RelatedCard({ product }: { product: StoreProduct }) {
  const { language, t } = useLocale();
  const name = localizedProductName(product, language);
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition hover:-translate-y-1 hover:border-white/25">
      <div className="aspect-[4/3] bg-neutral-950">
        {product.images[0] && (
          <img
            src={product.images[0].image_url}
            alt={name}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-teal">
          {product.category ? localizedCategoryName(product.category, language) : t("product.collection")}
        </p>
        <h3 className="text-display mt-2 text-base font-medium">{name}</h3>
        <p className="mt-1 text-sm font-semibold text-teal">{product.price} EGP</p>
        <Link
          to="/products/$productId"
          params={{ productId: product.slug }}
          className="mt-4 inline-flex text-xs font-medium text-foreground/75 transition hover:text-teal"
        >
          {t("product.viewProduct")} <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
export function ProductDetailsPage({ productId }: { productId: string }) {
  const { data: product, isLoading } = useProduct(productId);
  const { data: related = [] } = useRelatedProducts(product ?? null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const { language, t } = useLocale();

  // Auto-select the default variant whenever a (new) product loads. For a
  // product that only has its auto-created default variant, this resolves
  // to the same price/stock/images the page already showed before variants
  // existed, so nothing changes visually.
  useEffect(() => {
    setSelectedVariantId(product ? (getDefaultVariant(product)?.id ?? null) : null);
  }, [product?.id]);

  const activeVariants = useMemo(
    () => product?.variants.filter((variant) => variant.is_active) ?? [],
    [product],
  );
  const selectedVariant =
    activeVariants.find((variant) => variant.id === selectedVariantId) ??
    (product ? getDefaultVariant(product) : null);
  const effectivePrice = product ? getEffectivePrice(product, selectedVariant) : 0;
  const effectiveStock = product ? getEffectiveStock(product, selectedVariant) : 0;
  const sku = selectedVariant?.sku ?? product?.sku ?? null;
  const galleryImages =
    selectedVariant && selectedVariant.images.length
      ? selectedVariant.images
      : (product?.images ?? []);

  useEffect(() => {
    setQuantity((current) => Math.min(Math.max(1, effectiveStock), current));
  }, [product?.id, selectedVariant?.id, effectiveStock]);
  if (isLoading)
    return (
      <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
        <div className="mx-auto max-w-7xl">
          <ProductDetailsSkeleton />
        </div>
      </main>
    );
  if (!product)
    return (
      <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
        <div className="mx-auto max-w-7xl">
          <EmptyState
            title={t("product.productNotFound")}
            description={t("product.productUnavailable")}
          />
        </div>
      </main>
    );
  const name = localizedProductName(product, language);
  const description = localizedProductDescription(product, language) || product.short_description;
  const categoryName = product.category
    ? localizedCategoryName(product.category, language)
    : t("product.collection");
  return (
    <main className="min-h-screen bg-noise pb-32 pt-8 sm:pt-12">
      <Seo
        input={{
          title: product.meta_title || product.name,
          description:
            product.meta_description ||
            product.description ||
            product.short_description ||
            `${product.name} by QYVERO.`,
          path: `/products/${product.slug}`,
          image: product.images[0]?.image_url,
          keywords: `${product.name}, ${product.category?.name ?? "men's lifestyle"}, ${product.brand ?? "QYVERO"}`,
          structuredData: [
            productSchema(product),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Products", path: "/products" },
              { name: product.name, path: `/products/${product.slug}` },
            ]),
          ],
        }}
      />
      <div className="mx-auto w-full max-w-7xl px-6">
        <nav
          aria-label={t("common.breadcrumb")}
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link to="/" className="transition hover:text-foreground">
            {t("product.home")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/products" className="transition hover:text-foreground">
            {t("product.products")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{categoryName}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{name}</span>
        </nav>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] lg:gap-16">
          <ProductGallery
            key={selectedVariant?.id ?? product.id}
            images={galleryImages}
            name={name}
          />
          <section className="lg:pt-5">
            <span className="inline-flex rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-teal">
              {categoryName}
            </span>
            <h1 className="text-display mt-5 text-4xl font-light leading-tight sm:text-5xl">
              {name}
            </h1>
            <div className="mt-5">
              <Rating product={product} />
            </div>
            <div className="mt-7 flex items-baseline gap-3">
              <span className="text-display text-3xl font-medium text-teal">
                {effectivePrice} EGP
              </span>
              {product.compare_price && (
                <span className="text-base text-muted-foreground line-through">
                  {product.compare_price} EGP
                </span>
              )}
            </div>
            <div className="mt-7 flex items-center gap-2 border-y border-white/10 py-4 text-sm">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  effectiveStock === 0
                    ? "bg-red-400"
                    : effectiveStock <= product.low_stock_threshold
                      ? "bg-amber-300"
                      : "bg-teal shadow-[0_0_12px_var(--color-teal)]",
                )}
              />
              <span className="font-medium text-foreground">
                {effectiveStock === 0
                  ? "Out of Stock"
                  : effectiveStock <= product.low_stock_threshold
                    ? `Only ${effectiveStock} left`
                    : "In Stock"}
              </span>
              <span className="text-muted-foreground">{t("product.readyToDispatch")}</span>
            </div>
            {sku && <p className="mt-3 text-xs text-muted-foreground">SKU: {sku}</p>}
            <VariantSelector
              variants={activeVariants}
              selected={selectedVariant}
              onSelect={(variant) => setSelectedVariantId(variant.id)}
            />
            <p className="mt-7 text-sm leading-7 text-muted-foreground">{description}</p>
            <ul className="mt-6 grid gap-3 text-sm text-foreground/90">
              {["premiumMaterial", "modernDesign", "durable", "lightweight"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-teal/15 text-teal">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {t(`product.${item}`)}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center justify-between gap-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Quantity
                </p>
                <div className="mt-3">
                  <QuantitySelector
                    quantity={quantity}
                    max={Math.max(1, effectiveStock)}
                    onChange={setQuantity}
                  />
                </div>
              </div>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <Truck className="h-4 w-4 text-teal" />
                Nationwide delivery
              </div>
            </div>
            <div className="mt-7">
              <OrderActions product={product} variant={selectedVariant} quantity={quantity} inStock={effectiveStock > 0} />
            </div>
          </section>
        </div>
        <ProductTabs product={product} />
        <section className="mt-20 sm:mt-28">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-teal">
                You may also like
              </p>
              <h2 className="text-display mt-3 text-3xl font-light sm:text-4xl">
                Complete the edit.
              </h2>
            </div>
            <Link
              to="/products"
              className="hidden text-sm text-foreground/75 transition hover:text-teal sm:block"
            >
              View all products
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <RelatedCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <OrderActions product={product} variant={selectedVariant} quantity={quantity} compact inStock={effectiveStock > 0} />
      </div>
    </main>
  );
}
export default ProductDetailsPage;
