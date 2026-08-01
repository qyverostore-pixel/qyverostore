import { supabase } from "@/lib/supabase";
import type { ProductImage, StoreCategory, StoreProduct } from "@/services/products";

export type SearchProduct = Pick<
  StoreProduct,
  "id" | "name" | "slug" | "sku" | "brand" | "short_description" | "description" | "price" | "stock" | "rating" | "reviews_count"
> & {
  category: Pick<StoreCategory, "id" | "name" | "slug"> | null;
  images: Pick<ProductImage, "id" | "image_url" | "alt_text" | "sort_order" | "is_primary">[];
};

const searchProductSelect = "id,name,slug,sku,brand,short_description,description,price,stock,rating,reviews_count,category:categories(id,name,slug),images:product_images(id,image_url,alt_text,sort_order,is_primary)";

const escapeLike = (value: string) => value.replace(/[\\%_(),]/g, "\\$&");

export async function searchProducts(term: string, signal: AbortSignal): Promise<SearchProduct[]> {
  const query = term.trim();
  if (!query) return [];

  const pattern = `%${escapeLike(query)}%`;
  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", pattern)
    .abortSignal(signal);

  if (categoryError) throw new Error(categoryError.message);

  const categoryIds = (categories ?? []).map((category) => category.id);
  const filters = [
    `name.ilike.${pattern}`,
    `sku.ilike.${pattern}`,
    `brand.ilike.${pattern}`,
    `short_description.ilike.${pattern}`,
    `description.ilike.${pattern}`,
    ...(categoryIds.length ? [`category_id.in.(${categoryIds.join(",")})`] : []),
  ];

  const { data, error } = await supabase
    .from("products")
    .select(searchProductSelect)
    .eq("is_active", true)
    .eq("status", "active")
    .or(filters.join(","))
    .order("name")
    .limit(12)
    .abortSignal(signal);

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as SearchProduct[]).map((product) => ({
    ...product,
    images: [...(product.images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    ),
  }));
}
