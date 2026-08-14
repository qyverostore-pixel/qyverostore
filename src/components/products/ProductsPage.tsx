import { MessageCircle, Search, SlidersHorizontal, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EmptyState, EmptyStateAction } from "@/components/ui/empty-state";
import { ProductsSkeleton } from "@/components/ui/loading-skeletons";
import { useCategories, useProducts } from "@/hooks/use-products";
import type { StoreProduct } from "@/services/products";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { Seo, breadcrumbSchema } from "@/lib/seo";
import { useStorefrontSettings } from "@/providers/StorefrontSettingsProvider";
import { whatsappUrl } from "@/services/store-settings";
import { useLocale } from "@/providers/LocaleProvider";
import { localizedCategoryName, localizedProductName } from "@/lib/localized-content";

type SortOption = "newest" | "price-asc" | "price-desc";

function ProductMedia({ product }: { product: StoreProduct }) {
  const { language, t } = useLocale();
  const image = product.images[0];
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-neutral-700 to-neutral-950">
      {image ? (
        <img
          src={image.image_url}
          alt={localizedProductName(product, language)}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          onError={(event) => { event.currentTarget.style.display = "none"; }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-display text-4xl font-light tracking-[0.24em] text-white/40">
          QY
        </span>
      )}
      <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-foreground/90 backdrop-blur">
        {product.category ? localizedCategoryName(product.category, language) : t("product.collection")}
      </span>
    </div>
  );
}

function ProductCard({ product }: { product: StoreProduct }) {
  const settings = useStorefrontSettings();
  const { language, t } = useLocale();
  const name = localizedProductName(product, language);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-[0_20px_50px_-30px_rgba(0,0,0,.9)] transition-all duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.04] hover:shadow-[0_30px_70px_-30px_rgba(0,0,0,1)]">
      <WishlistButton
        product={product}
        className="absolute right-3 top-3 z-10 grid size-9 rounded-full bg-background/75 text-foreground backdrop-blur hover:bg-background"
      />
      <ProductMedia product={product} />
      <div className="flex flex-1 flex-col p-5">
        <p className={cn("text-xs font-medium", product.stock === 0 ? "text-red-300" : product.stock <= product.low_stock_threshold ? "text-amber-300" : "text-teal")}>
          {product.stock === 0 ? t("product.outOfStock") : product.stock <= product.low_stock_threshold ? `${t("products.onlyLeft")} ${product.stock} ${t("products.left")}` : t("product.inStock")}
        </p>
        <div className="flex items-center gap-1 text-xs text-amber-300">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="font-semibold">{Number(product.rating).toFixed(1)}</span>
          <span className="text-muted-foreground">({product.reviews_count})</span>
        </div>
        <h2 className="text-display mt-3 text-lg font-medium text-foreground">{name}</h2>
        <p className="mt-1 text-base font-semibold text-teal">{Number(product.price)} {t("common.currency")}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link
            to="/products/$productId"
            params={{ productId: product.slug }}
            className="rounded-full bg-foreground px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-background transition hover:bg-foreground/90"
          >
            {t("home.viewDetails")}
          </Link>
          <a
            href={whatsappUrl(settings.whatsapp, `${t("products.whatsappInterest")} ${name}.`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 px-3 py-2.5 text-center text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {t("products.whatsapp")}
          </a>
        </div>
      </div>
    </article>
  );
}

export function ProductsPage() {
  const settings = useStorefrontSettings();
  const { language, t } = useLocale();
  const location = useLocation();
  const categorySlug = new URLSearchParams(location.searchStr).get("category") ?? undefined;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Products");
  const [sort, setSort] = useState<SortOption>("newest");
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  useEffect(() => {
    const selected = categories.find((item) => item.slug === categorySlug);
    setCategory(selected?.name ?? "All Products");
  }, [categorySlug, categories]);
  const visibleProducts = useMemo(
    () =>
      products
        .filter((product) => category === "All Products" || product.category?.name === category)
        .filter(
          (product) =>
            !query.trim() ||
            `${product.name} ${product.name_en ?? ""} ${product.name_ar ?? ""} ${product.category?.name ?? ""} ${product.category?.name_en ?? ""} ${product.category?.name_ar ?? ""}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
        )
        .sort((a, b) =>
          sort === "price-asc"
            ? Number(a.price) - Number(b.price)
            : sort === "price-desc"
              ? Number(b.price) - Number(a.price)
              : b.created_at.localeCompare(a.created_at),
        ),
    [category, products, query, sort],
  );
  const categoryNames = ["All Products", ...categories.map((item) => item.name)];
  const selectedCategory = categories.find((item) => item.slug === categorySlug);
  const seoTitle = selectedCategory ? `${selectedCategory.name} Collection` : "Shop the Collection";
  const seoDescription = selectedCategory ? `Shop QYVERO ${selectedCategory.name}: refined essentials for modern everyday distinction.` : "Shop QYVERO's curated collection of modern men's lifestyle essentials and accessories.";
  return (
    <main className="min-h-screen bg-noise pb-24 pt-12 sm:pb-32 sm:pt-20">
      <Seo input={{ title: seoTitle, description: seoDescription, path: selectedCategory ? `/products?category=${selectedCategory.slug}` : "/products", structuredData: breadcrumbSchema([{ name: "Home", path: "/" }, { name: selectedCategory?.name ?? "Products", path: selectedCategory ? `/products?category=${selectedCategory.slug}` : "/products" }]) }} />
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">
            {t("products.eyebrow")}
          </p>
          <h1 className="text-display mt-4 text-4xl font-light leading-[1.05] text-foreground sm:text-6xl">
            {t("products.titleStart")} <span className="italic text-teal">{t("products.titleAccent")}</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {t("products.description")}
          </p>
        </div>
        <div className="relative mx-auto mt-10 max-w-2xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            aria-label={t("search.searchProducts")}
            placeholder={t("products.search")}
            className="h-14 w-full rounded-full border border-white/15 bg-white/[0.03] pl-13 pr-5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-teal focus:ring-2 focus:ring-teal/25"
          />
        </div>
        <div className="mt-12 border-y border-white/10 py-5 sm:mt-14">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-teal" />
              {categoryNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition",
                    category === name
                      ? "border-teal bg-teal text-teal-foreground"
                      : "border-white/10 bg-white/[0.02] text-foreground/75 hover:border-white/25 hover:text-foreground",
                  )}
                >
                  {name === "All Products" ? t("products.allProducts") : localizedCategoryName(categories.find((item) => item.name === name)!, language)}
                </button>
              ))}
            </div>
            <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
              <SelectTrigger
                aria-label={t("products.sort")}
                className="h-10 w-full rounded-full border-white/15 bg-white/[0.02] px-4 text-foreground sm:w-52"
              >
                <SelectValue placeholder={t("products.sort")} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-popover text-foreground">
                <SelectItem value="newest">{t("products.newest")}</SelectItem>
                <SelectItem value="price-asc">{t("products.priceLowHigh")}</SelectItem>
                <SelectItem value="price-desc">{t("products.priceHighLow")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-7 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{visibleProducts.length}</span>{" "}
            {visibleProducts.length === 1 ? t("products.productFound") : t("products.productsFound")}
          </p>
          {(query || category !== "All Products") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("All Products");
              }}
              className="text-xs font-medium text-teal transition hover:text-foreground"
            >
              {t("products.clearFilters")}
            </button>
          )}
        </div>
        {isLoading ? (
          <div className="mt-7">
            <ProductsSkeleton />
          </div>
        ) : visibleProducts.length ? (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-7">
            <EmptyState
              title={t("products.noProducts")}
              description={t("products.noProductsDescription")}
              action={
                <EmptyStateAction
                  onClick={() => {
                    setQuery("");
                    setCategory("All Products");
                  }}
                >
                  {t("products.resetFilters")}
                </EmptyStateAction>
              }
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default ProductsPage;
