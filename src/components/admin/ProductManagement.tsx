import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Edit3,
  Eye,
  ImagePlus,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminBackLink, AdminLayout } from "@/components/admin/AdminLayout";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { VariantManagement } from "@/components/admin/VariantManagement";
import { Button } from "@/components/ui/button";
import { FormSkeleton, AdminTableSkeleton } from "@/components/ui/loading-skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCategories, useProduct, useProducts, productKeys } from "@/hooks/use-products";
import {
  createProduct,
  createVariant,
  deleteProduct,
  deleteProductImages,
  reorderProductImages,
  updateProduct,
  uploadVariantImages,
  type ProductInput,
  type ProductStatus,
  type VariantInput,
} from "@/services/products";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

const money = (value: number) => `$${Number(value).toLocaleString()}`;
const MAX_PRODUCT_IMAGES = 10;
const empty = {
  name: "",
  name_en: "",
  name_ar: "",
  slug: "",
  category_id: "",
  price: 0,
  compare_price: 0,
  stock: 0,
  low_stock_threshold: 5,
  sku: "",
  description: "",
  description_en: "",
  description_ar: "",
  short_description: "",
  brand: "QYVERO",
  featured: false,
  is_new: false,
  is_best_seller: false,
  is_on_sale: false,
  is_active: true,
  status: "draft" as ProductStatus,
  weight: "",
  length: "",
  width: "",
  height: "",
  rating: "0",
  meta_title: "",
  meta_description: "",
};
const statusLabel = (status: ProductStatus) =>
  status === "active" ? "Active" : status === "out_of_stock" ? "Out of stock" : "Draft";
const createSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type VariantOptionName = "Color" | "Size";
type VariantOptionGroup = { name: VariantOptionName; values: string[]; value: string };
type NewVariantDraft = {
  key: string;
  color: string | null;
  size: string | null;
  price: string;
  stock: string;
  sku: string;
  weight: string;
  image: File | null;
};
type NewVariantSetup = {
  enabled: boolean;
  groups: VariantOptionGroup[];
  variants: NewVariantDraft[];
};

const emptyVariantSetup: NewVariantSetup = { enabled: false, groups: [], variants: [] };
const variantKey = (color: string | null, size: string | null) =>
  `${(color ?? "").trim().toLowerCase()}__${(size ?? "").trim().toLowerCase()}`;
const skuPart = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 6) || "VAR";
const generatedVariantSku = (baseSku: string, color: string | null, size: string | null) =>
  [skuPart(baseSku), color && skuPart(color), size && skuPart(size)].filter(Boolean).join("-");

function buildVariantDrafts(
  groups: VariantOptionGroup[],
  current: NewVariantDraft[],
  defaults: Pick<NewVariantDraft, "price" | "stock" | "sku" | "weight">,
) {
  const configured = groups.filter((group) => group.values.length > 0);
  if (!configured.length) return [];
  const combinations = configured.reduce<Array<Record<VariantOptionName, string | null>>>(
    (rows, group) =>
      rows.flatMap((row) => group.values.map((value) => ({ ...row, [group.name]: value }))),
    [{} as Record<VariantOptionName, string | null>],
  );
  return combinations.map((combination) => {
    const color = combination.Color ?? null;
    const size = combination.Size ?? null;
    const existing = current.find((variant) => variant.key === variantKey(color, size));
    return (
      existing ?? {
        key: variantKey(color, size),
        color,
        size,
        price: defaults.price,
        stock: defaults.stock,
        sku: generatedVariantSku(defaults.sku, color, size),
        weight: defaults.weight,
        image: null,
      }
    );
  });
}

export function ProductsPage() {
  const { data: products = [], isLoading } = useProducts(true);
  const queryClient = useQueryClient();
  const remove = async (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    try {
      await deleteProduct(product);
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Product deleted", {
        description: `${product.name} was removed from the catalog.`,
      });
    } catch (error) {
      toast.error("Unable to delete product", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };
  return (
    <AdminLayout
      title="Products"
      description="Manage your store catalog"
      actions={
        <Button asChild>
          <Link to="/admin/products/new">
            <Plus />
            Add product
          </Link>
        </Button>
      }
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search products..." />
        </div>
        <Button variant="outline">Filter</Button>
      </div>
      {isLoading ? (
        <AdminTableSkeleton />
      ) : (
        <AdminTable
          columns={["Product", "Category", "Price", "Stock", "Featured", "Status", "Actions"]}
        >
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="min-w-56 px-4">
                <div className="flex items-center gap-3">
                  {product.images[0] ? (
                    <img
                      src={product.images[0].image_url}
                      alt={product.images[0].alt_text ?? product.name}
                      className="size-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="size-10 shrink-0 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-950" />
                  )}
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 text-muted-foreground">
                {product.category?.name ?? "Uncategorised"}
              </TableCell>
              <TableCell className="px-4">{money(product.price)}</TableCell>
              <TableCell className="px-4">
                <span
                  className={product.stock < product.low_stock_threshold ? "text-amber-300" : ""}
                >
                  {product.stock}
                </span>
              </TableCell>
              <TableCell className="px-4">
                {product.featured ? <CheckCircle2 className="size-4 text-teal" /> : "—"}
              </TableCell>
              <TableCell className="px-4">
                <StatusBadge
                  tone={
                    product.status === "active"
                      ? "success"
                      : product.status === "out_of_stock"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {statusLabel(product.status)}
                </StatusBadge>
              </TableCell>
              <TableCell className="px-4">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" aria-label="View" asChild>
                    <Link to="/products/$productId" params={{ productId: product.slug }}>
                      <Eye className="size-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Edit" asChild>
                    <Link to="/admin/products/$productId/edit" params={{ productId: product.id }}>
                      <Edit3 className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-300 hover:text-red-200"
                    onClick={() => void remove(product.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </AdminTable>
      )}
    </AdminLayout>
  );
}

export function ProductFormPage({ productId }: { productId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { direction } = useLocale();
  const { data: categories = [] } = useCategories();
  const { data: existing, isLoading } = useProduct(productId ?? "", Boolean(productId));
  const [form, setForm] = useState(empty);
  const [variantSetup, setVariantSetup] = useState<NewVariantSetup>(emptyVariantSetup);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const appendSelectedFiles = (event: Event) => {
      event.stopPropagation();
      const selected = Array.from((event.currentTarget as HTMLInputElement).files ?? []);
      setFiles((current) =>
        [...current, ...selected].slice(
          0,
          Math.max(0, MAX_PRODUCT_IMAGES - (existing?.images.length ?? 0)),
        ),
      );
      (event.currentTarget as HTMLInputElement).value = "";
    };
    input.addEventListener("change", appendSelectedFiles, true);
    return () => input.removeEventListener("change", appendSelectedFiles, true);
  }, [existing?.images.length]);
  useEffect(() => {
    if (existing && productId)
      setForm({
        name: existing.name,
        name_en: existing.name_en ?? existing.name,
        name_ar: existing.name_ar ?? "",
        slug: existing.slug,
        category_id: existing.category_id ?? "",
        price: Number(existing.price),
        compare_price: Number(existing.compare_price ?? 0),
        stock: existing.stock,
        low_stock_threshold: existing.low_stock_threshold,
        sku: existing.sku,
        description: existing.description ?? "",
        description_en: existing.description_en ?? existing.description ?? "",
        description_ar: existing.description_ar ?? "",
        short_description: existing.short_description ?? "",
        brand: existing.brand ?? "",
        featured: existing.featured,
        is_new: existing.is_new,
        is_best_seller: existing.is_best_seller,
        is_on_sale: existing.is_on_sale,
        is_active: existing.is_active,
        status: existing.status,
        weight: existing.weight ?? "",
        length: existing.length != null ? String(existing.length) : "",
        width: existing.width != null ? String(existing.width) : "",
        height: existing.height != null ? String(existing.height) : "",
        rating: String(existing.rating),
        meta_title: existing.meta_title ?? "",
        meta_description: existing.meta_description ?? "",
      });
  }, [existing, productId]);
  const source = form;
  const update = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) =>
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" ? { slug: createSlug(String(value)) } : {}),
    }));
  const submit = async (event: FormEvent, status: ProductStatus) => {
    event.preventDefault();
    if (!user) return;
    const values = { ...source, status };
    const englishName = values.name_en.trim() || values.name.trim();
    const slug = productId ? values.slug : createSlug(englishName);
    if (
      !englishName ||
      !slug ||
      !values.sku.trim() ||
      !values.category_id ||
      !Number.isFinite(values.price) ||
      !Number.isFinite(values.stock) ||
      !Number.isFinite(values.low_stock_threshold) ||
      !Number.isFinite(values.compare_price) ||
      !Number.isFinite(Number(values.rating)) ||
      ![values.length, values.width, values.height].every(
        (value) => value.trim() === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
      ) ||
      values.price < 0 ||
      values.stock < 0 ||
      values.low_stock_threshold < 0 ||
      values.compare_price < 0 ||
      !Number.isInteger(values.stock) ||
      !Number.isInteger(values.low_stock_threshold) ||
      Number(values.rating) < 0 ||
      Number(values.rating) > 5
    ) {
      toast.error("Complete all required product fields with valid values");
      return;
    }
    if (!productId && variantSetup.enabled) {
      if (!variantSetup.variants.length) {
        toast.error("Add at least one option value to generate variants");
        return;
      }
      const skuSet = new Set<string>();
      for (const variant of variantSetup.variants) {
        const price = Number(variant.price);
        const stock = Number(variant.stock);
        const weight = variant.weight.trim() === "" ? null : Number(variant.weight);
        const sku = variant.sku.trim().toLowerCase();
        if (
          !sku ||
          skuSet.has(sku) ||
          !Number.isFinite(price) ||
          price < 0 ||
          !Number.isFinite(stock) ||
          stock < 0 ||
          !Number.isInteger(stock) ||
          (weight !== null && (!Number.isFinite(weight) || weight < 0))
        ) {
          toast.error("Complete each generated variant with a unique SKU and valid values");
          return;
        }
        skuSet.add(sku);
      }
    }
    setSubmitting(true);
    const englishDescription = values.description_en.trim() || values.description.trim();
    const input: ProductInput = {
      category_id: values.category_id,
      name: englishName,
      name_en: englishName,
      name_ar: values.name_ar.trim() || null,
      slug,
      sku: values.sku.trim(),
      brand: values.brand.trim() || null,
      short_description: values.short_description.trim() || null,
      description: englishDescription || null,
      description_en: englishDescription || null,
      description_ar: values.description_ar.trim() || null,
      price: values.price,
      compare_price: values.compare_price || null,
      stock: values.stock,
      low_stock_threshold: values.low_stock_threshold,
      featured: values.featured,
      is_new: values.is_new,
      is_best_seller: values.is_best_seller,
      is_on_sale: values.is_on_sale,
      status: values.status,
      is_active: values.is_active,
      weight: values.weight.trim() || null,
      length: values.length.trim() === "" ? null : Number(values.length),
      width: values.width.trim() === "" ? null : Number(values.width),
      height: values.height.trim() === "" ? null : Number(values.height),
      rating: Number(values.rating),
      reviews_count: 0,
      meta_title: values.meta_title.trim() || null,
      meta_description: values.meta_description.trim() || null,
      created_by: user.id,
      updated_by: user.id,
    };
    try {
      if (existing) {
        await updateProduct(existing.id, { ...input, updated_by: user.id }, files, []);
        await queryClient.invalidateQueries({ queryKey: productKeys.all });
        toast.success(status === "active" ? "Product saved" : "Draft saved", {
          description: englishName,
        });
        navigate({ to: "/admin/products" });
      } else {
        const created = await createProduct(input, files);
        await queryClient.invalidateQueries({ queryKey: productKeys.all });
        if (created) {
          if (variantSetup.enabled) {
            for (const [index, variant] of variantSetup.variants.entries()) {
              const variantInput: VariantInput = {
                product_id: created.id,
                color: variant.color,
                size: variant.size,
                sku: variant.sku.trim(),
                price_override: Number(variant.price),
                stock: Number(variant.stock),
                barcode: null,
                weight: variant.weight.trim() === "" ? null : Number(variant.weight),
                is_default: index === 0,
                is_active: true,
              };
              const savedVariant = await createVariant(variantInput);
              if (variant.image) await uploadVariantImages(savedVariant.id, [variant.image]);
            }
            await queryClient.invalidateQueries({ queryKey: productKeys.all });
          }
          toast.success(variantSetup.enabled ? "Product and variants created" : "Product created", {
            description: englishName,
          });
          navigate({ to: "/admin/products/$productId/edit", params: { productId: created.id } });
        } else {
          // Fallback: creation succeeded but the follow-up read didn't return the
          // product (should not happen in practice). Preserve the previous
          // behavior rather than navigating somewhere we can't back up with data.
          toast.success(status === "active" ? "Product saved" : "Draft saved", {
            description: englishName,
          });
          navigate({ to: "/admin/products" });
        }
      }
    } catch (error) {
      toast.error("Unable to save product", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const removeImage = async (imageId: string) => {
    if (!existing) return;
    setRemovingImageId(imageId);
    try {
      await deleteProductImages([imageId]);
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(existing.id, true) });
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Image removed");
    } catch (error) {
      toast.error("Unable to remove image", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setRemovingImageId(null);
    }
  };
  const moveImage = async (imageId: string, direction: -1 | 1) => {
    if (!existing) return;
    const ids = existing.images.map((image) => image.id);
    const index = ids.indexOf(imageId);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await reorderProductImages(existing.id, ids);
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(existing.id, true) });
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
    } catch (error) {
      toast.error("Unable to reorder images", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };
  if (productId && isLoading)
    return (
      <AdminLayout title="Edit product" description="Update product information">
        <FormSkeleton />
      </AdminLayout>
    );
  return (
    <AdminLayout
      title={productId ? "Edit product" : "Add product"}
      description={productId ? "Update product information" : "Create a new catalog product"}
    >
      <AdminBackLink />
      <form
        className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]"
        dir={direction}
        onSubmit={(event) => void submit(event, "active")}
      >
        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Basic information</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field
                label="Product name (English)"
                value={source.name_en}
                onChange={(value) => {
                  update("name_en", value);
                  update("name", value);
                }}
              />
              <Field
                label="Product name (Arabic)"
                value={source.name_ar}
                onChange={(value) => update("name_ar", value)}
              />
              <Field label="Slug" value={source.slug} onChange={(value) => update("slug", value)} />
              <Field label="Brand" value={source.brand} onChange={(value) => update("brand", value)} />
              <Field label="SKU" value={source.sku} onChange={(value) => update("sku", value)} />
              <div>
                <Label>Category</Label>
                <select
                  className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={source.category_id}
                  onChange={(event) => update("category_id", event.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name_en ?? category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Descriptions</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Short description (English)</Label>
                <Textarea className="mt-2 min-h-20" value={source.short_description} onChange={(event) => update("short_description", event.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Description (English)</Label>
                <Textarea
                  className="mt-2 min-h-28"
                  value={source.description_en}
                  onChange={(event) => {
                    update("description_en", event.target.value);
                    update("description", event.target.value);
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description (Arabic)</Label>
                <Textarea
                  dir="rtl"
                  className="mt-2 min-h-28"
                  value={source.description_ar}
                  onChange={(event) => update("description_ar", event.target.value)}
                />
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Pricing</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field
                label="Price"
                type="number"
                value={source.price}
                onChange={(value) => update("price", Number(value))}
              />
              <Field
                label="Compare price"
                type="number"
                value={source.compare_price}
                onChange={(value) => update("compare_price", Number(value))}
              />
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Inventory</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Stock" type="number" step="1" min="0" value={source.stock} onChange={(value) => update("stock", Number(value))} />
              <Field label="Low stock threshold" type="number" step="1" min="0" value={source.low_stock_threshold} onChange={(value) => update("low_stock_threshold", Number(value))} />
              <Field label="Weight" placeholder="e.g. 250 g or 1.2 kg" value={source.weight} onChange={(value) => update("weight", value)} />
              <Field label="Length" type="number" min="0" step="0.01" value={source.length} onChange={(value) => update("length", value)} />
              <Field label="Width" type="number" min="0" step="0.01" value={source.width} onChange={(value) => update("width", value)} />
              <Field label="Height" type="number" min="0" step="0.01" value={source.height} onChange={(value) => update("height", value)} />
              <Field label="Rating" type="number" min="0" max="5" step="0.1" value={source.rating} onChange={(value) => update("rating", value)} />
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Media</h2>
            <p className="mt-1 text-xs text-muted-foreground">Add up to five product images.</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) =>
                setFiles(
                  Array.from(event.target.files ?? []).slice(
                    0,
                    Math.max(0, MAX_PRODUCT_IMAGES - (existing?.images.length ?? 0)),
                  ),
                )
              }
            />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {existing?.images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-lg border border-white/10"
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text ?? source.name}
                    className="size-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 bg-black/60 text-white hover:bg-black/80"
                    aria-label="Remove image"
                    disabled={removingImageId === image.id}
                    onClick={() => void removeImage(image.id)}
                  >
                    <X className="size-4" />
                  </Button>
                  <div className="absolute bottom-1 left-1 flex gap-1">
                    <Button type="button" variant="ghost" size="icon" className="size-7 bg-black/60 text-white hover:bg-black/80" aria-label="Move image earlier" onClick={() => void moveImage(image.id, -1)}>
                      <ArrowLeft className="size-3" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-7 bg-black/60 text-white hover:bg-black/80" aria-label="Move image later" onClick={() => void moveImage(image.id, 1)}>
                      <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {files.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="grid aspect-square place-items-center rounded-lg border border-dashed border-white/20 bg-white/[0.02] px-2 text-center text-[10px] text-muted-foreground transition-colors hover:border-teal hover:text-teal"
                >
                  {file.name}
                </button>
              ))}
              {Array.from(
                { length: Math.max(0, MAX_PRODUCT_IMAGES - (existing?.images.length ?? 0) - files.length) },
                (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="grid aspect-square place-items-center rounded-lg border border-dashed border-white/20 bg-white/[0.02] text-muted-foreground transition-colors hover:border-teal hover:text-teal"
                  >
                    <ImagePlus className="size-5" />
                    <span className="mt-1 text-[10px]">
                      Image {(existing?.images.length ?? 0) + files.length + index + 1}
                    </span>
                  </button>
                ),
              )}
            </div>
          </section>
          {existing ? (
            <VariantManagement product={existing} />
          ) : (
            <NewProductVariants
              setup={variantSetup}
              onChange={setVariantSetup}
              defaults={{
                price: "",
                stock: "0",
                sku: source.sku,
                weight: "",
              }}
            />
          )}
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">SEO</h2>
            <div className="mt-5 grid gap-5">
              <Field label="Meta title" value={source.meta_title} onChange={(value) => update("meta_title", value)} />
              <div><Label>Meta description</Label><Textarea className="mt-2 min-h-24" value={source.meta_description} onChange={(event) => update("meta_description", event.target.value)} /></div>
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Publishing</h2>
            <div className="mt-5 flex items-center justify-between">
              <div>
                <p className="text-sm">Featured product</p>
                <p className="text-xs text-muted-foreground">Show on your home page</p>
              </div>
              <Switch
                checked={source.featured}
                onCheckedChange={(value) => update("featured", value)}
              />
            </div>
            {[
              ["Active", "Make this product available in the catalog", "is_active"],
              ["New", "Mark as a new arrival", "is_new"],
              ["Best seller", "Highlight this product as a best seller", "is_best_seller"],
              ["On sale", "Show sale styling independently of compare price", "is_on_sale"],
            ].map(([label, help, key]) => (
              <div className="mt-5 flex items-center justify-between" key={key}>
                <div><p className="text-sm">{label}</p><p className="text-xs text-muted-foreground">{help}</p></div>
                <Switch checked={source[key as "is_active" | "is_new" | "is_best_seller" | "is_on_sale"]} onCheckedChange={(value) => update(key as "is_active" | "is_new" | "is_best_seller" | "is_on_sale", value)} />
              </div>
            ))}
            <div className="mt-5">
              <Label>Status</Label>
              <select
                className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={source.status}
                onChange={(event) => update("status", event.target.value as ProductStatus)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </div>
          </section>
          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={submitting}>
              <Upload />
              {submitting ? (files.length ? "Uploading images…" : "Saving…") : "Publish product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={(event) => void submit(event, "draft")}
            >
              <Save />
              Save draft
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate({ to: "/admin/products" })}
            >
              <X />
              Cancel
            </Button>
          </div>
        </aside>
      </form>
    </AdminLayout>
  );
}

function NewProductVariants({
  setup,
  onChange,
  defaults,
}: {
  setup: NewVariantSetup;
  onChange: (setup: NewVariantSetup) => void;
  defaults: Pick<NewVariantDraft, "price" | "stock" | "sku" | "weight">;
}) {
  const availableGroups = (["Color", "Size"] as const).filter(
    (name) => !setup.groups.some((group) => group.name === name),
  );
  const variantCount = useMemo(() => setup.variants.length, [setup.variants.length]);
  const updateGroups = (groups: VariantOptionGroup[]) =>
    onChange({
      ...setup,
      groups,
      variants: buildVariantDrafts(groups, setup.variants, defaults),
    });
  const addGroup = (name: VariantOptionName) =>
    updateGroups([...setup.groups, { name, values: [], value: "" }]);
  const addValue = (name: VariantOptionName) => {
    const group = setup.groups.find((candidate) => candidate.name === name);
    const value = group?.value.trim() ?? "";
    if (!value || group?.values.some((candidate) => candidate.toLowerCase() === value.toLowerCase()))
      return;
    updateGroups(
      setup.groups.map((candidate) =>
        candidate.name === name
          ? { ...candidate, values: [...candidate.values, value], value: "" }
          : candidate,
      ),
    );
  };
  const updateVariant = (key: string, patch: Partial<NewVariantDraft>) =>
    onChange({
      ...setup,
      variants: setup.variants.map((variant) =>
        variant.key === key ? { ...variant, ...patch } : variant,
      ),
    });

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Variants</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Create color and size combinations with their own price, inventory, SKU, weight, and image.
          </p>
        </div>
        <Switch
          checked={setup.enabled}
          onCheckedChange={(enabled) =>
            onChange(enabled ? { ...setup, enabled: true } : { ...setup, enabled: false })
          }
          aria-label="Enable variants"
        />
      </div>
      {setup.enabled && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            {availableGroups.map((name) => (
              <Button key={name} type="button" variant="outline" size="sm" onClick={() => addGroup(name)}>
                <Plus className="size-3.5" /> Add {name}
              </Button>
            ))}
          </div>
          {!setup.groups.length && (
            <p className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-muted-foreground">
              Add Color or Size, then enter the values you want to sell.
            </p>
          )}
          {setup.groups.map((group) => (
            <div key={group.name} className="rounded-lg border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <Label>{group.name}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-300 hover:text-red-200"
                  onClick={() => updateGroups(setup.groups.filter((candidate) => candidate.name !== group.name))}
                >
                  <Trash2 className="size-3.5" /> Remove
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  value={group.value}
                  placeholder={`Add a ${group.name.toLowerCase()} value`}
                  onChange={(event) =>
                    updateGroups(
                      setup.groups.map((candidate) =>
                        candidate.name === group.name ? { ...candidate, value: event.target.value } : candidate,
                      ),
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addValue(group.name);
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => addValue(group.name)}>
                  Add
                </Button>
              </div>
              {group.values.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.values.map((value) => (
                    <span key={value} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-xs">
                      {value}
                      <button
                        type="button"
                        aria-label={`Remove ${value}`}
                        className="text-muted-foreground hover:text-red-300"
                        onClick={() =>
                          updateGroups(
                            setup.groups.map((candidate) =>
                              candidate.name === group.name
                                ? { ...candidate, values: candidate.values.filter((item) => item !== value) }
                                : candidate,
                            ),
                          )
                        }
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {variantCount > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">Generated variants</h3>
                <span className="text-xs text-muted-foreground">{variantCount} combination{variantCount === 1 ? "" : "s"}</span>
              </div>
              <div className="space-y-3">
                {setup.variants.map((variant) => (
                  <div key={variant.key} className="grid gap-3 rounded-lg border border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-5">
                    <p className="self-center text-sm font-medium lg:col-span-1">
                      {[variant.color, variant.size].filter(Boolean).join(" / ")}
                    </p>
                    <Field label="Price" type="number" min="0" step="0.01" value={variant.price} onChange={(price) => updateVariant(variant.key, { price })} />
                    <Field label="Stock" type="number" min="0" step="1" value={variant.stock} onChange={(stock) => updateVariant(variant.key, { stock })} />
                    <Field label="SKU" value={variant.sku} onChange={(sku) => updateVariant(variant.key, { sku })} />
                    <div>
                      <Label>Weight (kg)</Label>
                      <Input className="mt-2" type="number" min="0" step="0.001" value={variant.weight} onChange={(event) => updateVariant(variant.key, { weight: event.target.value })} />
                      <Label className="mt-3 block">Image</Label>
                      <Input className="mt-2 h-auto py-1.5 text-xs" type="file" accept="image/*" onChange={(event) => updateVariant(variant.key, { image: event.target.files?.[0] ?? null })} />
                      {variant.image && <p className="mt-1 truncate text-[10px] text-muted-foreground">{variant.image.name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
function Field({
  label,
  value,
  type = "text",
  step,
  min,
  max,
  placeholder,
  onChange,
}: {
  label: string;
  value: string | number;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        className="mt-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
