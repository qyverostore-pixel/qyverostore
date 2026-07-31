import { Clock3, CornerDownLeft, Search, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { useProductSearch } from "@/hooks/use-search";
import type { SearchProduct } from "@/services/search";

const popular = [
  "Wallet",
  "Watch",
  "Perfume",
  "Belt",
  "Headphones",
  "Earbuds",
  "Keyboard",
  "Mouse",
  "Cross Bag",
];
const RECENT_SEARCHES_KEY = "qyvero-recent-searches";
const recentLimit = 8;

function readRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string").slice(0, recentLimit) : [];
  } catch {
    return [];
  }
}

function SearchResult({ product, highlighted, onSelect }: { product: SearchProduct; highlighted: boolean; onSelect: () => void }) {
  const image = product.images[0];
  return <button type="button" onClick={onSelect} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${highlighted ? "bg-teal/10 text-foreground ring-1 ring-inset ring-teal/40" : "text-foreground/80 hover:bg-white/[0.05] hover:text-foreground"}`}>
    <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[0.05] text-xs text-muted-foreground">
      {image ? <img src={image.image_url} alt={image.alt_text ?? product.name} className="size-full object-cover" /> : <Search className="size-4" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{product.name}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{product.category?.name ?? "Collection"} · {Number(product.price).toLocaleString()} EGP</p>
    </div>
    <div className="shrink-0 text-right text-xs text-muted-foreground">
      <span className="flex items-center justify-end gap-1 text-amber-300"><Star className="size-3 fill-current" />{Number(product.rating).toFixed(1)}</span>
      <span className={`mt-1 block ${product.stock > 0 ? "text-teal" : "text-red-300"}`}>{product.stock > 0 ? "In stock" : "Out of stock"}</span>
    </div>
  </button>;
}

function SearchSkeleton() {
  return <div className="space-y-1" aria-label="Searching products">
    {Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-3 rounded-xl px-3 py-3"><div className="size-12 animate-pulse rounded-xl bg-white/[0.07]" /><div className="flex-1 space-y-2"><div className="h-3 w-2/5 animate-pulse rounded bg-white/[0.07]" /><div className="h-2.5 w-3/5 animate-pulse rounded bg-white/[0.05]" /></div></div>)}
  </div>;
}

export function SearchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [recent, setRecent] = useState(readRecentSearches);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const { data: results = [], isFetching, isDebouncing, searchNow } = useProductSearch(term, open);
  const hasTerm = Boolean(term.trim());
  const isSearching = hasTerm && (isDebouncing || isFetching);

  useEffect(() => setHighlightedIndex(0), [term, results.length]);

  useEffect(() => {
    const search = term.trim();
    if (!search || isDebouncing) return;
    setRecent((current) => {
      const next = [search, ...current.filter((item) => item.toLowerCase() !== search.toLowerCase())].slice(0, recentLimit);
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, [isDebouncing, term]);

  const updateTerm = (value: string, immediate = false) => {
    setTerm(value);
    if (immediate) searchNow(value);
  };

  const selectProduct = (product: SearchProduct) => {
    onOpenChange(false);
    void navigate({ to: "/products/$productId", params: { productId: product.slug } });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
    } else if (results.length && event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % results.length);
    } else if (results.length && event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => (index - 1 + results.length) % results.length);
    } else if (results.length && event.key === "Enter") {
      event.preventDefault();
      selectProduct(results[highlightedIndex] ?? results[0]);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[70] bg-black/70 backdrop-blur-md data-[state=open]:duration-300" />
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            input.current?.focus();
          }}
          className="z-[71] w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-hidden rounded-[2rem] border-white/15 bg-[#111318]/95 p-0 shadow-[0_30px_100px_rgba(0,0,0,.65)] backdrop-blur-2xl data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 sm:w-full"
        >
          <div className="border-b border-white/10 p-5 sm:p-7">
            <div className="flex items-center gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-teal/25 bg-teal/10 text-teal">
                <Search className="size-5" />
              </span>
              <input
                ref={input}
                autoFocus
                type="search"
                placeholder="Search products..."
                aria-label="Search products"
                value={term}
                onChange={(event) => updateTerm(event.target.value)}
                onKeyDown={onKeyDown}
                className="h-12 min-w-0 flex-1 bg-transparent text-xl text-foreground outline-none placeholder:text-muted-foreground sm:text-2xl"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => onOpenChange(false)}
                className="grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          <div className="max-h-[min(55vh,440px)] overflow-y-auto p-5 sm:p-7">
            {hasTerm ? <section>
              {isSearching ? <SearchSkeleton /> : results.length ? <div className="space-y-1">
                {results.map((product, index) => <SearchResult key={product.id} product={product} highlighted={index === highlightedIndex} onSelect={() => selectProduct(product)} />)}
              </div> : <div className="py-10 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-teal"><Search className="size-5" /></span><p className="mt-4 text-sm text-foreground">No products found</p></div>}
            </section> : <>
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-teal">
                Popular Searches
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {popular.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => updateTerm(item, true)}
                    className="rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-sm text-foreground/80 transition hover:border-teal/60 hover:bg-teal/10 hover:text-teal"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
            <section className="mt-8 border-t border-white/10 pt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Recent Searches
              </p>
              <div className="mt-3 space-y-1">
                {recent.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => updateTerm(item, true)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-foreground/80 transition hover:bg-white/[0.05] hover:text-foreground"
                  >
                    <Clock3 className="size-4 text-muted-foreground" />
                    {item}
                  </button>
                ))}
              </div>
            </section>
            </>}
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 bg-black/10 px-5 py-4 text-xs text-muted-foreground sm:px-7">
            <span className="grid size-5 place-items-center rounded border border-white/15 text-foreground/70">
              <CornerDownLeft className="size-3" />
            </span>
            Press Enter to search
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
