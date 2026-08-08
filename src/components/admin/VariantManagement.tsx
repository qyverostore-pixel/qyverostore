import { useMemo, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  CheckCircle2,
  Copy,
  Edit3,
  GripVertical,
  Images,
  Layers,
  Loader2,
  MoreVertical,
  PackageX,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  Wand2,
  X,
  XCircle,
} from "lucide-react";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
const selectClassName = "h-9 rounded-md border border-input bg-background px-2 text-sm";

// --- form state --------------------------------------------------------

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

function isUniqueViolation(error: unknown, key: "sku" | "barcode") {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes(`product_variants_${key}_idx`) || message.includes(key);
}

// Creates a variant, transparently working around SKU/barcode collisions
// that only the database can detect (e.g. a SKU already used on another
// product). Used by both the bulk generator and "Duplicate variant" so
// neither has to hand-roll retry logic. Calls only the existing
// `createVariant` service — no service-layer changes.
async function createVariantResilient(base: VariantInput): Promise<ProductVariant> {
  let payload = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await createVariant(payload);
    } catch (error) {
      if (isUniqueViolation(error, "sku")) {
        payload = { ...payload, sku: `${base.sku}-${randomSuffix()}` };
        continue;
      }
      if (payload.barcode && isUniqueViolation(error, "barcode")) {
        payload = { ...payload, barcode: null };
        continue;
      }
      throw error;
    }
  }
  throw new Error("Could not generate a unique SKU after several attempts.");
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function slugPart(value: string) {
  return (
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 6) || "VAR"
  );
}

function buildGeneratedSku(base: string, color: string, size: string) {
  return [slugPart(base), slugPart(color), slugPart(size)].filter(Boolean).join("-");
}

function comboKey(color: string | null, size: string | null) {
  return `${(color ?? "").trim().toLowerCase()}__${(size ?? "").trim().toLowerCase()}`;
}

function parseLines(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/\r?\n|,/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  );
}

// --- filters / sorting ---------------------------------------------------

type FilterValue = "all" | "active" | "inactive" | "low_stock" | "out_of_stock" | "default";
type SortField = "color" | "size" | "sku" | "price" | "stock";
type SortDir = "asc" | "desc";

function matchesSearch(variant: ProductVariant, query: string) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    (variant.sku ?? "").toLowerCase().includes(q) ||
    (variant.color ?? "").toLowerCase().includes(q) ||
    (variant.size ?? "").toLowerCase().includes(q)
  );
}

function matchesFilter(variant: ProductVariant, filter: FilterValue, threshold: number) {
  switch (filter) {
    case "active":
      return variant.is_active;
    case "inactive":
      return !variant.is_active;
    case "low_stock":
      return variant.stock > 0 && variant.stock <= threshold;
    case "out_of_stock":
      return variant.stock <= 0;
    case "default":
      return variant.is_default;
    default:
      return true;
  }
}

function compareVariants(
  a: ProductVariant,
  b: ProductVariant,
  field: SortField,
  dir: SortDir,
  productPrice: number,
) {
  let result = 0;
  switch (field) {
    case "color":
      result = (a.color ?? "").localeCompare(b.color ?? "");
      break;
    case "size":
      result = (a.size ?? "").localeCompare(b.size ?? "");
      break;
    case "sku":
      result = (a.sku ?? "").localeCompare(b.sku ?? "");
      break;
    case "price":
      result = (a.price_override ?? productPrice) - (b.price_override ?? productPrice);
      break;
    case "stock":
      result = a.stock - b.stock;
      break;
  }
  return dir === "asc" ? result : -result;
}

function stockTone(stock: number, threshold: number): "success" | "warning" | "danger" {
  if (stock <= 0) return "danger";
  if (stock <= threshold) return "warning";
  return "success";
}

// --- component -------------------------------------------------------------

export function VariantManagement({ product }: { product: StoreProduct }) {
  const queryClient = useQueryClient();
  const variants = product.variants;
  const threshold = product.low_stock_threshold;

  // toolbar
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sortField, setSortField] = useState<SortField>("color");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // add/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VariantFormState>(emptyVariantForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ProductVariant | null>(null);
  const [deleting, setDeleting] = useState(false);

  // per-row quick action (enable/disable/default/duplicate) loading flag
  const [rowActionId, setRowActionId] = useState<string | null>(null);

  // bulk generator
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [colorsText, setColorsText] = useState("");
  const [sizesText, setSizesText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  // manage images dialog
  const [imagesTargetId, setImagesTargetId] = useState<string | null>(null);
  const imagesVariant = variants.find((variant) => variant.id === imagesTargetId) ?? null;
  const [uploading, setUploading] = useState(false);
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editingVariant = variants.find((variant) => variant.id === editingId) ?? null;

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: productKeys.detail(product.id, true) }),
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
    ]);

  // --- derived data --------------------------------------------------------

  const summary = useMemo(
    () =>
      variants.reduce(
        (acc, variant) => {
          acc.total += 1;
          acc.totalStock += variant.stock;
          if (variant.is_active) acc.active += 1;
          else acc.inactive += 1;
          if (variant.stock <= 0) acc.outOfStock += 1;
          else if (variant.stock <= threshold) acc.lowStock += 1;
          return acc;
        },
        { total: 0, totalStock: 0, active: 0, inactive: 0, lowStock: 0, outOfStock: 0 },
      ),
    [variants, threshold],
  );

  const visibleVariants = useMemo(
    () =>
      variants
        .filter(
          (variant) => matchesSearch(variant, search) && matchesFilter(variant, filter, threshold),
        )
        .sort((a, b) => compareVariants(a, b, sortField, sortDir, product.price)),
    [variants, search, filter, threshold, sortField, sortDir, product.price],
  );

  // --- add / edit dialog ---------------------------------------------------

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

  // --- delete ---------------------------------------------------------------

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

  // --- quick actions ---------------------------------------------------------

  const toggleActive = async (variant: ProductVariant) => {
    setRowActionId(variant.id);
    try {
      await updateVariant(variant.id, { is_active: !variant.is_active });
      await invalidate();
      toast.success(variant.is_active ? "Variant disabled" : "Variant enabled");
    } catch (error) {
      toast.error("Unable to update variant", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setRowActionId(null);
    }
  };

  const markAsDefault = async (variant: ProductVariant) => {
    if (variant.is_default) return;
    const currentDefault = variants.find((candidate) => candidate.is_default) ?? null;
    setRowActionId(variant.id);
    try {
      // Clear the old default first: the database only allows one
      // `is_default = true` row per product, so setting the new one first
      // would be rejected.
      if (currentDefault && currentDefault.id !== variant.id) {
        await updateVariant(currentDefault.id, { is_default: false });
      }
      try {
        await updateVariant(variant.id, { is_default: true });
      } catch (error) {
        if (currentDefault) {
          await updateVariant(currentDefault.id, { is_default: true }).catch(() => undefined);
        }
        throw error;
      }
      await invalidate();
      toast.success("Default variant updated");
    } catch (error) {
      toast.error("Unable to set default variant", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setRowActionId(null);
    }
  };

  const duplicateVariant = async (variant: ProductVariant) => {
    setRowActionId(variant.id);
    try {
      const created = await createVariantResilient({
        product_id: product.id,
        color: variant.color,
        size: variant.size,
        sku: `${slugPart(variant.sku ?? product.sku)}-COPY-${randomSuffix()}`,
        price_override: variant.price_override,
        stock: 0,
        barcode: variant.barcode,
        weight: variant.weight,
        is_default: false,
        is_active: variant.is_active,
      });

      if (variant.images.length) {
        const files: File[] = [];
        let skippedImages = 0;
        for (const image of variant.images) {
          try {
            const response = await fetch(image.image_url);
            const blob = await response.blob();
            const name = image.storage_path?.split("/").pop() ?? `${created.id}.jpg`;
            files.push(new File([blob], name, { type: blob.type || "image/jpeg" }));
          } catch {
            skippedImages += 1;
          }
        }
        if (files.length) await uploadVariantImages(created.id, files, { hasPrimary: false });
        if (skippedImages) {
          toast.error(
            `${skippedImages} image${skippedImages === 1 ? "" : "s"} could not be copied.`,
          );
        }
      }

      await invalidate();
      toast.success("Variant duplicated", {
        description: "Stock was reset to 0 — update it when ready.",
      });
    } catch (error) {
      toast.error("Unable to duplicate variant", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setRowActionId(null);
    }
  };

  // --- bulk generator ---------------------------------------------------------

  const runGenerate = async () => {
    const colors = parseLines(colorsText);
    const sizes = parseLines(sizesText);
    if (!colors.length || !sizes.length) {
      toast.error("Enter at least one color and one size.");
      return;
    }
    const existingCombos = new Set(
      variants.map((variant) => comboKey(variant.color, variant.size)),
    );
    const combos: { color: string; size: string }[] = [];
    for (const color of colors) {
      for (const size of sizes) {
        const key = comboKey(color, size);
        if (existingCombos.has(key)) continue;
        existingCombos.add(key);
        combos.push({ color, size });
      }
    }
    const skipped = colors.length * sizes.length - combos.length;
    if (!combos.length) {
      toast.error("All of those color and size combinations already exist.");
      return;
    }

    setGenerating(true);
    setGenerateProgress({ done: 0, total: combos.length });
    let created = 0;
    let failed = 0;
    for (const combo of combos) {
      try {
        await createVariantResilient({
          product_id: product.id,
          color: combo.color,
          size: combo.size,
          sku: buildGeneratedSku(product.sku, combo.color, combo.size),
          price_override: null,
          stock: 0,
          barcode: null,
          weight: null,
          is_default: false,
          is_active: true,
        });
        created += 1;
      } catch {
        failed += 1;
      }
      setGenerateProgress((current) =>
        current ? { ...current, done: current.done + 1 } : current,
      );
    }
    await invalidate();
    setGenerating(false);
    setGenerateProgress(null);
    toast.success(`Generated ${created} variant${created === 1 ? "" : "s"}`, {
      description:
        [
          skipped
            ? `${skipped} combination${skipped === 1 ? "" : "s"} already existed and were skipped.`
            : null,
          failed ? `${failed} failed to create.` : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined,
    });
    if (created > 0) {
      setColorsText("");
      setSizesText("");
      setGeneratorOpen(false);
    }
  };

  // --- images ---------------------------------------------------------------

  const onFilesSelected = async (files: FileList | null) => {
    if (!files || !files.length || !imagesVariant) return;
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

  const onDropImage = async (targetId: string) => {
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

  const closeImagesDialog = () => {
    setImagesTargetId(null);
    setPreviewImageId(null);
  };

  const previewImage = imagesVariant?.images.find((image) => image.id === previewImageId) ?? null;

  // --- render ---------------------------------------------------------------

  const summaryCards: {
    label: string;
    value: number;
    icon: typeof Boxes;
    accent?: string;
  }[] = [
    { label: "Total Variants", value: summary.total, icon: Boxes },
    { label: "Total Stock", value: summary.totalStock, icon: Layers },
    {
      label: "Active Variants",
      value: summary.active,
      icon: CheckCircle2,
      accent: "text-emerald-300",
    },
    {
      label: "Inactive Variants",
      value: summary.inactive,
      icon: XCircle,
      accent: "text-muted-foreground",
    },
    {
      label: "Low Stock Variants",
      value: summary.lowStock,
      icon: AlertTriangle,
      accent: "text-amber-300",
    },
    {
      label: "Out Of Stock Variants",
      value: summary.outOfStock,
      icon: PackageX,
      accent: "text-red-300",
    },
  ];

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Variants</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Color, size, and stock combinations for this product.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setGeneratorOpen(true)}>
            <Wand2 />
            Generate variants
          </Button>
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus />
            Add variant
          </Button>
        </div>
      </div>

      {/* Inventory summary */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <Icon className={`size-3.5 ${accent ?? "text-teal"}`} />
            </div>
            <p className={`mt-2 text-xl font-semibold tracking-tight ${accent ?? ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar: search / filter / sort */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search SKU, color, size…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={selectClassName}
            value={filter}
            onChange={(event) => setFilter(event.target.value as FilterValue)}
            aria-label="Filter variants"
          >
            <option value="all">All variants</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="default">Default variant</option>
          </select>
          <select
            className={selectClassName}
            value={sortField}
            onChange={(event) => setSortField(event.target.value as SortField)}
            aria-label="Sort variants by"
          >
            <option value="color">Sort: Color</option>
            <option value="size">Sort: Size</option>
            <option value="sku">Sort: SKU</option>
            <option value="price">Sort: Price</option>
            <option value="stock">Sort: Stock</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Toggle sort direction"
            onClick={() => setSortDir((current) => (current === "asc" ? "desc" : "asc"))}
          >
            {sortDir === "asc" ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {variants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">
            No variants yet. Add one, or generate a batch from colors and sizes.
          </div>
        ) : visibleVariants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">
            No variants match your search or filter.
          </div>
        ) : (
          <AdminTable
            columns={["Color", "Size", "SKU", "Price", "Stock", "Status", "Default", "Actions"]}
          >
            {visibleVariants.map((variant) => (
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
                <TableCell className="px-4">
                  <StatusBadge tone={stockTone(variant.stock, threshold)}>
                    {variant.stock}
                    {variant.stock <= 0
                      ? " · out of stock"
                      : variant.stock <= threshold
                        ? " · low"
                        : ""}
                  </StatusBadge>
                </TableCell>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="More actions"
                          disabled={rowActionId === variant.id}
                        >
                          {rowActionId === variant.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <MoreVertical className="size-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => void toggleActive(variant)}>
                          {variant.is_active ? "Disable variant" : "Enable variant"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={variant.is_default}
                          onClick={() => void markAsDefault(variant)}
                        >
                          Mark as default
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void duplicateVariant(variant)}>
                          <Copy className="size-3.5" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={variant.is_default}
                          className="text-red-300 focus:text-red-200"
                          onClick={() => setDeleteTarget(variant)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </AdminTable>
        )}
      </div>

      {/* Generate variants */}
      <Dialog open={generatorOpen} onOpenChange={(open) => !generating && setGeneratorOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate variants</DialogTitle>
            <DialogDescription>
              One color or size per line. Existing combinations are skipped automatically, and new
              variants start with 0 stock.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Colors</Label>
              <Textarea
                rows={6}
                className="mt-2"
                placeholder={"Black\nBrown\nWhite\nBlue"}
                value={colorsText}
                onChange={(event) => setColorsText(event.target.value)}
                disabled={generating}
              />
            </div>
            <div>
              <Label>Sizes</Label>
              <Textarea
                rows={6}
                className="mt-2"
                placeholder={"S\nM\nL\nXL"}
                value={sizesText}
                onChange={(event) => setSizesText(event.target.value)}
                disabled={generating}
              />
            </div>
          </div>
          {generateProgress && (
            <p className="text-xs text-muted-foreground">
              Creating variant {generateProgress.done} of {generateProgress.total}…
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setGeneratorOpen(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void runGenerate()} disabled={generating}>
              {generating && <Loader2 className="size-4 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      <Dialog open={Boolean(imagesTargetId)} onOpenChange={(open) => !open && closeImagesDialog()}>
        <DialogContent className="relative sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage images</DialogTitle>
            <DialogDescription>
              {imagesVariant
                ? `Images for ${[imagesVariant.color, imagesVariant.size].filter(Boolean).join(" / ") || imagesVariant.sku || "this variant"}. Drag thumbnails to reorder — the first image is the cover.`
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
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingFiles(true);
                }}
                onDragLeave={() => setIsDraggingFiles(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingFiles(false);
                  if (event.dataTransfer.files?.length)
                    void onFilesSelected(event.dataTransfer.files);
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-xs transition-colors ${
                  isDraggingFiles
                    ? "border-teal bg-teal/5 text-teal"
                    : "border-white/15 text-muted-foreground"
                }`}
              >
                <Upload className="size-5" />
                <p>Drag & drop images here, or</p>
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
                  Browse files
                </Button>
                <p>
                  {imagesVariant.images.length}/{MAX_VARIANT_IMAGES} images
                </p>
              </div>
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
                      onDrop={() => void onDropImage(image.id)}
                      className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg border ${
                        image.is_primary ? "border-teal" : "border-white/10"
                      } ${draggedImageId === image.id ? "opacity-40" : ""}`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text ?? "Variant image"}
                        className="size-full object-cover"
                        onClick={() => setPreviewImageId(image.id)}
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
          {previewImage && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-black/90 p-6"
              onClick={() => setPreviewImageId(null)}
            >
              <img
                src={previewImage.image_url}
                alt={previewImage.alt_text ?? "Preview"}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                onClick={() => setPreviewImageId(null)}
                aria-label="Close preview"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeImagesDialog}>
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