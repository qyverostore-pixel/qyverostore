import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  Edit3,
  Eye,
  ImagePlus,
  MoreHorizontal,
  PackagePlus,
  Plus,
  Save,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout, AdminBackLink } from "@/components/admin/AdminLayout";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { supabase } from "@/lib/supabase";
import { adminMessages, adminProducts, type AdminProduct } from "@/data/admin";
import { categories } from "@/data/categories";
import {
  deleteCategory,
  updateCategory,
  type AdminCategory,
  type CategoryInput,
} from "@/services/products";
import {
  deleteOrder,
  getAdminAnalytics,
  getAdminCustomers,
  getAdminDashboard,
  getAdminOrders,
  getStoreSettings,
  reviewPayment,
  saveStoreSettings,
  updateOrderStatus,
  uploadStoreLogo,
  type AdminOrderStatus,
  type AnalyticsPeriod,
  type StoreSettings,
} from "@/services/admin";

const money = (value: number) => `$${value.toLocaleString()}`;
const orderTone = (status: string) =>
  (({
    pending: "warning",
    confirmed: "info",
    shipped: "info",
    delivered: "success",
    cancelled: "danger",
    Pending: "warning",
    Confirmed: "info",
    Shipped: "info",
    Delivered: "success",
    Cancelled: "danger",
  })[status] ?? "neutral") as "warning" | "info" | "success" | "danger" | "neutral";
const paymentTone = (status: string) =>
  (({ unpaid: "warning", waiting_review: "info", paid: "success", rejected: "danger" })[status] ??
    "neutral") as "warning" | "info" | "success" | "danger" | "neutral";
const orderLabel = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function ActionButtons({ editTo, onDelete }: { editTo?: string; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" aria-label="View">
        <Eye className="size-4" />
      </Button>
      {editTo && (
        <Button variant="ghost" size="icon" asChild>
          <Link
            to={editTo as "/admin/products/$productId/edit"}
            params={{ productId: editTo.split("/")[3] }}
            aria-label="Edit"
          >
            <Edit3 className="size-4" />
          </Link>
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="text-red-300 hover:text-red-200"
        onClick={onDelete}
        aria-label="Delete"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboard,
  });
  const stats =
    data?.stats ??
    ["Total Products", "Total Categories", "Total Orders", "Total Customers", "Total Revenue"].map(
      (label) => ({ label, value: isLoading ? "Loading..." : "0", change: "" }),
    );
  return (
    <AdminLayout title="Dashboard" description="A live overview of your QYVERO store">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="rounded-lg bg-teal/10 p-2 text-teal">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-2 text-xs text-emerald-300">
              {stat.change} <span className="text-muted-foreground">vs last month</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-medium">Recent orders</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest transactions from your store
              </p>
            </div>
            <Link to="/admin/orders" className="text-xs text-teal hover:text-teal/80">
              View all
            </Link>
          </div>
          <AdminTable columns={["Order", "Customer", "Total", "Status"]}>
            {isLoading ? (
              <TableRow>
                <TableCell className="px-4 text-muted-foreground" colSpan={4}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.recentOrders.length ? (
              data.recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="px-4 font-medium">{order.order_number}</TableCell>
                  <TableCell className="px-4">
                    {order.customer_name ?? order.customer_email ?? "—"}
                  </TableCell>
                  <TableCell className="px-4">{money(order.total_amount)}</TableCell>
                  <TableCell className="px-4">
                    <StatusBadge tone={orderTone(order.status)}>
                      {orderLabel(order.status)}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="px-4 text-muted-foreground" colSpan={4}>
                  No recent orders
                </TableCell>
              </TableRow>
            )}
          </AdminTable>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h2 className="font-medium">Recent activity</h2>
          <div className="mt-4 space-y-5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : data?.recentActivity.length ? (
              data.recentActivity.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-teal/10 text-teal">
                    <Activity className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-sm">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">{item.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </section>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Featured products</h2>
            <Link to="/admin/products" className="text-xs text-teal">
              Manage products
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : data?.featuredProducts.length ? (
              data.featuredProducts.map((product) => (
                <div className="flex items-center justify-between" key={product.id}>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-950" />
                    <div>
                      <p className="text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category?.name ?? "Uncategorised"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{money(product.price)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No featured products</p>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h2 className="font-medium">Low stock products</h2>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : data?.lowStockProducts.length ? (
              data.lowStockProducts.map((product) => (
                <div className="flex items-center justify-between" key={product.id}>
                  <div>
                    <p className="text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <StatusBadge tone={product.stock === 0 ? "danger" : "warning"}>
                    {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                  </StatusBadge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No low stock products</p>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export function ProductsPage() {
  const [items, setItems] = useState(adminProducts);
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
      <AdminTable
        columns={["Product", "Category", "Price", "Stock", "Featured", "Status", "Actions"]}
      >
        {items.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="min-w-56 px-4">
              <div className="flex items-center gap-3">
                <div className={`size-10 shrink-0 rounded-lg bg-gradient-to-br ${product.tone}`} />
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="px-4 text-muted-foreground">{product.category}</TableCell>
            <TableCell className="px-4">{money(product.price)}</TableCell>
            <TableCell className="px-4">
              <span className={product.stock < 10 ? "text-amber-300" : ""}>{product.stock}</span>
            </TableCell>
            <TableCell className="px-4">
              {product.featured ? <CheckCircle2 className="size-4 text-teal" /> : "—"}
            </TableCell>
            <TableCell className="px-4">
              <StatusBadge tone={product.status === "Active" ? "success" : "neutral"}>
                {product.status}
              </StatusBadge>
            </TableCell>
            <TableCell className="px-4">
              <ActionButtons
                editTo={`/admin/products/${product.id}/edit`}
                onDelete={() => {
                  setItems((all) => all.filter((entry) => entry.id !== product.id));
                  toast.success("Product deleted", {
                    description: `${product.name} was removed from the catalog.`,
                  });
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </AdminTable>
    </AdminLayout>
  );
}

const blank: AdminProduct = {
  id: "new",
  name: "",
  category: "Wallets",
  price: 0,
  stock: 0,
  featured: false,
  status: "Draft",
  sku: "",
  tone: "from-neutral-700 to-neutral-950",
  description: "",
  brand: "QYVERO",
  tags: [],
  specifications: "",
};
export function ProductFormPage({ productId }: { productId?: string }) {
  const navigate = useNavigate();
  const original = adminProducts.find((product) => product.id === productId) ?? blank;
  const [form, setForm] = useState(original);
  const update = <K extends keyof AdminProduct>(key: K, value: AdminProduct[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent, status: "Draft" | "Active") => {
    event.preventDefault();
    update("status", status);
    toast.success(status === "Active" ? "Product saved" : "Draft saved", {
      description: form.name || "Your product changes are ready.",
    });
    navigate({ to: "/admin/products" });
  };
  const field = (label: string, key: keyof AdminProduct, type = "text") => (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        className="mt-2"
        value={String(form[key] ?? "")}
        onChange={(event) =>
          update(key, type === "number" ? Number(event.target.value) : event.target.value)
        }
      />
    </div>
  );
  return (
    <AdminLayout
      title={productId ? "Edit product" : "Add product"}
      description={productId ? "Update product information" : "Create a new catalog product"}
    >
      <AdminBackLink />
      <form
        className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]"
        onSubmit={(event) => submit(event, "Active")}
      >
        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Product information</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {field("Product name", "name")} {field("Slug", "id")}
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  className="mt-2 min-h-28"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                />
              </div>
              {field("Brand", "brand")}
              <div>
                <Label>Category</Label>
                <select
                  className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(event) =>
                    update("category", event.target.value as AdminProduct["category"])
                  }
                >
                  {categories.map((category) => (
                    <option key={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Pricing & inventory</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {field("Price", "price", "number")} {field("Compare price", "comparePrice", "number")}{" "}
              {field("Stock", "stock", "number")} {field("SKU", "sku")}
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Media</h2>
            <p className="mt-1 text-xs text-muted-foreground">Add up to five product images.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  type="button"
                  className="grid aspect-square place-items-center rounded-lg border border-dashed border-white/20 bg-white/[0.02] text-muted-foreground transition-colors hover:border-teal hover:text-teal"
                >
                  <ImagePlus className="size-5" />
                  <span className="mt-1 text-[10px]">Image {index + 1}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="font-medium">Details</h2>
            <div className="mt-5 space-y-5">
              <div>
                <Label>Specifications</Label>
                <Textarea
                  className="mt-2 min-h-24"
                  placeholder="Material: ...&#10;Dimensions: ..."
                  value={form.specifications}
                  onChange={(event) => update("specifications", event.target.value)}
                />
              </div>
              <div>
                <Label>Tags</Label>
                <Input
                  className="mt-2"
                  value={form.tags.join(", ")}
                  placeholder="leather, wallet"
                  onChange={(event) =>
                    update(
                      "tags",
                      event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </div>
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
                checked={form.featured}
                onCheckedChange={(value) => update("featured", value)}
              />
            </div>
            <div className="mt-5">
              <Label>Status</Label>
              <select
                className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.status}
                onChange={(event) => update("status", event.target.value as AdminProduct["status"])}
              >
                <option>Draft</option>
                <option>Active</option>
                <option>Archived</option>
              </select>
            </div>
          </section>
          <div className="flex flex-col gap-3">
            <Button type="submit">
              <Upload />
              Publish product
            </Button>
            <Button type="button" variant="outline" onClick={(event) => submit(event, "Draft")}>
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

const categoryKey = ["categories", "admin"] as const;
const emptyCategory = {
  name: "",
  name_en: "",
  name_ar: "",
  slug: "",
  icon: "",
  description: "",
  description_en: "",
  description_ar: "",
  sort_order: "0",
  is_active: true,
};
const categorySlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyCategory);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const { data: items = [] } = useQuery({
    queryKey: categoryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,name_en,name_ar,slug,icon,description,description_en,description_ar,sort_order,is_active")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as AdminCategory[];
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) => updateCategory(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKey });
      toast.success("Category updated", { description: form.name.trim() });
      setOpen(false);
      setSelectedCategory(null);
      setForm(emptyCategory);
    },
    onError: (error) =>
      toast.error("Unable to update category", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKey });
      toast.success("Category deleted");
    },
    onError: (error) =>
      toast.error("Unable to delete category", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });
  const closeDialog = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setSelectedCategory(null);
      setForm(emptyCategory);
    }
  };
  const openCreate = () => {
    setSelectedCategory(null);
    setForm(emptyCategory);
    setOpen(true);
  };
  const openEdit = (category: AdminCategory) => {
    setSelectedCategory(category);
    setForm({
      name: category.name,
      name_en: category.name_en ?? category.name,
      name_ar: category.name_ar ?? "",
      slug: category.slug,
      icon: category.icon ?? "",
      description: category.description ?? "",
      description_en: category.description_en ?? category.description ?? "",
      description_ar: category.description_ar ?? "",
      sort_order: String(category.sort_order ?? 0),
      is_active: category.is_active,
    });
    setOpen(true);
  };
  const update = <K extends keyof typeof emptyCategory>(key: K, value: (typeof emptyCategory)[K]) =>
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" ? { slug: categorySlug(String(value)) } : {}),
    }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const sortOrder = Number(form.sort_order);
    const englishName = form.name_en.trim() || form.name.trim();
    if (!englishName || !form.slug || !Number.isFinite(sortOrder)) {
      toast.error("Enter a category name and a valid sort order");
      return;
    }
    const input = {
      name: englishName,
      name_en: englishName,
      name_ar: form.name_ar.trim() || null,
      slug: form.slug,
      icon: form.icon.trim() || null,
      description: (form.description_en.trim() || form.description.trim()) || null,
      description_en: (form.description_en.trim() || form.description.trim()) || null,
      description_ar: form.description_ar.trim() || null,
      sort_order: sortOrder,
      is_active: form.is_active,
    };
    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, input });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("categories").insert(input);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: categoryKey });
      toast.success("Category created", { description: form.name.trim() });
      setOpen(false);
      setForm(emptyCategory);
    } catch (error) {
      toast.error("Unable to create category", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const saving = submitting || updateMutation.isPending;
  const fixedCategoriesPage = (
    <AdminLayout
      title="Categories"
      description="Organize your product collection"
      actions={
        <Button onClick={openCreate}>
          <Plus />
          Add category
        </Button>
      }
    >
      <AdminTable columns={["Category", "Slug", "Products", "Actions"]}>
        {items.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="px-4 font-medium">{category.name}</TableCell>
            <TableCell className="px-4 text-muted-foreground">/{category.slug}</TableCell>
            <TableCell className="px-4">â€”</TableCell>
            <TableCell className="px-4">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit"
                  onClick={() => openEdit(category)}
                >
                  <Edit3 className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(category.id)}
                >
                  <Trash2 className="size-4 text-red-300" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </AdminTable>
      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? "Update this catalog category."
                : "Create a category for your catalog."}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={(event) => void submit(event)}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Category name (English)</Label>
                <Input
                  className="mt-2"
                  value={form.name_en}
                  onChange={(event) => { update("name_en", event.target.value); update("name", event.target.value); update("slug", categorySlug(event.target.value)); }}
                />
              </div>
              <div>
                <Label>Category name (Arabic)</Label>
                <Input dir="rtl" className="mt-2" value={form.name_ar} onChange={(event) => update("name_ar", event.target.value)} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input className="mt-2" value={form.slug} readOnly />
              </div>
              <div>
                <Label>Icon</Label>
                <Input
                  className="mt-2"
                  value={form.icon}
                  onChange={(event) => update("icon", event.target.value)}
                />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input
                  type="number"
                  className="mt-2"
                  value={form.sort_order}
                  onChange={(event) => update("sort_order", event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description (English)</Label>
                <Textarea
                  className="mt-2"
                  value={form.description_en}
                  onChange={(event) => { update("description_en", event.target.value); update("description", event.target.value); }}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description (Arabic)</Label>
                <Textarea dir="rtl" className="mt-2" value={form.description_ar} onChange={(event) => update("description_ar", event.target.value)} />
              </div>
              <div className="flex items-center justify-between sm:col-span-2">
                <Label>Active</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(value) => update("is_active", value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving
                  ? selectedCategory
                    ? "Savingâ€¦"
                    : "Creatingâ€¦"
                  : selectedCategory
                    ? "Save category"
                    : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
  return fixedCategoriesPage;
  return (
    <AdminLayout
      title="Categories"
      description="Organize your product collection"
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus />
          Add category
        </Button>
      }
    >
      <AdminTable columns={["Category", "Slug", "Products", "Actions"]}>
        {items.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="px-4 font-medium">{category.name}</TableCell>
            <TableCell className="px-4 text-muted-foreground">/{category.slug}</TableCell>
            <TableCell className="px-4">—</TableCell>
            <TableCell className="px-4">
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Edit">
                  <Edit3 className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Delete">
                  <Trash2 className="size-4 text-red-300" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </AdminTable>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
            <DialogDescription>Create a category for your catalog.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={(event) => void submit(event)}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Category name</Label>
                <Input
                  className="mt-2"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input className="mt-2" value={form.slug} readOnly />
              </div>
              <div>
                <Label>Icon</Label>
                <Input
                  className="mt-2"
                  value={form.icon}
                  onChange={(event) => update("icon", event.target.value)}
                />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input
                  type="number"
                  className="mt-2"
                  value={form.sort_order}
                  onChange={(event) => update("sort_order", event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  className="mt-2"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                />
              </div>
              <div className="flex items-center justify-between sm:col-span-2">
                <Label>Active</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(value) => update("is_active", value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
export function OrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: getAdminOrders,
  });
  const statuses: AdminOrderStatus[] = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminOrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Order status updated");
    },
    onError: (error) =>
      toast.error("Unable to update order", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Order deleted");
    },
    onError: (error) =>
      toast.error("Unable to delete order", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });
  const advanceStatus = (id: string, status: AdminOrderStatus) =>
    statusMutation.mutate({
      id,
      status: statuses[(statuses.indexOf(status) + 1) % statuses.length],
    });
  return (
    <AdminLayout title="Orders" description="Track and manage customer orders">
      <AdminTable
        columns={["Order ID", "Customer", "Products", "Total", "Status", "Date", "Actions"]}
      >
        {isLoading ? (
          <TableRow>
            <TableCell className="px-4 text-muted-foreground" colSpan={7}>
              Loading...
            </TableCell>
          </TableRow>
        ) : orders.length ? (
          orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="px-4 font-medium">{order.order_number}</TableCell>
              <TableCell className="px-4">
                {order.customer_name ?? order.customer_email ?? "—"}
              </TableCell>
              <TableCell className="px-4">
                {order.items_count ?? 0} item{(order.items_count ?? 0) === 1 ? "" : "s"}
              </TableCell>
              <TableCell className="px-4">{money(order.total_amount)}</TableCell>
              <TableCell className="px-4">
                <StatusBadge tone={orderTone(order.status)}>{orderLabel(order.status)}</StatusBadge>
              </TableCell>
              <TableCell className="px-4 text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="More order actions"
                  disabled={statusMutation.isPending || deleteMutation.isPending}
                  onClick={() => advanceStatus(order.id, order.status)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    deleteMutation.mutate(order.id);
                  }}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell className="px-4 text-muted-foreground" colSpan={7}>
              No orders found
            </TableCell>
          </TableRow>
        )}
      </AdminTable>
    </AdminLayout>
  );
}
export function CustomersPage() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: getAdminCustomers,
  });
  return (
    <AdminLayout title="Customers" description="Your QYVERO customer community">
      <AdminTable columns={["Customer", "Email", "Orders", "Spent", "Status"]}>
        {isLoading ? (
          <TableRow>
            <TableCell className="px-4 text-muted-foreground" colSpan={5}>
              Loading...
            </TableCell>
          </TableRow>
        ) : customers.length ? (
          customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="px-4 font-medium">{customer.full_name ?? "—"}</TableCell>
              <TableCell className="px-4 text-muted-foreground">{customer.email ?? "—"}</TableCell>
              <TableCell className="px-4">{customer.orders}</TableCell>
              <TableCell className="px-4">{money(customer.spent)}</TableCell>
              <TableCell className="px-4">
                <StatusBadge tone={customer.is_active ? "success" : "neutral"}>
                  {customer.is_active ? "Active" : "Inactive"}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell className="px-4 text-muted-foreground" colSpan={5}>
              No customers found
            </TableCell>
          </TableRow>
        )}
      </AdminTable>
    </AdminLayout>
  );
}
export function MessagesPage() {
  const [items, setItems] = useState(adminMessages);
  return (
    <AdminLayout title="Messages" description="Contact form submissions from your store">
      <div className="space-y-3">
        {items.map((message) => (
          <article
            key={message.id}
            className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">{message.subject}</h2>
                  <StatusBadge tone={message.status === "New" ? "info" : "neutral"}>
                    {message.status}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {message.name} · {message.email}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{message.date}</p>
            </div>
            <p className="mt-4 text-sm text-white/80">{message.message}</p>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setItems((all) =>
                    all.map((entry) =>
                      entry.id === message.id ? { ...entry, status: "Read" } : entry,
                    ),
                  )
                }
              >
                Mark as read
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setItems((all) => all.filter((entry) => entry.id !== message.id))}
              >
                Archive
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
export function SettingsPage() {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const blankSettings: StoreSettings = {
    brand: "",
    whatsapp: "",
    email: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    primary: "",
    secondary: "",
    logo_url: "",
    logo_storage_path: "",
    vodafone_cash_number: "COMING_SOON",
    instapay_account: "COMING_SOON",
    cod_deposit_percentage: "20",
  };
  const { data } = useQuery({ queryKey: ["admin", "settings"], queryFn: getStoreSettings });
  const [settings, setSettings] = useState(blankSettings);
  useEffect(() => {
    if (data) setSettings(data);
  }, [data]);
  const saveMutation = useMutation({
    mutationFn: saveStoreSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Settings saved");
    },
    onError: (error) =>
      toast.error("Unable to save settings", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });
  const logoMutation = useMutation({
    mutationFn: uploadStoreLogo,
    onSuccess: (logo) => {
      setSettings((current) => ({ ...current, ...logo }));
      toast.success("Logo uploaded");
    },
    onError: (error) =>
      toast.error("Unable to upload logo", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });
  const update = (key: keyof StoreSettings, value: string) =>
    setSettings((current) => ({ ...current, [key]: value }));
  const field = (label: string, key: keyof StoreSettings, type = "text") => (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        className="mt-2"
        value={settings[key]}
        onChange={(event) => update(key, event.target.value)}
      />
    </div>
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate(settings);
  };
  return (
    <AdminLayout title="Settings" description="Configure your storefront information">
      <form className="max-w-3xl space-y-6" onSubmit={submit}>
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h2 className="font-medium">Store information</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {field("Brand name", "brand")} {field("WhatsApp number", "whatsapp")}{" "}
            {field("Email", "email", "email")}
            <div>
              <Label>Logo</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) logoMutation.mutate(file);
                }}
              />
              <button
                type="button"
                className="mt-2 flex h-9 w-full items-center gap-2 rounded-md border border-dashed border-white/20 px-3 text-sm text-muted-foreground hover:border-teal"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoMutation.isPending}
              >
                <PackagePlus className="size-4" />
                {logoMutation.isPending ? "Uploading logo..." : "Upload logo"}
              </button>
            </div>
          </div>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h2 className="font-medium">WhatsApp payment instructions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            These values are sent in post-order WhatsApp payment instructions.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {field("Vodafone Cash number", "vodafone_cash_number")}
            {field("InstaPay account", "instapay_account")}
            {field("COD deposit percentage", "cod_deposit_percentage", "number")}
          </div>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h2 className="font-medium">Social profiles</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {field("Facebook", "facebook")}
            {field("Instagram", "instagram")}
            {field("TikTok", "tiktok")}
            {field("YouTube", "youtube")}
          </div>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h2 className="font-medium">Brand colors</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {field("Primary color", "primary", "color")}{" "}
            {field("Secondary color", "secondary", "color")}
          </div>
        </section>
        <div className="flex gap-3">
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save />
            {saveMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSettings(data ?? blankSettings)}
          >
            Reset
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
