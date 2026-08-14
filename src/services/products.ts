import { supabase } from "@/lib/supabase";

export type ProductStatus = "draft" | "active" | "out_of_stock";

export type StoreCategory = {
  id: string;
  name: string;
  name_en: string | null;
  name_ar: string | null;
  slug: string;
  icon: string | null;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  is_active: boolean;
};
export type AdminCategory = StoreCategory & {
  icon: string | null;
  description: string | null;
  sort_order: number;
};
export type CategoryInput = {
  name: string;
  name_en: string | null;
  name_ar: string | null;
  slug: string;
  icon: string | null;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  sort_order: number;
  is_active: boolean;
};
export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  storage_path: string | null;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};
// --- Variants -----------------------------------------------------------
// A `product_variants` row always exists for every product (a "default"
// variant is backfilled for every legacy product — see the
// `backfill_default_product_variants` migration). Nothing in the storefront
// or checkout reads these fields yet, so adding them here is purely
// additive: existing components that only destructure the fields they
// already know about (name, price, stock, images, ...) are unaffected.
export type VariantImage = {
  id: string;
  variant_id: string;
  image_url: string;
  storage_path: string | null;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};
export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  // null => inherit the parent product's `price`. This is what makes a
  // product with only the auto-created default variant behave exactly as
  // it did before variants existed.
  price_override: number | null;
  stock: number;
  barcode: string | null;
  weight: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: VariantImage[];
};
export type VariantInput = Omit<ProductVariant, "id" | "created_at" | "updated_at" | "images">;
export type VariantImageInput = Omit<VariantImage, "id" | "created_at">;
export type StoreProduct = {
  id: string;
  category_id: string | null;
  name: string;
  name_en: string | null;
  name_ar: string | null;
  slug: string;
  sku: string;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
  low_stock_threshold: number;
  featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  is_on_sale: boolean;
  status: ProductStatus;
  is_active: boolean;
  /** Display value supplied by an administrator, e.g. "250 g" or "1.2 kg". */
  weight: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  rating: number;
  reviews_count: number;
  meta_title: string | null;
  meta_description: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  category: StoreCategory | null;
  images: ProductImage[];
  // Always populated by `storeProductSelect`. Every existing product has at
  // least its auto-created default variant, so this is never empty for
  // data fetched through the standard product queries below.
  variants: ProductVariant[];
};

// `variants` is intentionally excluded here (same as `images`): it is
// derived/nested data, not a column on `products`, so it must never be
// part of an insert/update payload sent to `.from("products")`.
export type ProductInput = Omit<
  StoreProduct,
  "id" | "created_at" | "updated_at" | "category" | "images" | "variants"
>;
const variantImagesSelect =
  "images:variant_images(id,variant_id,image_url,storage_path,alt_text,sort_order,is_primary,created_at)";
const variantsSelect = `variants:product_variants(id,product_id,sku,color,size,price_override,stock,barcode,weight,is_default,is_active,created_at,updated_at,${variantImagesSelect})`;
export const storeProductSelect = `*, category:categories(id,name,name_en,name_ar,slug,icon,description,description_en,description_ar,is_active), images:product_images(id,product_id,image_url,storage_path,alt_text,sort_order,is_primary,created_at), ${variantsSelect}`;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sortImages = <T extends { is_primary: boolean; sort_order: number }>(images: T[]) =>
  [...(images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );

const normaliseVariant = (variant: ProductVariant): ProductVariant => ({
  ...variant,
  images: sortImages(variant.images ?? []),
});

const normaliseProduct = (product: StoreProduct): StoreProduct => ({
  ...product,
  images: sortImages(product.images),
  // Default variant first, then most recently created. Storefront/admin UI
  // does not read this field yet, so this ordering only matters for future
  // consumers and for the variant-management services below.
  variants: [...(product.variants ?? [])]
    .map(normaliseVariant)
    .sort(
      (a, b) =>
        Number(b.is_default) - Number(a.is_default) ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
});

// --- Variant-aware helpers ------------------------------------------------
// Pure, additive helpers. Nothing currently calls these — they exist so
// that future checkout/storefront work can read "the effective price/stock
// for what's actually in the cart" without every caller re-implementing the
// same fallback-to-product-level logic. For a product that only has its
// auto-created default variant, these always resolve to the product's own
// `price`/`stock`, which is exactly today's behavior.
export function getDefaultVariant(product: StoreProduct): ProductVariant | null {
  return product.variants.find((variant) => variant.is_default) ?? product.variants[0] ?? null;
}

export function getEffectivePrice(product: StoreProduct, variant?: ProductVariant | null): number {
  return variant?.price_override ?? product.price;
}

export function getEffectiveStock(product: StoreProduct, variant?: ProductVariant | null): number {
  return variant ? variant.stock : product.stock;
}
const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function getProducts(admin = false) {
  let query = supabase
    .from("products")
    .select(storeProductSelect)
    .order("created_at", { ascending: false });
  if (!admin) query = query.eq("is_active", true).in("status", ["active", "out_of_stock"]);
  const { data, error } = await query;
  fail(error);
  return ((data ?? []) as StoreProduct[]).map(normaliseProduct);
}

export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(storeProductSelect)
    .eq("is_active", true)
    .in("status", ["active", "out_of_stock"])
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(4);
  fail(error);
  return ((data ?? []) as StoreProduct[]).map(normaliseProduct);
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,name_en,name_ar,slug,icon,description,description_en,description_ar,is_active")
    .eq("is_active", true)
    .order("sort_order");
  fail(error);
  return (data ?? []) as StoreCategory[];
}

export async function updateCategory(id: string, input: CategoryInput) {
  const { error } = await supabase.from("categories").update(input).eq("id", id);
  fail(error);
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  fail(error);
}

export async function getProduct(identifier: string, admin = false) {
  let query = supabase.from("products").select(storeProductSelect);
  query = uuid.test(identifier) ? query.eq("id", identifier) : query.eq("slug", identifier);
  if (!admin) query = query.eq("is_active", true).in("status", ["active", "out_of_stock"]);
  const { data, error } = await query.maybeSingle();
  fail(error);
  return data ? normaliseProduct(data as StoreProduct) : null;
}

export async function getRelatedProducts(product: StoreProduct) {
  let query = supabase
    .from("products")
    .select(storeProductSelect)
    .eq("is_active", true)
    .in("status", ["active", "out_of_stock"])
    .neq("id", product.id)
    .limit(4);
  if (product.category_id) query = query.eq("category_id", product.category_id);
  const { data, error } = await query;
  fail(error);
  return ((data ?? []) as StoreProduct[]).map(normaliseProduct);
}

function storageName(file: File) {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.replace(/[^a-z0-9]/gi, "") || "jpg";
  return `${crypto.randomUUID()}.${extension.toLowerCase()}`;
}

export async function uploadProductImages(productId: string, files: File[]) {
  if (files.length > 10) throw new Error("A product can have at most 10 images.");
  const { data: existingImages, error: existingImagesError } = await supabase
    .from("product_images")
    .select("id,sort_order,is_primary")
    .eq("product_id", productId)
    .order("sort_order");
  fail(existingImagesError);
  if ((existingImages?.length ?? 0) + files.length > 10)
    throw new Error("A product can have at most 10 images.");
  const firstSortOrder =
    (existingImages ?? []).reduce(
      (highest, image) => Math.max(highest, Number(image.sort_order)),
      -1,
    ) + 1;
  const hasPrimary = (existingImages ?? []).some((image) => image.is_primary);
  const uploaded: ProductImage[] = [];
  for (const [index, file] of files.entries()) {
    const storage_path = `${productId}/${storageName(file)}`;
    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(storage_path, file, { upsert: false, contentType: file.type });
    fail(uploadError);
    const { data: publicUrl } = supabase.storage.from("products").getPublicUrl(storage_path);
    const { data, error } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        storage_path,
        image_url: publicUrl.publicUrl,
        alt_text: file.name,
        sort_order: firstSortOrder + index,
        is_primary: !hasPrimary && index === 0,
      })
      .select()
      .single();
    fail(error);
    uploaded.push(data as ProductImage);
  }
  return uploaded;
}

export async function createProduct(input: ProductInput, files: File[]) {
  // Only ask for the new row's id here. Deliberately NOT using
  // `storeProductSelect` on this insert: that select embeds
  // `product_variants`/`variant_images`, which couples product *creation*
  // to a table a brand-new product has no rows in yet (variants are only
  // managed after the product is saved — see VariantManagement). The full
  // StoreProduct — variants included — is still returned below via
  // getProduct(), as a normal read.
  const { data, error } = await supabase.from("products").insert(input).select("id").single();
  fail(error);
  if (!data) throw new Error("Product creation did not return an id.");
  try {
    if (files.length) await uploadProductImages(data.id, files);
    return await getProduct(data.id, true);
  } catch (uploadError) {
    await supabase.from("products").delete().eq("id", data.id);
    throw uploadError;
  }
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
  files: File[],
  removeImageIds: string[],
) {
  if (removeImageIds.length) await deleteProductImages(removeImageIds);
  const { error } = await supabase.from("products").update(input).eq("id", id);
  fail(error);
  if (files.length) await uploadProductImages(id, files);
  return await getProduct(id, true);
}

export async function deleteProductImages(ids: string[]) {
  if (!ids.length) return;
  const { data, error } = await supabase
    .from("product_images")
    .select("id,storage_path")
    .in("id", ids);
  fail(error);
  const paths = (data ?? [])
    .map((image) => image.storage_path)
    .filter((path): path is string => Boolean(path));
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("products").remove(paths);
    fail(storageError);
  }
  const { error: deleteError } = await supabase.from("product_images").delete().in("id", ids);
  fail(deleteError);
}

export async function reorderProductImages(productId: string, imageIds: string[]) {
  await Promise.all(
    imageIds.map(async (id, index) => {
      const { error } = await supabase
        .from("product_images")
        .update({ sort_order: index, is_primary: index === 0 })
        .eq("id", id)
        .eq("product_id", productId);
      fail(error);
    }),
  );
}

export async function deleteProduct(product: StoreProduct) {
  await deleteProductImages(product.images.map((image) => image.id));
  // product_variants / variant_images rows cascade-delete at the DB level,
  // but the underlying storage objects don't — clean those up first so we
  // don't leak files in the "products" bucket.
  const variantImageIds = product.variants.flatMap((variant) =>
    variant.images.map((image) => image.id),
  );
  if (variantImageIds.length) await deleteVariantImages(variantImageIds);
  const { error } = await supabase.from("products").delete().eq("id", product.id);
  fail(error);
}

// --- Variant services ------------------------------------------------------
// Mirrors the existing product CRUD patterns above. None of these are wired
// into any route/component yet, so they cannot change storefront, cart, or
// checkout behavior — they're the building blocks a future admin UI (or a
// future checkout revision) will call into.

export async function createVariant(input: VariantInput): Promise<ProductVariant> {
  const { data, error } = await supabase
    .from("product_variants")
    .insert(input)
    .select(
      `id,product_id,sku,color,size,price_override,stock,barcode,weight,is_default,is_active,created_at,updated_at,${variantImagesSelect}`,
    )
    .single();
  fail(error);
  return normaliseVariant(data as ProductVariant);
}

export async function updateVariant(
  id: string,
  input: Partial<VariantInput>,
): Promise<ProductVariant> {
  const { data, error } = await supabase
    .from("product_variants")
    .update(input)
    .eq("id", id)
    .select(
      `id,product_id,sku,color,size,price_override,stock,barcode,weight,is_default,is_active,created_at,updated_at,${variantImagesSelect}`,
    )
    .single();
  fail(error);
  return normaliseVariant(data as ProductVariant);
}

export async function deleteVariant(id: string): Promise<void> {
  const { data: variant, error: fetchError } = await supabase
    .from("product_variants")
    .select("id,is_default,product_id")
    .eq("id", id)
    .maybeSingle();
  fail(fetchError);
  if (!variant) return;
  // Guard rail for rule "every product must keep working": never silently
  // leave a product without a default variant. Callers must promote another
  // variant to default (via updateVariant) before deleting this one.
  if (variant.is_default) {
    throw new Error(
      "This is the default variant. Set another variant as default before deleting it.",
    );
  }
  const { data: images, error: imagesError } = await supabase
    .from("variant_images")
    .select("id")
    .eq("variant_id", id);
  fail(imagesError);
  if (images?.length) await deleteVariantImages(images.map((image) => image.id));
  const { error } = await supabase.from("product_variants").delete().eq("id", id);
  fail(error);
}

// --- Variant image services -------------------------------------------------

export async function createVariantImage(
  variantId: string,
  file: File,
  overrides: Partial<Pick<VariantImageInput, "alt_text" | "sort_order" | "is_primary">> = {},
): Promise<VariantImage> {
  const storage_path = `variants/${variantId}/${storageName(file)}`;
  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(storage_path, file, { upsert: false, contentType: file.type });
  fail(uploadError);
  const { data: publicUrl } = supabase.storage.from("products").getPublicUrl(storage_path);
  const { data, error } = await supabase
    .from("variant_images")
    .insert({
      variant_id: variantId,
      storage_path,
      image_url: publicUrl.publicUrl,
      alt_text: overrides.alt_text ?? file.name,
      sort_order: overrides.sort_order ?? 0,
      is_primary: overrides.is_primary ?? false,
    })
    .select()
    .single();
  fail(error);
  return data as VariantImage;
}

export async function deleteVariantImage(id: string): Promise<void> {
  await deleteVariantImages([id]);
}

// Bulk upload wrapper used by the admin "Manage images" dialog. Mirrors
// `uploadProductImages`'s primary-image bookkeeping: the first image ever
// uploaded for a variant becomes the cover automatically.
export async function uploadVariantImages(
  variantId: string,
  files: File[],
  options: { startSortOrder?: number; hasPrimary?: boolean } = {},
): Promise<VariantImage[]> {
  const uploaded: VariantImage[] = [];
  let hasPrimary = options.hasPrimary ?? false;
  const start = options.startSortOrder ?? 0;
  for (const [index, file] of files.entries()) {
    const is_primary = !hasPrimary && index === 0;
    const image = await createVariantImage(variantId, file, {
      sort_order: start + index,
      is_primary,
    });
    if (image.is_primary) hasPrimary = true;
    uploaded.push(image);
  }
  return uploaded;
}

// Drives both drag-and-drop reordering and "set cover image": callers pass
// the full image id list in the desired order — index 0 becomes the cover.
export async function reorderVariantImages(variantId: string, imageIds: string[]): Promise<void> {
  await Promise.all(
    imageIds.map(async (id, index) => {
      const { error } = await supabase
        .from("variant_images")
        .update({ sort_order: index, is_primary: index === 0 })
        .eq("id", id)
        .eq("variant_id", variantId);
      fail(error);
    }),
  );
}

export async function deleteVariantImages(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { data, error } = await supabase
    .from("variant_images")
    .select("id,storage_path")
    .in("id", ids);
  fail(error);
  const paths = (data ?? [])
    .map((image) => image.storage_path)
    .filter((path): path is string => Boolean(path));
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("products").remove(paths);
    fail(storageError);
  }
  const { error: deleteError } = await supabase.from("variant_images").delete().in("id", ids);
  fail(deleteError);
}
