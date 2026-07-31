import { useCallback, useEffect, useMemo, useState } from "react";
import type { StoreProduct } from "@/services/products";

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  stock: number;
  image_url: string | null;
};

const key = "qyvero-cart";
const eventName = "qyvero-cart-updated";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event(eventName));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());
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

  const addItem = useCallback(
    (product: StoreProduct, quantity: number) => {
      const available = Math.max(0, Number(product.stock));
      if (!available) return;
      const current = readCart();
      const existing = current.find((item) => item.productId === product.id);
      const next = existing
        ? current.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  stock: available,
                  quantity: Math.min(available, item.quantity + quantity),
                }
              : item,
          )
        : [
            ...current,
            {
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: Number(product.price),
              quantity: Math.min(available, quantity),
              stock: available,
              image_url: product.images[0]?.image_url ?? null,
            },
          ];
      commit(next);
    },
    [commit],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      commit(
        readCart().map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.max(1, Math.min(item.stock ?? Number.MAX_SAFE_INTEGER, quantity)),
              }
            : item,
        ),
      );
    },
    [commit],
  );

  const removeItem = useCallback(
    (productId: string) => {
      commit(readCart().filter((item) => item.productId !== productId));
    },
    [commit],
  );

  const clear = useCallback(() => commit([]), [commit]);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  return { items, count, subtotal, addItem, updateQuantity, removeItem, clear };
}
