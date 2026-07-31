export type PaymentChatbotOrder = {
  order_number: string;
  payment_method: "cash_on_delivery" | "vodafone_cash" | "instapay";
  total_amount: number;
  cod_deposit_percentage: number;
  deposit_amount: number;
  remaining_amount: number;
  vodafone_cash_number: string;
  instapay_account: string;
};

const money = (value: number) => `${value.toLocaleString()} EGP`;

export function createPaymentChatbotMessage(order: PaymentChatbotOrder) {
  const common = [
    "QYVERO Order Payment",
    "",
    `Order: #${order.order_number}`,
    `Total: ${money(order.total_amount)}`,
    "",
  ];

  if (order.payment_method === "cash_on_delivery") {
    return [
      "QYVERO Order Confirmation",
      "",
      `Order: #${order.order_number}`,
      `Total: ${money(order.total_amount)}`,
      "",
      "Payment method: Cash on Delivery",
      "",
      `Required deposit: ${money(order.deposit_amount)}`,
      `Remaining on delivery: ${money(order.remaining_amount)}`,
      "",
      "Please send the deposit confirmation here to confirm the order.",
    ].join("\n");
  }

  const isVodafoneCash = order.payment_method === "vodafone_cash";
  return [
    ...common,
    `Payment method: ${isVodafoneCash ? "Vodafone Cash" : "InstaPay"}`,
    "",
    `Please transfer ${money(order.total_amount)} to:`,
    isVodafoneCash ? order.vodafone_cash_number : order.instapay_account,
    "",
    "After completing the transfer, send the payment screenshot here.",
  ].join("\n");
}
