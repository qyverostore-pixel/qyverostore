import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  getAdminOrders,
  reviewPayment,
  updateOrderStatus,
  type AdminOrder,
  type AdminOrderStatus,
  type AdminPaymentStatus,
} from "@/services/admin";

const pageSize = 10;
const orderStatuses: AdminOrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "failed_delivery",
];
const paymentStatuses: AdminPaymentStatus[] = [
  "unpaid",
  "waiting_review",
  "deposit_paid",
  "paid",
  "refunded",
  "rejected",
];
const money = (value: number) => `${Number(value ?? 0).toLocaleString()} EGP`;
const label = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const orderTone = (status: string) =>
  (({
    pending: "warning",
    confirmed: "info",
    preparing: "info",
    shipped: "info",
    delivered: "success",
    cancelled: "danger",
    returned: "danger",
    failed_delivery: "danger",
  })[status] ?? "neutral") as "warning" | "info" | "success" | "danger" | "neutral";
const paymentTone = (status: string) =>
  (({
    unpaid: "warning",
    waiting_review: "info",
    deposit_paid: "info",
    paid: "success",
    refunded: "neutral",
    rejected: "danger",
  })[status] ?? "neutral") as "warning" | "info" | "success" | "danger" | "neutral";

function OrderDetails({ order }: { order: AdminOrder }) {
  const products = order.items ?? [];
  const payment = order.payments?.[0];
  const address =
    [order.address, order.city, order.governorate].filter(Boolean).join(", ") || "Not provided";
  const deposit = order.payment_status === "deposit_paid" ? (payment?.amount ?? 0) : 0;
  return (
    <TableRow>
      <TableCell className="bg-white/[0.015] px-5 py-5" colSpan={9}>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_0.8fr]">
          <section>
            <h3 className="text-sm font-medium">Purchased products</h3>
            <div className="mt-3 space-y-2">
              {products.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 rounded-lg border border-white/10 px-3 py-2 text-sm"
                >
                  <span>
                    {item.product_name}{" "}
                    <span className="text-muted-foreground">× {item.quantity}</span>
                  </span>
                  <span>{money(item.total_price)}</span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-sm font-medium">Customer & delivery</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{order.phone ?? "Not provided"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate">
                  {order.email ?? order.customer_email ?? "Not provided"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Address</dt>
                <dd className="max-w-56 text-right">{address}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h3 className="text-sm font-medium">Order totals</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Deposit</dt>
                <dd>{money(deposit)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{money(order.shipping_cost ?? 0)}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 font-medium">
                <dt>Total</dt>
                <dd>{money(order.total_amount)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function OrdersManagement() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: getAdminOrders,
  });
  const [query, setQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminOrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: async () => {
      await refresh();
      toast.success("Order status updated");
    },
    onError: (error) =>
      toast.error("Unable to update order", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });
  const paymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminPaymentStatus }) =>
      reviewPayment(id, status),
    onSuccess: async () => {
      await refresh();
      toast.success("Payment status updated");
    },
    onError: (error) =>
      toast.error("Unable to update payment", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });
  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const haystack =
          `${order.order_number} ${order.customer_name ?? ""} ${order.customer_email ?? ""} ${order.email ?? ""} ${order.phone ?? ""}`.toLowerCase();
        return (
          (!query || haystack.includes(query.toLowerCase())) &&
          (orderStatus === "all" || order.status === orderStatus) &&
          (paymentStatus === "all" || order.payment_status === paymentStatus) &&
          (!date || order.created_at.slice(0, 10) === date)
        );
      }),
    [orders, query, orderStatus, paymentStatus, date],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const resetPage = () => setPage(1);
  return (
    <AdminLayout
      title="Orders"
      description="Manage fulfillment, payments, and customer delivery details"
    >
      <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_repeat(3,180px)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            className="pl-9"
            placeholder="Search order, customer, phone, or email"
          />
        </div>
        <select
          value={orderStatus}
          onChange={(event) => {
            setOrderStatus(event.target.value);
            resetPage();
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All order statuses</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {label(status)}
            </option>
          ))}
        </select>
        <select
          value={paymentStatus}
          onChange={(event) => {
            setPaymentStatus(event.target.value);
            resetPage();
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All payment statuses</option>
          {paymentStatuses.map((status) => (
            <option key={status} value={status}>
              {label(status)}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            resetPage();
          }}
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <AdminTable
          columns={[
            "Order",
            "Customer",
            "Products",
            "Payment",
            "Order status",
            "Payment status",
            "Total",
            "Date",
            "",
          ]}
        >
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="px-4 py-8 text-muted-foreground">
                Loading orders...
              </TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.flatMap((order) => [
              <TableRow key={order.id}>
                <TableCell className="px-4 font-medium">{order.order_number}</TableCell>
                <TableCell className="px-4">
                  <p>{order.customer_name ?? "Guest"}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.phone ?? order.customer_email ?? "—"}
                  </p>
                </TableCell>
                <TableCell className="px-4">{order.items_count ?? 0} items</TableCell>
                <TableCell className="px-4 text-xs text-muted-foreground">
                  {label(order.payment_method ?? "not specified")}
                </TableCell>
                <TableCell className="px-4">
                  <select
                    aria-label="Order status"
                    value={order.status}
                    disabled={statusMutation.isPending}
                    onChange={(event) =>
                      statusMutation.mutate({
                        id: order.id,
                        status: event.target.value as AdminOrderStatus,
                      })
                    }
                    className="h-8 rounded-md border border-white/10 bg-background px-2 text-xs"
                  >
                    <option value={order.status}>{label(order.status)}</option>
                    {orderStatuses
                      .filter((status) => status !== order.status)
                      .map((status) => (
                        <option key={status} value={status}>
                          {label(status)}
                        </option>
                      ))}
                  </select>
                </TableCell>
                <TableCell className="px-4">
                  <select
                    aria-label="Payment status"
                    value={order.payment_status}
                    disabled={paymentMutation.isPending}
                    onChange={(event) =>
                      paymentMutation.mutate({
                        id: order.id,
                        status: event.target.value as AdminPaymentStatus,
                      })
                    }
                    className="h-8 rounded-md border border-white/10 bg-background px-2 text-xs"
                  >
                    <option value={order.payment_status}>{label(order.payment_status)}</option>
                    {paymentStatuses
                      .filter((status) => status !== order.payment_status)
                      .map((status) => (
                        <option key={status} value={status}>
                          {label(status)}
                        </option>
                      ))}
                  </select>
                  <div className="mt-1">
                    <StatusBadge tone={paymentTone(order.payment_status)}>
                      {label(order.payment_status)}
                    </StatusBadge>
                  </div>
                </TableCell>
                <TableCell className="px-4 font-medium">{money(order.total_amount)}</TableCell>
                <TableCell className="px-4 text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="px-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle order details"
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <ChevronDown
                      className={`size-4 transition-transform ${expanded === order.id ? "rotate-180" : ""}`}
                    />
                  </Button>
                </TableCell>
              </TableRow>,
              ...(expanded === order.id
                ? [<OrderDetails key={`${order.id}-details`} order={order} />]
                : []),
            ])
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                No orders match these filters.
              </TableCell>
            </TableRow>
          )}
        </AdminTable>
      </div>
      <div className="mt-5 flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {filtered.length} order{filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
