import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/hooks/use-cart";
import type { AdminOrder, AdminPaymentStatus } from "@/services/admin";
import type { PaymentChatbotOrder } from "@/lib/payment-chatbot";

export type PaymentMethod = "cash_on_delivery" | "vodafone_cash" | "instapay";
export type PaymentStatus = "unpaid" | "waiting_review" | "paid" | "rejected";

export type CreateOrderInput = {
  customer: { full_name: string; phone: string; email: string };
  shipping: { country: string; governorate: string; city: string; address: string };
  payment_method: PaymentMethod;
  items: CartItem[];
  coupon_code?: string | null;
};

export type CreateOrderResult = { orderId: string; orderNumber: string; paymentStatus: PaymentStatus };

type OrderItemCount = { count: number };
type PaymentProof = { id: string; image_url: string; storage_path: string };
type OrderPayment = { id: string; status: AdminPaymentStatus; method: string; proofs: PaymentProof[] };

export type ShippingAddress = {
  country?: string | null;
  governorate?: string | null;
  city?: string | null;
  street?: string | null;
  building?: string | null;
  floor?: string | null;
  apartment?: string | null;
  notes?: string | null;
  estimated_delivery_days?: number | null;
};

export type MyOrder = Pick<AdminOrder, "id" | "order_number" | "status" | "payment_method" | "payment_status" | "total_amount" | "created_at"> & {
  items_count: number;
};

export type MyOrderDetail = MyOrder & {
  customer_name: string | null;
  full_name: string | null;
  phone: string | null;
  subtotal: number;
  shipping_cost: number;
  coupon_code: string | null;
  discount_amount: number;
  shipping_address: ShippingAddress;
  governorate: string | null;
  city: string | null;
  address: string | null;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: { images: Array<{ image_url: string; is_primary: boolean; sort_order: number }> } | null;
  }>;
  payments: OrderPayment[];
};

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!input.items.length) throw new Error("Your cart is empty.");

  const { data: auth, error: authError } = await supabase.auth.getUser();
  fail(authError);
  if (!auth.user) throw new Error("Please sign in to place an order.");

  const { data, error } = await supabase.rpc("create_order_with_coupon", {
    p_customer: input.customer,
    p_shipping: input.shipping,
    p_payment_method: input.payment_method,
    p_items: input.items.map((item) => ({ product_id: item.productId, variant_id: item.variantId, quantity: item.quantity })),
    p_coupon_code: input.coupon_code?.trim() || null,
  });
  fail(error);

  const result = data?.[0];
  if (!result) throw new Error("Order could not be created.");
  return {
    orderId: result.order_id,
    orderNumber: result.order_number,
    paymentStatus: result.payment_status as PaymentStatus,
  };
}

async function currentCustomerId() {
  const { data, error } = await supabase.auth.getUser();
  fail(error);
  if (!data.user) throw new Error("Please sign in to view your orders.");
  return data.user.id;
}

const numberValue = (value: unknown) => Number(value ?? 0);
const itemCount = (items: OrderItemCount[] | null | undefined) => numberValue(items?.[0]?.count);
const orderDetailFields = "id,order_number,status,payment_method,payment_status,customer_name,full_name,phone,total_amount,subtotal,shipping_cost,coupon_code,discount_amount,governorate,city,address,created_at,items:order_items(id,product_name,quantity,unit_price,total_price,product:products(images:product_images(image_url,is_primary,sort_order))),payments(id,status,method,proofs:payment_proofs(id,image_url,storage_path))";

const isMissingShippingAddressColumn = (error: { code?: string; message: string } | null) =>
  error?.code === "42703" || Boolean(error?.message.toLowerCase().includes("shipping_address"));

export async function getMyOrders(): Promise<MyOrder[]> {
  const customerId = await currentCustomerId();
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_number,status,payment_method,payment_status,total_amount,created_at,items:order_items(count)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  fail(error);

  return (data ?? []).map((order) => {
    const source = order as Omit<MyOrder, "items_count" | "total_amount"> & { total_amount: unknown; items?: OrderItemCount[] | null };
    return { ...source, total_amount: numberValue(source.total_amount), items_count: itemCount(source.items) };
  });
}

export async function getOrderById(id: string): Promise<MyOrderDetail> {
  const customerId = await currentCustomerId();
  const query = (fields: string) => supabase
    .from("orders")
    .select(fields)
    .eq("id", id)
    .eq("customer_id", customerId)
    .maybeSingle();
  let { data, error } = await query(`${orderDetailFields},shipping_address`);
  if (isMissingShippingAddressColumn(error)) ({ data, error } = await query(orderDetailFields));
  fail(error);
  if (!data) throw new Error("This order could not be found.");

  const source = data as unknown as Omit<MyOrderDetail, "items_count" | "total_amount" | "subtotal" | "shipping_cost" | "items" | "payments"> & {
    total_amount: unknown;
    subtotal: unknown;
    shipping_cost: unknown;
    discount_amount: unknown;
    items?: MyOrderDetail["items"] | null;
    payments?: OrderPayment[] | null;
  };
  const legacyShippingAddress: ShippingAddress = {
    country: "Egypt",
    governorate: source.governorate,
    city: source.city,
    street: source.address,
    building: null,
    floor: null,
    apartment: null,
    notes: null,
  };
  return {
    ...source,
    total_amount: numberValue(source.total_amount),
    subtotal: numberValue(source.subtotal),
    shipping_cost: numberValue(source.shipping_cost),
    discount_amount: numberValue(source.discount_amount),
    items: (source.items ?? []).map((item) => ({
      ...item,
      quantity: numberValue(item.quantity),
      unit_price: numberValue(item.unit_price),
      total_price: numberValue(item.total_price),
      product: Array.isArray(item.product) ? item.product[0] ?? null : item.product,
    })),
    items_count: (source.items ?? []).reduce((total, item) => total + numberValue(item.quantity), 0),
    payments: source.payments ?? [],
    shipping_address: source.shipping_address ?? legacyShippingAddress,
  };
}

export async function getPaymentChatbotOrder(orderNumber: string): Promise<PaymentChatbotOrder> {
  const { data, error } = await supabase.rpc("get_payment_chatbot_order", {
    p_order_number: orderNumber,
  });
  fail(error);
  if (!data) throw new Error("Payment instructions could not be loaded.");

  const source = data as PaymentChatbotOrder & {
    total_amount: unknown;
    cod_deposit_percentage: unknown;
    deposit_amount: unknown;
    remaining_amount: unknown;
  };
  return {
    ...source,
    total_amount: numberValue(source.total_amount),
    cod_deposit_percentage: numberValue(source.cod_deposit_percentage),
    deposit_amount: numberValue(source.deposit_amount),
    remaining_amount: numberValue(source.remaining_amount),
  };
}

export const getMyOrder = getOrderById;
