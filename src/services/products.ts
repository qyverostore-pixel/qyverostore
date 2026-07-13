import { supabase } from "@/lib/supabase";

export type ProductStatus = "draft" | "active" | "out_of_stock";

export type StoreCategory = { id: string; name: string; slug: string; is_active: boolean };
export type ProductImage = { id: string; product_id: string; image_url: string; storage_path: string | null; alt_text: string | null; sort_order: number; is_primary: boolean; created_at: string };
export type StoreProduct = {
  id: string; category_id: string | null; name: string; slug: string; sku: string; brand: string | null;
  short_description: string | null; description: string | null; price: number; compare_price: number | null;
  stock: number; low_stock_threshold: number; featured: boolean; is_new: boolean; is_best_seller: boolean;
  is_on_sale: boolean; status: ProductStatus; is_active: boolean; weight: number | null; length: number | null;
  width: number | null; height: number | null; rating: number; reviews_count: number; meta_title: string | null;
  meta_description: string | null; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string; category: StoreCategory | null; images: ProductImage[];
};

export type ProductInput = Omit<StoreProduct, "id" | "created_at" | "updated_at" | "category" | "images">;
const productSelect = "*, category:categories(id,name,slug,is_active), images:product_images(id,product_id,image_url,storage_path,alt_text,sort_order,is_primary,created_at)";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normaliseProduct = (product: StoreProduct): StoreProduct => ({ ...product, images: [...(product.images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order) });
const fail = (error: { message: string } | null) => { if (error) throw new Error(error.message); };

export async function getProducts(admin = false) {
  let query = supabase.from("products").select(productSelect).order("created_at", { ascending: false });
  if (!admin) query = query.eq("is_active", true).eq("status", "active");
  const { data, error } = await query;
  fail(error);
  return ((data ?? []) as StoreProduct[]).map(normaliseProduct);
}

export async function getFeaturedProducts() {
  const { data, error } = await supabase.from("products").select(productSelect).eq("is_active", true).eq("status", "active").eq("featured", true).order("created_at", { ascending: false }).limit(4);
  fail(error);
  return ((data ?? []) as StoreProduct[]).map(normaliseProduct);
}

export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("id,name,slug,is_active").eq("is_active", true).order("sort_order");
  fail(error);
  return (data ?? []) as StoreCategory[];
}

export async function getProduct(identifier: string, admin = false) {
  let query = supabase.from("products").select(productSelect);
  query = uuid.test(identifier) ? query.eq("id", identifier) : query.eq("slug", identifier);
  if (!admin) query = query.eq("is_active", true).eq("status", "active");
  const { data, error } = await query.maybeSingle();
  fail(error);
  return data ? normaliseProduct(data as StoreProduct) : null;
}

export async function getRelatedProducts(product: StoreProduct) {
  let query = supabase.from("products").select(productSelect).eq("is_active", true).eq("status", "active").neq("id", product.id).limit(4);
  if (product.category_id) query = query.eq("category_id", product.category_id);
  const { data, error } = await query;
  fail(error);
  return ((data ?? []) as StoreProduct[]).map(normaliseProduct);
}

function storageName(file: File) {
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
  return `${crypto.randomUUID()}.${extension.toLowerCase()}`;
}

export async function uploadProductImages(productId: string, files: File[]) {
  const uploaded: ProductImage[] = [];
  for (const [index, file] of files.entries()) {
    const storage_path = `${productId}/${storageName(file)}`;
    const { error: uploadError } = await supabase.storage.from("products").upload(storage_path, file, { upsert: false, contentType: file.type });
    fail(uploadError);
    const { data: publicUrl } = supabase.storage.from("products").getPublicUrl(storage_path);
    const { data, error } = await supabase.from("product_images").insert({ product_id: productId, storage_path, image_url: publicUrl.publicUrl, alt_text: file.name, sort_order: index, is_primary: index === 0 }).select().single();
    fail(error);
    uploaded.push(data as ProductImage);
  }
  return uploaded;
}

export async function createProduct(input: ProductInput, files: File[]) {
  const { data, error } = await supabase.from("products").insert(input).select(productSelect).single();
  fail(error);
  try {
    if (files.length) await uploadProductImages(data.id, files);
    return await getProduct(data.id, true);
  } catch (uploadError) {
    await supabase.from("products").delete().eq("id", data.id);
    throw uploadError;
  }
}

export async function updateProduct(id: string, input: Partial<ProductInput>, files: File[], removeImageIds: string[]) {
  if (removeImageIds.length) await deleteProductImages(removeImageIds);
  const { error } = await supabase.from("products").update(input).eq("id", id);
  fail(error);
  if (files.length) await uploadProductImages(id, files);
  return await getProduct(id, true);
}

export async function deleteProductImages(ids: string[]) {
  if (!ids.length) return;
  const { data, error } = await supabase.from("product_images").select("id,storage_path").in("id", ids);
  fail(error);
  const paths = (data ?? []).map((image) => image.storage_path).filter((path): path is string => Boolean(path));
  if (paths.length) { const { error: storageError } = await supabase.storage.from("products").remove(paths); fail(storageError); }
  const { error: deleteError } = await supabase.from("product_images").delete().in("id", ids);
  fail(deleteError);
}

export async function deleteProduct(product: StoreProduct) {
  await deleteProductImages(product.images.map((image) => image.id));
  const { error } = await supabase.from("products").delete().eq("id", product.id);
  fail(error);
}
