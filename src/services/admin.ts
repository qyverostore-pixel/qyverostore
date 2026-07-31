import { supabase } from "@/lib/supabase";

export type AdminOrderStatus = "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled" | "returned" | "failed_delivery";
export type AdminPaymentStatus = "unpaid" | "waiting_review" | "deposit_paid" | "paid" | "refunded" | "rejected";

export type AdminOrder = {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  phone?: string | null;
  email?: string | null;
  governorate?: string | null;
  city?: string | null;
  address?: string | null;
  subtotal?: number;
  shipping_cost?: number;
  status: AdminOrderStatus;
  payment_method: string | null;
  payment_status: AdminPaymentStatus;
  total_amount: number;
  inventory_processed?: boolean;
  created_at: string;
  items_count?: number;
  items?: Array<{ id: string; product_name: string; quantity: number; unit_price: number; total_price: number }>;
  payments?: Array<{ id: string; status: AdminPaymentStatus; method: string; amount: number; proofs?: Array<{ id: string; image_url: string; storage_path: string }> }>;
};

export type AdminCustomer = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  orders: number;
  spent: number;
};

export type StoreSettings = {
  brand: string;
  whatsapp: string;
  email: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  primary: string;
  secondary: string;
  logo_url: string;
  logo_storage_path: string;
  vodafone_cash_number: string;
  instapay_account: string;
  cod_deposit_percentage: string;
};

export type DashboardActivity = { id: string; title: string; detail: string; time: string; created_at: string };
export type DashboardData = {
  stats: Array<{ label: string; value: string; change: string }>;
  recentOrders: AdminOrder[];
  recentActivity: DashboardActivity[];
  featuredProducts: Array<{ id: string; name: string; price: number; category: { name: string } | null }>;
  lowStockProducts: Array<{ id: string; name: string; sku: string; stock: number; low_stock_threshold: number }>;
};

export type AnalyticsPeriod = "today" | "7d" | "30d" | "12m";
export type AdminAnalytics = { stats: { totalRevenue: number; todayRevenue: number; monthRevenue: number; totalOrders: number; pendingOrders: number; completedOrders: number; cancelledOrders: number; averageOrderValue: number; totalCustomers: number; returningCustomers: number; conversionRate: number }; sales: Array<{ label: string; revenue: number }>; topProducts: Array<{ id: string; name: string; sku: string; stock: number; quantity_sold: number; revenue: number }>; lowStock: Array<{ id: string; name: string; sku: string; stock: number; low_stock_threshold: number }>; topCustomers: Array<{ name: string; orders: number; revenue: number; last_order: string | null }>; latestOrders: Array<{ order_number: string; customer: string; total_amount: number; payment_method: string | null; payment_status: string; status: AdminOrderStatus; created_at: string }>; coupons: { most_used: string; total_usage: number; discount_given: number }; reviews: { averageRating: number; totalReviews: number; highest: Array<{ name: string; rating: number }>; lowest: Array<{ name: string; rating: number }> } };

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const money = (value: number) => `$${value.toLocaleString()}`;
const numberValue = (value: unknown) => Number(value ?? 0);
const itemCount = (items: { quantity: number }[] | null | undefined) => (items ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
const timeLabel = (value: string) => new Date(value).toLocaleDateString();

function normalizeOrder(order: AdminOrder & { items?: { quantity: number }[] | null }) {
  return { ...order, total_amount: numberValue(order.total_amount), subtotal: numberValue(order.subtotal), shipping_cost: numberValue(order.shipping_cost), items_count: itemCount(order.items), items: (order.items ?? []).map((item) => ({ ...item, quantity: numberValue(item.quantity), unit_price: numberValue((item as { unit_price?: unknown }).unit_price), total_price: numberValue((item as { total_price?: unknown }).total_price) })), payments: (order.payments ?? []).map((payment) => ({ ...payment, amount: numberValue(payment.amount) })) };
}

export async function getAdminOrders() {
  const { data, error } = await supabase.from("orders").select("id,order_number,customer_id,customer_name,customer_email,phone,email,governorate,city,address,subtotal,shipping_cost,status,payment_method,payment_status,total_amount,inventory_processed,created_at,items:order_items(id,product_name,quantity,unit_price,total_price),payments(id,status,method,amount,proofs:payment_proofs(id,image_url,storage_path))").order("created_at", { ascending: false });
  fail(error);
  return ((data ?? []) as Array<AdminOrder & { items?: { quantity: number }[] | null }>).map(normalizeOrder);
}

export async function reviewPayment(orderId: string, status: AdminPaymentStatus, rejectionReason?: string) {
  const { data: payments, error: selectError } = await supabase.from("payments").select("id").eq("order_id", orderId).order("created_at", { ascending: false }).limit(1);
  fail(selectError);
  const paymentId = payments?.[0]?.id;
  if (paymentId) {
    const { error } = await supabase.from("payments").update({ status, reviewed_at: new Date().toISOString(), rejection_reason: status === "rejected" ? rejectionReason?.trim() || null : null }).eq("id", paymentId);
    fail(error);
  }
  const { error: orderError } = await supabase.from("orders").update({ payment_status: status }).eq("id", orderId);
  fail(orderError);
}

export async function updateOrderStatus(id: string, status: AdminOrderStatus) {
  const { error } = await supabase.rpc("update_order_status_with_inventory", { p_order_id: id, p_status: status });
  fail(error);
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  fail(error);
}

export async function getAdminCustomers() {
  const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,is_active").order("created_at", { ascending: false }),
    supabase.from("orders").select("customer_id,total_amount"),
  ]);
  fail(profilesError);
  fail(ordersError);

  const totals = new Map<string, { orders: number; spent: number }>();
  for (const order of orders ?? []) {
    if (!order.customer_id) continue;
    const current = totals.get(order.customer_id) ?? { orders: 0, spent: 0 };
    current.orders += 1;
    current.spent += numberValue(order.total_amount);
    totals.set(order.customer_id, current);
  }

  return (profiles ?? []).map((profile) => {
    const total = totals.get(profile.id) ?? { orders: 0, spent: 0 };
    return { ...profile, ...total } as AdminCustomer;
  });
}

export async function getStoreSettings() {
  const { data, error } = await supabase.from("store_settings").select("brand,whatsapp,email,facebook,instagram,tiktok,primary_color,secondary_color,logo_url,logo_storage_path,vodafone_cash_number,instapay_account,cod_deposit_percentage").eq("id", true).maybeSingle();
  fail(error);
  return {
    brand: data?.brand ?? "",
    whatsapp: data?.whatsapp ?? "",
    email: data?.email ?? "",
    facebook: data?.facebook ?? "",
    instagram: data?.instagram ?? "",
    tiktok: data?.tiktok ?? "",
    primary: data?.primary_color ?? "",
    secondary: data?.secondary_color ?? "",
    logo_url: data?.logo_url ?? "",
    logo_storage_path: data?.logo_storage_path ?? "",
    vodafone_cash_number: data?.vodafone_cash_number ?? "COMING_SOON",
    instapay_account: data?.instapay_account ?? "COMING_SOON",
    cod_deposit_percentage: String(data?.cod_deposit_percentage ?? 20),
  } satisfies StoreSettings;
}

export async function saveStoreSettings(input: StoreSettings) {
  const codDepositPercentage = Number(input.cod_deposit_percentage);
  if (!Number.isFinite(codDepositPercentage) || codDepositPercentage <= 0 || codDepositPercentage > 100) {
    throw new Error("COD deposit percentage must be between 0 and 100.");
  }
  const { error } = await supabase.from("store_settings").upsert({
    id: true,
    brand: input.brand || null,
    whatsapp: input.whatsapp || null,
    email: input.email || null,
    facebook: input.facebook || null,
    instagram: input.instagram || null,
    tiktok: input.tiktok || null,
    primary_color: input.primary || null,
    secondary_color: input.secondary || null,
    logo_url: input.logo_url || null,
    logo_storage_path: input.logo_storage_path || null,
    vodafone_cash_number: input.vodafone_cash_number.trim() || "COMING_SOON",
    instapay_account: input.instapay_account.trim() || "COMING_SOON",
    cod_deposit_percentage: codDepositPercentage,
  });
  fail(error);
}

export async function uploadStoreLogo(file: File) {
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "png";
  const storagePath = `settings/logo-${crypto.randomUUID()}.${extension.toLowerCase()}`;
  const { error: uploadError } = await supabase.storage.from("products").upload(storagePath, file, { upsert: true, contentType: file.type });
  fail(uploadError);
  const { data } = supabase.storage.from("products").getPublicUrl(storagePath);
  return { logo_url: data.publicUrl, logo_storage_path: storagePath };
}

export async function getAdminDashboard() {
  const [productCount, categoryCount, orderCount, customerCount, ordersResult, recentOrdersResult, activityProducts, activityCategories, activityCustomers, featuredProducts, lowStockProducts] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount"),
    supabase.from("orders").select("id,order_number,customer_id,customer_name,customer_email,status,payment_method,payment_status,total_amount,created_at,items:order_items(quantity)").order("created_at", { ascending: false }).limit(4),
    supabase.from("products").select("id,name,created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("categories").select("id,name,created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("profiles").select("id,full_name,created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("products").select("id,name,price,category:categories(name)").eq("featured", true).order("created_at", { ascending: false }).limit(4),
    supabase.from("products").select("id,name,sku,stock,low_stock_threshold").order("stock", { ascending: true }).limit(4),
  ]);

  [productCount.error, categoryCount.error, orderCount.error, customerCount.error, ordersResult.error, recentOrdersResult.error, activityProducts.error, activityCategories.error, activityCustomers.error, featuredProducts.error, lowStockProducts.error].forEach(fail);

  const revenue = (ordersResult.data ?? []).reduce((sum, order) => sum + numberValue(order.total_amount), 0);
  const recentActivity = [
    ...(recentOrdersResult.data ?? []).map((order) => ({ id: `order-${order.id}`, title: "Order placed", detail: `${order.order_number} · ${money(numberValue(order.total_amount))}`, time: timeLabel(order.created_at), created_at: order.created_at })),
    ...(activityProducts.data ?? []).map((product) => ({ id: `product-${product.id}`, title: "Product added", detail: product.name, time: timeLabel(product.created_at), created_at: product.created_at })),
    ...(activityCategories.data ?? []).map((category) => ({ id: `category-${category.id}`, title: "Category added", detail: category.name, time: timeLabel(category.created_at), created_at: category.created_at })),
    ...(activityCustomers.data ?? []).map((customer) => ({ id: `customer-${customer.id}`, title: "Customer joined", detail: customer.full_name ?? "Customer", time: timeLabel(customer.created_at), created_at: customer.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  return {
    stats: [
      { label: "Total Products", value: String(productCount.count ?? 0), change: "" },
      { label: "Total Categories", value: String(categoryCount.count ?? 0), change: "" },
      { label: "Total Orders", value: String(orderCount.count ?? 0), change: "" },
      { label: "Total Customers", value: String(customerCount.count ?? 0), change: "" },
      { label: "Total Revenue", value: money(revenue), change: "" },
    ],
    recentOrders: ((recentOrdersResult.data ?? []) as Array<AdminOrder & { items?: { quantity: number }[] | null }>).map(normalizeOrder),
    recentActivity,
    featuredProducts: (featuredProducts.data ?? []).map((product) => ({ ...product, price: numberValue(product.price), category: Array.isArray(product.category) ? product.category[0] ?? null : product.category })),
    lowStockProducts: (lowStockProducts.data ?? []).filter((product) => Number(product.stock) <= Number(product.low_stock_threshold)),
  } satisfies DashboardData;
}

export async function getAdminAnalytics(period: AnalyticsPeriod): Promise<AdminAnalytics> {
  const { data, error } = await supabase.rpc("get_admin_analytics", { p_period: period });
  fail(error);
  const value = data as AdminAnalytics;
  const number = (input: unknown) => Number(input ?? 0);
  return { ...value, stats: Object.fromEntries(Object.entries(value.stats).map(([key, input]) => [key, number(input)])) as AdminAnalytics["stats"], sales: (value.sales ?? []).map((item) => ({ ...item, revenue: number(item.revenue) })), topProducts: (value.topProducts ?? []).map((item) => ({ ...item, stock: number(item.stock), quantity_sold: number(item.quantity_sold), revenue: number(item.revenue) })), lowStock: (value.lowStock ?? []).map((item) => ({ ...item, stock: number(item.stock), low_stock_threshold: number(item.low_stock_threshold) })), topCustomers: (value.topCustomers ?? []).map((item) => ({ ...item, orders: number(item.orders), revenue: number(item.revenue) })), latestOrders: (value.latestOrders ?? []).map((item) => ({ ...item, total_amount: number(item.total_amount) })), coupons: { ...value.coupons, total_usage: number(value.coupons?.total_usage), discount_given: number(value.coupons?.discount_given) }, reviews: { ...value.reviews, averageRating: number(value.reviews?.averageRating), totalReviews: number(value.reviews?.totalReviews), highest: value.reviews?.highest ?? [], lowest: value.reviews?.lowest ?? [] } };
}
