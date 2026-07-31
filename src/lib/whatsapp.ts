import type { MyOrderDetail } from "@/services/orders";

const money = (value: number) => `${value.toLocaleString()} EGP`;

const paymentMethodLabel = (method: string | null) => {
  const labels: Record<string, string> = {
    cash_on_delivery: "Cash on Delivery",
    vodafone_cash: "Vodafone Cash",
    instapay: "InstaPay",
  };
  return labels[method ?? ""] ?? method ?? "Not specified";
};

export function createWhatsAppOrderUrl(
  order: MyOrderDetail,
  whatsappNumber: string,
  brandName: string,
) {
  const customerName = order.customer_name ?? order.full_name ?? "Not specified";
  const address = order.shipping_address;
  const orderReference = order.order_number || order.id;
  const lines = [
    `${brandName} Order Confirmation`,
    "",
    `Order: #${orderReference}`,
    "",
    "Customer:",
    `Name: ${customerName}`,
    `Phone: ${order.phone ?? "Not specified"}`,
    `City: ${address?.city ?? order.city ?? "Not specified"}`,
    `Address: ${address?.street ?? order.address ?? "Not specified"}`,
    "",
    "Payment:",
    paymentMethodLabel(order.payment_method),
    "",
    "Items:",
    ...order.items.map(
      (item) => `- ${item.product_name} x ${item.quantity} - ${money(item.unit_price)}`,
    ),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Shipping: ${money(order.shipping_cost)}`,
    `Total: ${money(order.total_amount)}`,
    "",
    "Please help me with this order.",
  ];

  const params = new URLSearchParams({ text: lines.join("\n") });
  const phone = whatsappNumber.replace(/\D/g, "");
  return phone ? `https://wa.me/${phone}?${params.toString()}` : "";
}
