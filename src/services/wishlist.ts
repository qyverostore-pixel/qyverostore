import { supabase } from "@/lib/supabase";
import { storeProductSelect, type StoreProduct } from "@/services/products";

export type WishlistItem = {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
  product: StoreProduct | null;
};

export type WishlistRecord = Pick<WishlistItem, "id" | "customer_id" | "product_id" | "created_at">;

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

async function currentCustomerId() {
  const { data, error } = await supabase.auth.getUser();
  fail(error);
  if (!data.user) throw new Error("Please sign in to save products.");
  return data.user.id;
}

const normalize = (item: WishlistItem): WishlistItem => ({
  ...item,
  product: item.product
    ? {
        ...item.product,
        images: [...(item.product.images ?? [])].sort(
          (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
        ),
      }
    : null,
});

export async function getWishlist(): Promise<WishlistItem[]> {
  const customerId = await currentCustomerId();
  const { data, error } = await supabase
    .from("wishlist")
    .select(`id,customer_id,product_id,created_at,product:products(${storeProductSelect})`)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  fail(error);
  return ((data ?? []) as unknown as WishlistItem[]).map(normalize);
}

export async function addToWishlist(productId: string) {
  const customerId = await currentCustomerId();
  const { error } = await supabase
    .from("wishlist")
    .upsert(
      { customer_id: customerId, product_id: productId },
      { onConflict: "customer_id,product_id", ignoreDuplicates: true },
    );
  fail(error);
}

export async function removeFromWishlist(productId: string): Promise<WishlistRecord> {
  const customerId = await currentCustomerId();
  const { data, error } = await supabase
    .from("wishlist")
    .delete()
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .select("id,customer_id,product_id,created_at")
    .single();
  fail(error);
  return data as WishlistRecord;
}

export async function isWishlisted(productId: string) {
  const customerId = await currentCustomerId();
  const { data, error } = await supabase
    .from("wishlist")
    .select("id")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();
  fail(error);
  return Boolean(data);
}
