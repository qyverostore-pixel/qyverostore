import { useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Edit3, GripVertical, Images, Loader2, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { productKeys } from "@/hooks/use-products";
import {
  createVariant,
  deleteVariant,
  deleteVariantImage,
  reorderVariantImages,
  updateVariant,
  uploadVariantImages,
  type ProductVariant,
  type StoreProduct,
  type VariantInput,
} from "@/services/products";

const MAX_VARIANT_IMAGES = 10;
const money = (value: number) => `$${Number(value).toLocaleString()}`;

type VariantFormState = {
  color: string;
  size: string;
  sku: string;
  price_override: string;
  stock: string;
  barcode: string;
  weight: string;
  is_active: boolean;
};

const emptyVariantForm: VariantFormState = {
  color: "",
  size: "",
  sku: "",
  price_override: "",
  stock: "0",
  barcode: "",
  weight: "",
  is_active: true,
};

function toFormState(variant: ProductVariant): VariantFormState {
  return {
    color: variant.color ?? "",
    size: variant.size ?? "",
    sku: variant.sku ?? "",
    price_override: variant.price_override != null ? String(variant.price_override) : "",
    stock: String(variant.stock),
    barcode: variant.barcode ?? "",
    weight: variant.weight != null ? String(variant.weight) : "",
    is_active: variant.is_active,
  };
}

function validateVariant(
  form: VariantFormState,
  siblings: ProductVariant[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  const sku = form.sku.trim();
  if (!sku) errors.sku = "SKU is required.";

  const stock = Number(form.stock);
  if (form.stock.trim() === "" || !Number.isFinite(stock) || stock < 0) {
    errors.stock = "Stock must be zero or a positive number.";
  }

  if (form.price_override.trim() !== "") {
    const price = Number(form.price_override);
    if (!Number.isFinite(price) || price < 0) {
      errors.price_override = "Price override must be zero or a positive number.";
    }
  }

  if (form.weight.trim() !== "") {
    const weight = Number(form.weight);
    if (!Number.isFinite(weight) || weight < 0) {
      errors.weight = "Weight must be zero or a positive number.";
    }
  }

  if (
    sku &&
    siblings.some((variant) => (variant.sku ?? "").trim().toLowerCase() === sku.toLowerCase())
  ) {
    errors.sku = "Another variant already uses this SKU.";
  }

  const color = form.color.trim().toLowerCase();
  const size = form.size.trim().toLowerCase();
  const duplicateCombo = siblings.some(
    (variant) =>
      (variant.color ?? "").trim().toLowerCase() === color &&
      (variant.size ?? "").trim().toLowerCase() === size,
  );
  if (duplicateCombo) {
    errors.color = "A variant with this color and size already exists.";
    errors.size = "A variant with this color and size already exists.";
  }

  return errors;
}

// Surfaces the underlying Postgres unique-constraint violation (e.g. a SKU
// or barcode collision with a variant on a *different* product, which the
// client-side check above can't see) as a friendly, field-specific message.
function friendlyServiceError(error: unknown): { field?: "sku" | "barcode"; message: string } {
  const message = error instanceof Error ? error.message : "Please try again.";
  if (message.includes("product_variants_sku_idx") || message.includes("sku")) {
    return { field: "sku", message: "This SKU is already used by another variant in the store." };
  }
  if (message.includes("product_variants_barcode_idx") || message.includes("barcode")) {
    return { field: "barcode", message: "This barcode is already used by another variant." };
  }
  return { message };
}

export function VariantManagement({ product }: { product: StoreProduct }) {
  const queryClient = useQueryClient();
  const variants = product.variants;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VariantFormState>(emptyVariantForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProductVariant | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [imagesTargetId, setImagesTargetId] = useState<string | null>(null);
  const imagesVariant = variants.find((variant) => variant.id === imagesTargetId) ?? null;
  const [uploading, setUploading] = useState(false);
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editingVariant = variants.find((variant) => variant.id === editingId) ?? null;

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: productKeys.detail(product.id, true) }),
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
    ]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyVariantForm);
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (variant: ProductVariant) => {
    setEditingId(variant.id);
    setForm(toFormState(variant));
    setFormErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
  };

  const update = <K extends keyof VariantFormState>(key: K, value: VariantFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const siblings = editingVariant
      ? variants.filter((variant) => variant.id !== editingVariant.id)
      : variants;
    const errors = validateVariant(form, siblings);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      toast.error("Fix the highlighted fields before saving.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingVariant) {
        await updateVariant(editingVariant.id, {
          color: form.color.trim() || null,
          size: form.size.trim() || null,
          sku: form.sku.trim(),
          price_override: form.price_override.trim() === "" ? null : Number(form.price_override),
          stock: Number(form.stock),
          barcode: form.barcode.trim() || null,
          weight: form.weight.trim() === "" ? null : Number(form.weight),
          is_active: form.is_active,
        });
      } else {
        const input: VariantInput = {
          product_id: product.id,
          color: form.color.trim() || null,
          size: form.size.trim() || null,
          sku: form.sku.trim(),
          price_override: form.price_override.trim() === "" ? null : Number(form.price_override),
          stock: Number(form.stock),
          barcode: form.barcode.trim() || null,
          weight: form.weight.trim() === "" ? null : Number(form.weight),
          is_default: false,
          is_active: form.is_active,
        };
        await createVariant(input);
      }
      await invalidate();
      toast.success(editingVariant ? "Variant updated" : "Variant added");
      setDialogOpen(false);
    } catch (error) {
      const { field, message } = friendlyServiceError(error);
      if (field) setFormErrors((current) => ({ ...current, [field]: message }));
      toast.error("Unable to save variant", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVariant(deleteTarget.id);
      await invalidate();
      toast.success("Variant deleted");
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Unable to delete variant", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const onFilesSelected = async (files: FileList | null) => {
    if (!files || !imagesVariant) return;
    const remaining = Math.max(0, MAX_VARIANT_IMAGES - imagesVariant.images.length);
    const list = Array.from(files).slice(0, remaining);
    if (!list.length) {
      toast.error(`A variant can have at most ${MAX_VARIANT_IMAGES} images.`);
      return;
    }
    setUploading(true);
    try {
      await uploadVariantImages(imagesVariant.id, list, {
        startSortOrder: imagesVariant.images.length,
        hasPrimary: imagesVariant.images.some((image) => image.is_primary),
      });
      await invalidate();
      toast.success(list.length > 1 ? "Images uploaded" : "Image uploaded");
    } catch (error) {
      toast.error("Unable to upload images", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = async (imageId: string) => {
    setRemovingImageId(imageId);
    try {
      await deleteVariantImage(imageId);
      await invalidate();
      toast.success("Image removed");
    } catch (error) {
      toast.error("Unable to remove image", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setRemovingImageId(null);
    }
  };

  const setCover = async (imageId: string) => {
    if (!imagesVariant) return;
    const ids = imagesVariant.images.map((image) => image.id);
    const next = [imageId, ...ids.filter((id) => id !== imageId)];
    try {
      await reorderVariantImages(imagesVariant.id, next);
      await invalidate();
    } catch (error) {
      toast.error("Unable to set cover image", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const onDrop = async (targetId: string) => {
    if (!imagesVariant || !draggedImageId || draggedImageId === targetId) {
      setDraggedImageId(null);
      return;
    }
    const ids = imagesVariant.images.map((image) => image.id);
    const from = ids.indexOf(draggedImageId);
    const to = ids.indexOf(targetId);
    setDraggedImageId(null);
    if (from === -1 || to === -1) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, draggedImageId);
    try {
      await reorderVariantImages(imagesVariant.id, next);
      await invalidate();
    } catch (error) {
      toast.error("Unable to reorder images", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Variants</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Color, size, and stock combinations for this product.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus />
          Add variant
        </Button>
      </div>

      <div className="mt-5">
        {variants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">
            No variants yet. Add one to start tracking color, size, and stock separately.
          </div>
        ) : (
          <AdminTable
            columns={["Color", "Size", "SKU", "Price", "Stock", "Status", "Default", "Actions"]}
          >
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell className="px-4">{variant.color || "—"}</TableCell>
                <TableCell className="px-4">{variant.size || "—"}</TableCell>
                <TableCell className="px-4 text-muted-foreground">{variant.sku || "—"}</TableCell>
                <TableCell className="px-4">
                  {variant.price_override != null ? (
                    money(variant.price_override)
                  ) : (
                    <span className="text-muted-foreground">
                      {money(product.price)} (inherited)
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4">{variant.stock}</TableCell>
                <TableCell className="px-4">
                  <StatusBadge tone={variant.is_active ? "success" : "neutral"}>
                    {variant.is_active ? "Active" : "Inactive"}
                  </StatusBadge>
                </TableCell>
                <TableCell className="px-4">
                  {variant.is_default ? <StatusBadge tone="info">Default</StatusBadge> : "—"}
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Edit variant"
                      onClick={() => openEdit(variant)}
                    >
                      <Edit3 className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Manage images"
                      onClick={() => setImagesTargetId(variant.id)}
                    >
                      <Images className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-300 hover:text-red-200 disabled:text-muted-foreground/40"
                      aria-label="Delete variant"
                      disabled={variant.is_default}
                      title={
                        variant.is_default
                          ? "The default variant can't be deleted."
                          : "Delete variant"
                      }
                      onClick={() => setDeleteTarget(variant)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </AdminTable>
        )}
      </div>

      {/* Add / edit variant */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVariant ? "Edit variant" : "Add variant"}</DialogTitle>
            <DialogDescription>
              {editingVariant
                ? "Update this variant's details."
                : "Create a new color/size combination for this product."}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
            <VariantField
              label="Color"
              value={form.color}
              onChange={(value) => update("color", value)}
              error={formErrors.color}
            />
            <VariantField
              label="Size"
              value={form.size}
              onChange={(value) => update("size", value)}
              error={formErrors.size}
            />
            <VariantField
              label="SKU"
              value={form.sku}
              onChange={(value) => update("sku", value)}
              error={formErrors.sku}
            />
            <VariantField
              label="Barcode"
              value={form.barcode}
              onChange={(value) => update("barcode", value)}
              error={formErrors.barcode}
            />
            <VariantField
              label="Price override"
              type="number"
              step="0.01"
              placeholder={`Inherit product price (${money(product.price)})`}
              value={form.price_override}
              onChange={(value) => update("price_override", value)}
              error={formErrors.price_override}
            />
            <VariantField
              label="Stock"
              type="number"
              step="1"
              value={form.stock}
              onChange={(value) => update("stock", value)}
              error={formErrors.stock}
            />
            <VariantField
              label="Weight (kg)"
              type="number"
              step="0.001"
              value={form.weight}
              onChange={(value) => update("weight", value)}
              error={formErrors.weight}
            />
            <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
              <div>
                <p className="text-sm">Active</p>
                <p className="text-xs text-muted-foreground">Visible for purchase</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(value) => update("is_active", value)}
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {editingVariant ? "Save changes" : "Add variant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete variant?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `This removes "${[deleteTarget.color, deleteTarget.size].filter(Boolean).join(" / ") || deleteTarget.sku}" and its images. This can't be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void performDelete()}
              disabled={deleting}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage images */}
      <Dialog
        open={Boolean(imagesTargetId)}
        onOpenChange={(open) => !open && setImagesTargetId(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage images</DialogTitle>
            <DialogDescription>
              {imagesVariant
                ? `Images for ${[imagesVariant.color, imagesVariant.size].filter(Boolean).join(" / ") || imagesVariant.sku || "this variant"}. Drag to reorder — the first image is the cover.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {imagesVariant && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => void onFilesSelected(event.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || imagesVariant.images.length >= MAX_VARIANT_IMAGES}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Upload images
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                {imagesVariant.images.length}/{MAX_VARIANT_IMAGES} images
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imagesVariant.images.length === 0 ? (
                  <div className="col-span-full rounded-lg border border-dashed border-white/15 p-6 text-center text-xs text-muted-foreground">
                    No images yet for this variant.
                  </div>
                ) : (
                  imagesVariant.images.map((image) => (
                    <div
                      key={image.id}
                      draggable
                      onDragStart={() => setDraggedImageId(image.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => void onDrop(image.id)}
                      className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg border ${
                        image.is_primary ? "border-teal" : "border-white/10"
                      } ${draggedImageId === image.id ? "opacity-40" : ""}`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text ?? "Variant image"}
                        className="size-full object-cover"
                      />
                      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-1">
                        <span className="rounded bg-black/60 p-1 text-white/70">
                          <GripVertical className="size-3.5" />
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 bg-black/60 text-white hover:bg-black/80"
                          aria-label="Remove image"
                          disabled={removingImageId === image.id}
                          onClick={() => void removeImage(image.id)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={() => void setCover(image.id)}
                        disabled={image.is_primary}
                        className={`absolute bottom-1 left-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          image.is_primary
                            ? "bg-teal text-black"
                            : "bg-black/60 text-white/80 hover:bg-black/80"
                        }`}
                      >
                        <Star
                          className="size-3"
                          fill={image.is_primary ? "currentColor" : "none"}
                        />
                        {image.is_primary ? "Cover" : "Set as cover"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setImagesTargetId(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function VariantField({
  label,
  value,
  type = "text",
  step,
  placeholder,
  onChange,
  error,
}: {
  label: string;
  value: string;
  type?: string;
  step?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        step={step}
        placeholder={placeholder}
        className="mt-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}