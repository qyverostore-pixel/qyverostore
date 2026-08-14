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
import { useEffect, useRef, useState, type FormEvent } from "react";
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
  deleteProduct,
  deleteProductImages,
  reorderProductImages,
  updateProduct,
  type ProductInput,
  type ProductStatus,
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
          toast.success("Product created. You can now add variants.", {
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
            <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
              <h2 className="font-medium">Variants</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Save this product first, then come back here to manage color, size, and stock
                variants.
              </p>
            </section>
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
