import { useCallback, useEffect, useMemo, useState } from "react";
import { getEffectivePrice, getEffectiveStock, type ProductVariant, type StoreProduct } from "@/services/products";
import { isPositiveInteger } from "@/lib/validation";

export type CartItem = { key: string; productId: string; variantId: string | null; name: string; slug: string; variantLabel: string | null; sku: string | null; price: number; quantity: number; stock: number; image_url: string | null };

const key = "qyvero-cart";
const buyNowKey = "qyvero-buy-now";
const eventName = "qyvero-cart-updated";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is CartItem => item && typeof item.productId === "string" && isPositiveInteger(Number(item.quantity)) && Number.isFinite(Number(item.price)) && Number(item.price) >= 0).map((item) => ({ ...item, key: typeof item.key === "string" ? item.key : `${item.productId}:${item.variantId ?? "base"}`, variantId: item.variantId ?? null, variantLabel: item.variantLabel ?? null, sku: item.sku ?? null, stock: Math.max(0, Number(item.stock ?? 0)), price: Number(item.price), quantity: Number(item.quantity) })) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event(eventName));
}

function readBuyNow(): CartItem | null {
  if (typeof window === "undefined") return null;
  try {
    const item = JSON.parse(window.sessionStorage.getItem(buyNowKey) ?? "null");
    return item && typeof item.productId === "string" && isPositiveInteger(Number(item.quantity)) ? { ...item, key: typeof item.key === "string" ? item.key : `${item.productId}:${item.variantId ?? "base"}`, variantId: item.variantId ?? null, variantLabel: item.variantLabel ?? null, sku: item.sku ?? null, price: Number(item.price), stock: Number(item.stock) } : null;
  } catch { return null; }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);

  useEffect(() => {
    setItems(readCart());
    setBuyNowItem(readBuyNow());
    const sync = () => setItems(readCart());
    window.addEventListener(eventName, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const commit = useCallback((next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  }, []);

  const addItem = useCallback((product: StoreProduct, quantity: number, variant?: ProductVariant | null) => {
    const available = Math.max(0, Number(getEffectiveStock(product, variant)));
    if (!isPositiveInteger(quantity) || !available) return false;
    const variantId = variant?.id ?? null;
    const itemKey = `${product.id}:${variantId ?? "base"}`;
    const current = readCart();
    const existing = current.find((item) => item.key === itemKey);
    const next = existing
      ? current.map((item) => item.key === itemKey ? { ...item, stock: available, quantity: Math.min(available, item.quantity + quantity) } : item)
      : [...current, { key: itemKey, productId: product.id, variantId, name: product.name, slug: product.slug, variantLabel: [variant?.color, variant?.size].filter(Boolean).join(" / ") || null, sku: variant?.sku ?? product.sku ?? null, price: Number(getEffectivePrice(product, variant)), quantity: Math.min(available, quantity), stock: available, image_url: variant?.images[0]?.image_url ?? product.images[0]?.image_url ?? null }];
    commit(next);
    return true;
  }, [commit]);

  const startBuyNow = useCallback((product: StoreProduct, quantity: number, variant?: ProductVariant | null) => {
    const stock = Math.max(0, Number(getEffectiveStock(product, variant)));
    if (!isPositiveInteger(quantity) || !stock) return false;
    const item: CartItem = { key: `${product.id}:${variant?.id ?? "base"}`, productId: product.id, variantId: variant?.id ?? null, name: product.name, slug: product.slug, variantLabel: [variant?.color, variant?.size].filter(Boolean).join(" / ") || null, sku: variant?.sku ?? product.sku ?? null, price: Number(getEffectivePrice(product, variant)), quantity: Math.min(quantity, stock), stock, image_url: variant?.images[0]?.image_url ?? product.images[0]?.image_url ?? null };
    window.sessionStorage.setItem(buyNowKey, JSON.stringify(item));
    setBuyNowItem(item);
    return true;
  }, []);
  const clearBuyNow = useCallback(() => { window.sessionStorage.removeItem(buyNowKey); setBuyNowItem(null); }, []);
  const updateBuyNowQuantity = useCallback((quantity: number) => {
    const current = readBuyNow();
    if (!current || !Number.isInteger(quantity)) return false;
    const next = { ...current, quantity: Math.max(1, Math.min(current.stock, quantity)) };
    window.sessionStorage.setItem(buyNowKey, JSON.stringify(next));
    setBuyNowItem(next);
    return true;
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return false;
    commit(readCart().map((item) => item.key === key ? { ...item, quantity: Math.max(1, Math.min(item.stock ?? Number.MAX_SAFE_INTEGER, quantity)) } : item));
    return true;
  }, [commit]);

  const removeItem = useCallback((key: string) => {
    commit(readCart().filter((item) => item.key !== key));
  }, [commit]);

  const clear = useCallback(() => commit([]), [commit]);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return { items, count, subtotal, buyNowItem, addItem, startBuyNow, clearBuyNow, updateBuyNowQuantity, updateQuantity, removeItem, clear };
}
