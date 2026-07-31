import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  CircleDollarSign,
  PackagePlus,
  ShoppingBag,
  TicketPercent,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminTable, StatusBadge } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { getAdminAnalytics, type AnalyticsPeriod } from "@/services/admin";

const money = (value: number) => `${value.toLocaleString()} EGP`;
const orderTone = (status: string) =>
  (({
    pending: "warning",
    confirmed: "info",
    shipped: "info",
    delivered: "success",
    cancelled: "danger",
  })[status] ?? "neutral") as "warning" | "info" | "success" | "danger" | "neutral";
const label = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const periods: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "12m", label: "12 Months" },
];

function Metric({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof TrendingUp;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-teal/10 p-2 text-teal">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", period],
    queryFn: () => getAdminAnalytics(period),
    staleTime: 55_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
  const stats = data?.stats;
  return (
    <AdminLayout title="Dashboard" description="A live overview of your QYVERO store">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 11 }, (_, index) => (
            <div key={index} className="rounded-xl border border-white/10 p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-8 w-20" />
            </div>
          ))
        ) : (
          <>
            <Metric
              title="Total Revenue"
              value={money(stats?.totalRevenue ?? 0)}
              icon={CircleDollarSign}
            />
            <Metric
              title="Today's Revenue"
              value={money(stats?.todayRevenue ?? 0)}
              icon={TrendingUp}
            />
            <Metric
              title="This Month Revenue"
              value={money(stats?.monthRevenue ?? 0)}
              icon={BarChart3}
            />
            <Metric
              title="Average Order Value"
              value={money(stats?.averageOrderValue ?? 0)}
              icon={ShoppingBag}
            />
            <Metric
              title="Total Orders"
              value={String(stats?.totalOrders ?? 0)}
              icon={ShoppingBag}
            />
            <Metric
              title="Pending Orders"
              value={String(stats?.pendingOrders ?? 0)}
              icon={TrendingUp}
            />
            <Metric
              title="Completed Orders"
              value={String(stats?.completedOrders ?? 0)}
              icon={TrendingUp}
            />
            <Metric
              title="Cancelled Orders"
              value={String(stats?.cancelledOrders ?? 0)}
              icon={TrendingUp}
            />
            <Metric
              title="Total Customers"
              value={String(stats?.totalCustomers ?? 0)}
              icon={Users}
            />
            <Metric
              title="Returning Customers"
              value={String(stats?.returningCustomers ?? 0)}
              icon={Users}
            />
            <Metric
              title="Conversion Rate"
              value={`${stats?.conversionRate ?? 0}%`}
              icon={TrendingUp}
            />
          </>
        )}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Panel
          title="Sales performance"
          action={
            <div className="flex rounded-lg border border-white/10 p-0.5">
              {periods.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPeriod(item.value)}
                  className={`rounded-md px-2 py-1 text-[10px] transition ${period === item.value ? "bg-teal/15 text-teal" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          }
        >
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : data?.sales.length ? (
            <ChartContainer
              config={{ revenue: { label: "Revenue", color: "var(--color-teal)" } }}
              className="h-64 w-full"
            >
              <AreaChart data={data.sales} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="analytics-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => money(Number(value))} />}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="url(#analytics-revenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="py-24 text-center text-sm text-muted-foreground">
              No sales in this period.
            </p>
          )}
        </Panel>
        <Panel title="Quick actions">
          <div className="grid gap-3">
            <Button asChild>
              <Link to="/admin/products/new">
                <PackagePlus />
                Create Product
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/coupons">
                <TicketPercent />
                Create Coupon
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/orders">
                <ShoppingBag />
                Manage Orders
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/products">
                <BarChart3 />
                Manage Inventory
              </Link>
            </Button>
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs text-muted-foreground">Coupon performance</p>
            <p className="mt-2 text-sm">
              Most used:{" "}
              <span className="font-mono text-teal">{data?.coupons.most_used ?? "—"}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data?.coupons.total_usage ?? 0} uses · {money(data?.coupons.discount_given ?? 0)}{" "}
              discounted
            </p>
          </div>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Top products">
          <div className="space-y-3">
            {data?.topProducts.length ? (
              data.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="mr-2 text-teal">#{index + 1}</span>
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {product.sku} · {product.quantity_sold} sold · {product.stock} in stock
                    </p>
                  </div>
                  <p className="text-sm font-medium">{money(product.revenue)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No product sales yet.</p>
            )}
          </div>
        </Panel>
        <Panel title="Low stock">
          <div className="space-y-3">
            {data?.lowStock.length ? (
              data.lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm">{product.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      SKU: {product.sku} · Threshold: {product.low_stock_threshold}
                    </p>
                  </div>
                  <StatusBadge tone={product.stock === 0 ? "danger" : "warning"}>
                    {product.stock} left
                  </StatusBadge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                All products are above their threshold.
              </p>
            )}
          </div>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Top customers">
          <div className="space-y-3">
            {data?.topCustomers.length ? (
              data.topCustomers.map((customer) => (
                <div
                  key={`${customer.name}-${customer.last_order}`}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm">{customer.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {customer.orders} orders · Last:{" "}
                      {customer.last_order
                        ? new Date(customer.last_order).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{money(customer.revenue)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No customer orders yet.</p>
            )}
          </div>
        </Panel>
        <Panel title="Review analytics">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-semibold text-amber-300">
                {(data?.reviews.averageRating ?? 0).toFixed(1)} ★
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Average store rating</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{data?.reviews.totalReviews ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">Total reviews</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Highest rated</p>
              {data?.reviews.highest.map((product) => (
                <p key={product.name} className="mt-1 text-sm">
                  {product.name}{" "}
                  <span className="text-amber-300">{Number(product.rating).toFixed(1)}★</span>
                </p>
              )) || <p className="mt-1 text-sm text-muted-foreground">—</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lowest rated</p>
              {data?.reviews.lowest.map((product) => (
                <p key={product.name} className="mt-1 text-sm">
                  {product.name}{" "}
                  <span className="text-amber-300">{Number(product.rating).toFixed(1)}★</span>
                </p>
              )) || <p className="mt-1 text-sm text-muted-foreground">—</p>}
            </div>
          </div>
        </Panel>
      </div>
      <div className="mt-6">
        <Panel
          title="Latest orders"
          action={
            <Link to="/admin/orders" className="text-xs text-teal hover:text-teal/80">
              View all
            </Link>
          }
        >
          <AdminTable columns={["Order #", "Customer", "Amount", "Payment", "Status", "Date"]}>
            {data?.latestOrders.length ? (
              data.latestOrders.map((order) => (
                <TableRow key={order.order_number}>
                  <TableCell className="px-4 font-medium">{order.order_number}</TableCell>
                  <TableCell className="px-4">{order.customer}</TableCell>
                  <TableCell className="px-4">{money(order.total_amount)}</TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {label(order.payment_method ?? "unpaid")}
                  </TableCell>
                  <TableCell className="px-4">
                    <StatusBadge tone={orderTone(order.status)}>{label(order.status)}</StatusBadge>
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="px-4 text-muted-foreground" colSpan={6}>
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
          </AdminTable>
        </Panel>
      </div>
    </AdminLayout>
  );
}
