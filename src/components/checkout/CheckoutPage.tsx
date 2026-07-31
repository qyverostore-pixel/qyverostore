import { Link, useNavigate } from "@tanstack/react-router";
import { CreditCard, PackageOpen } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { egyptGovernorates } from "@/data/egypt-addresses";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/providers/AuthProvider";
import { createOrder, type PaymentMethod } from "@/services/orders";
import { productKeys } from "@/hooks/use-products";
import { useShippingQuote } from "@/hooks/use-shipping";
import { validateCoupon, type CouponValidation } from "@/services/coupons";
import { cn } from "@/lib/utils";

const methods: Array<{ id: PaymentMethod; label: string; description: string }> = [
  {
    id: "cash_on_delivery",
    label: "Cash on Delivery",
    description: "Pay when your order arrives.",
  },
  {
    id: "vodafone_cash",
    label: "Vodafone Cash",
    description: "Payment instructions will be shared on WhatsApp.",
  },
  {
    id: "instapay",
    label: "InstaPay",
    description: "Payment instructions will be shared on WhatsApp.",
  },
];
const money = (value: number) => `${value.toLocaleString()} EGP`;

export function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const { items, subtotal, updateQuantity, removeItem, clear } = useCart();
  const [customer, setCustomer] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: user?.email ?? "",
  });
  const [shipping, setShipping] = useState({
    country: "Egypt",
    governorate: "",
    city: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const { data: shippingQuote, isLoading: isLoadingShipping } = useShippingQuote(
    shipping.governorate,
    shipping.city,
  );
  const shippingCost = Number(shippingQuote?.rate?.shipping_cost ?? 0);
  const discount = coupon?.valid ? coupon.discountAmount : 0;
  const total = useMemo(
    () => Math.max(0, subtotal - discount) + shippingCost,
    [subtotal, discount, shippingCost],
  );
  const couponMutation = useMutation({
    mutationFn: () => validateCoupon(couponCode, subtotal),
    onSuccess: (result) => {
      setCoupon(result);
      if (!result.valid) toast.error(result.reason ?? "Coupon is invalid");
      else toast.success("Coupon applied");
    },
    onError: (error) =>
      toast.error("Unable to validate coupon", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });
  const selectedGovernorate = useMemo(
    () => egyptGovernorates.find((governorate) => governorate.name === shipping.governorate),
    [shipping.governorate],
  );
  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      clear();
      toast.success("Order created", { description: order.orderNumber });
      navigate({ to: "/order-success", search: { orderId: order.orderId } });
    },
    onError: (error) =>
      toast.error("Unable to place order", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !customer.full_name.trim() ||
      !customer.phone.trim() ||
      !shipping.governorate ||
      !shipping.city ||
      !shipping.address.trim()
    ) {
      toast.error("Complete customer and shipping details");
      return;
    }
    mutation.mutate({
      customer,
      shipping,
      payment_method: paymentMethod,
      items,
      coupon_code: coupon?.valid ? couponCode : null,
    });
  };

  if (!items.length)
    return (
      <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            icon={<PackageOpen className="size-6" />}
            title="Your cart is empty"
            description="Add products to checkout with QYVERO."
            action={
              <Button type="button" variant="outline" asChild>
                <Link to="/products">Browse products</Link>
              </Button>
            }
          />
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-noise pb-24 pt-12 sm:pb-32 sm:pt-20">
      <form
        onSubmit={submit}
        className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-[minmax(0,1fr)_380px]"
      >
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-teal">
              Checkout
            </p>
            <h1 className="text-display mt-3 text-3xl font-light sm:text-4xl">
              Complete your order.
            </h1>
          </section>
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="font-medium">Customer information</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input
                  className="mt-2"
                  value={customer.full_name}
                  onChange={(event) =>
                    setCustomer((current) => ({ ...current, full_name: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  className="mt-2"
                  value={customer.phone}
                  onChange={(event) =>
                    setCustomer((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Email optional</Label>
                <Input
                  type="email"
                  className="mt-2"
                  value={customer.email}
                  onChange={(event) =>
                    setCustomer((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>
            </div>
          </section>
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="font-medium">Shipping</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Governorate</Label>
                <Select
                  value={shipping.governorate}
                  onValueChange={(governorate) =>
                    setShipping((current) => ({ ...current, governorate, city: "" }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select governorate" />
                  </SelectTrigger>
                  <SelectContent>
                    {egyptGovernorates.map((governorate) => (
                      <SelectItem key={governorate.name} value={governorate.name}>
                        {governorate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Select
                  value={shipping.city}
                  onValueChange={(city) => setShipping((current) => ({ ...current, city }))}
                  disabled={!selectedGovernorate}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedGovernorate?.cities.map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Textarea
                  className="mt-2 min-h-24"
                  value={shipping.address}
                  onChange={(event) =>
                    setShipping((current) => ({ ...current, address: event.target.value }))
                  }
                />
              </div>
            </div>
          </section>
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="font-medium">Payment method</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {methods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    paymentMethod === method.id
                      ? "border-teal bg-teal/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25",
                  )}
                >
                  <span className="text-sm font-medium">{method.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {method.description}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="font-medium">Coupon</h2>
            <div className="mt-4 flex gap-2">
              <Input
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value.toUpperCase());
                  setCoupon(null);
                }}
                placeholder="Enter coupon code"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!couponCode.trim() || couponMutation.isPending}
                onClick={() => couponMutation.mutate()}
              >
                {couponMutation.isPending ? "Checking..." : "Apply"}
              </Button>
            </div>
            {coupon?.valid && (
              <div className="mt-3 flex items-center justify-between text-sm text-teal">
                <span>{couponCode} applied</span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    setCoupon(null);
                    setCouponCode("");
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </section>
        </div>
        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-teal" />
            <h2 className="font-medium">Order summary</h2>
          </div>
          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-neutral-950">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {money(item.price)} × {item.quantity}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="text-xs text-teal"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      Remove one
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-300"
                      onClick={() => removeItem(item.productId)}
                    >
                      Delete
                    </button>
                  </div>
                  {item.quantity >= item.stock && (
                    <p className="mt-1 text-xs text-amber-300">Only {item.stock} available</p>
                  )}
                </div>
                <p className="text-sm font-medium">{money(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {shipping.governorate
                  ? isLoadingShipping
                    ? "Calculating..."
                    : shippingQuote
                      ? money(shippingCost)
                      : "Unavailable"
                  : "Select location"}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-teal">
                <span>Coupon discount</span>
                <span>-{money(discount)}</span>
              </div>
            )}
            {shippingQuote && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Estimated delivery</span>
                <span>
                  {shippingQuote.rate?.estimated_delivery_days} business day
                  {shippingQuote.rate?.estimated_delivery_days === 1 ? "" : "s"}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="text-teal">{money(total)}</span>
            </div>
          </div>
          <Button
            type="submit"
            disabled={mutation.isPending || isLoadingShipping || !shippingQuote}
            className="mt-6 w-full rounded-full"
          >
            {mutation.isPending ? "Placing order..." : "Place order"}
          </Button>
        </aside>
      </form>
    </main>
  );
}

export default CheckoutPage;
