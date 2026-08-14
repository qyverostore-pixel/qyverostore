import { Link, useNavigate } from "@tanstack/react-router";
import { CreditCard, PackageOpen } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { useLocale } from "@/providers/LocaleProvider";
import { createOrder, type PaymentMethod } from "@/services/orders";
import { productKeys } from "@/hooks/use-products";
import { useShippingQuote } from "@/hooks/use-shipping";
import { validateCoupon, type CouponValidation } from "@/services/coupons";
import { cn } from "@/lib/utils";
import { cleanText, isValidEmail, isValidName, normalizeEgyptianPhone } from "@/lib/validation";

const money = (value: number) => `${value.toLocaleString()} EGP`;

export function CheckoutPage() {
  const { t } = useLocale();
  const methods: Array<{ id: PaymentMethod; label: string; description: string }> = [
    { id: "cash_on_delivery", label: t("checkout.cashOnDelivery"), description: t("checkout.cashOnDeliveryDescription") },
    { id: "vodafone_cash", label: t("checkout.vodafoneCash"), description: t("checkout.paymentInstructions") },
    { id: "instapay", label: t("checkout.instaPay"), description: t("checkout.paymentInstructions") },
  ];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const { items, buyNowItem, updateQuantity, updateBuyNowQuantity, removeItem, clear, clearBuyNow } = useCart();
  const checkoutItems = buyNowItem ? [buyNowItem] : items;
  const subtotal = useMemo(() => checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [checkoutItems]);
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
  useEffect(() => {
    setCustomer((current) => ({
      full_name: current.full_name || profile?.full_name || "",
      phone: current.phone || profile?.phone || "",
      email: current.email || user?.email || "",
    }));
  }, [profile?.full_name, profile?.phone, user?.email]);
  const { data: shippingQuote, isLoading: isLoadingShipping } = useShippingQuote(shipping.governorate, shipping.city);
  const shippingCost = Number(shippingQuote?.rate?.shipping_cost ?? 0);
  const discount = coupon?.valid ? coupon.discountAmount : 0;
  const total = useMemo(() => Math.max(0, subtotal - discount) + shippingCost, [subtotal, discount, shippingCost]);
  const couponMutation = useMutation({ mutationFn: () => validateCoupon(couponCode, subtotal), onSuccess: (result) => { setCoupon(result); if (!result.valid) toast.error(t("checkout.couponInvalid")); else toast.success(t("checkout.couponApplied")); }, onError: () => toast.error(t("checkout.unableValidateCoupon"), { description: t("checkout.pleaseTryAgain") }) });
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
      if (buyNowItem) clearBuyNow(); else clear();
      toast.success(t("checkout.orderCreated"), { description: order.orderNumber });
      navigate({ to: "/order-success", search: { orderId: order.orderId } });
    },
    onError: () =>
      toast.error(t("checkout.unablePlaceOrder"), {
        description: t("checkout.pleaseTryAgain"),
      }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = cleanText(customer.full_name);
    const phone = normalizeEgyptianPhone(customer.phone);
    const email = cleanText(customer.email);
    const address = cleanText(shipping.address);
    if (!isValidName(name)) {
      toast.error(t("validation.validName"));
      return;
    }
    if (!phone) {
      toast.error(t("validation.validPhone"));
      return;
    }
    if (email && !isValidEmail(email)) {
      toast.error(t("validation.validEmail"));
      return;
    }
    if (!shipping.governorate || !shipping.city || address.length < 5) {
      toast.error(t("validation.validAddress"));
      return;
    }
    mutation.mutate({
      customer: { full_name: name, phone, email },
      shipping: { ...shipping, address },
      payment_method: paymentMethod,
      items: checkoutItems,
      coupon_code: coupon?.valid ? couponCode : null,
    });
  };

  if (!checkoutItems.length)
    return (
      <main className="min-h-screen bg-noise px-6 pb-32 pt-12">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            icon={<PackageOpen className="size-6" />}
            title={t("checkout.emptyCart")}
            description={t("checkout.emptyCartDescription")}
            action={
              <Button type="button" variant="outline" asChild>
                <Link to="/products">{t("errors.browseProducts")}</Link>
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
              {t("checkout.eyebrow")}
            </p>
            <h1 className="text-display mt-3 text-3xl font-light sm:text-4xl">
              {t("checkout.title")}
            </h1>
          </section>
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="font-medium">{t("checkout.customerInformation")}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label>{t("checkout.fullName")}</Label>
                <Input
                  className="mt-2"
                  value={customer.full_name}
                  onChange={(event) =>
                    setCustomer((current) => ({ ...current, full_name: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label>{t("checkout.phone")}</Label>
                <Input
                  className="mt-2"
                  value={customer.phone}
                  onChange={(event) =>
                    setCustomer((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label>{t("checkout.emailOptional")}</Label>
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
            <h2 className="font-medium">{t("checkout.shipping")}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label>{t("checkout.governorate")}</Label>
                <Select
                  value={shipping.governorate}
                  onValueChange={(governorate) =>
                    setShipping((current) => ({ ...current, governorate, city: "" }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={t("checkout.selectGovernorate")} />
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
                <Label>{t("checkout.city")}</Label>
                <Select
                  value={shipping.city}
                  onValueChange={(city) => setShipping((current) => ({ ...current, city }))}
                  disabled={!selectedGovernorate}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={t("checkout.selectCity")} />
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
                <Label>{t("checkout.address")}</Label>
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
            <h2 className="font-medium">{t("checkout.paymentMethod")}</h2>
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
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6"><h2 className="font-medium">{t("checkout.coupon")}</h2><div className="mt-4 flex gap-2"><Input value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCoupon(null); }} placeholder={t("checkout.enterCouponCode")} /><Button type="button" variant="outline" disabled={!couponCode.trim() || couponMutation.isPending} onClick={() => couponMutation.mutate()}>{couponMutation.isPending ? t("checkout.checking") : t("checkout.apply")}</Button></div>{coupon?.valid && <div className="mt-3 flex items-center justify-between text-sm text-teal"><span>{couponCode} {t("checkout.applied")}</span><button type="button" className="text-xs text-muted-foreground" onClick={() => { setCoupon(null); setCouponCode(""); }}>{t("checkout.remove")}</button></div>}</section>
        </div>
        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-teal" />
            <h2 className="font-medium">{t("checkout.orderSummary")}</h2>
          </div>
          <div className="mt-5 space-y-4">
            {checkoutItems.map((item) => (
              <div key={item.key} className="flex gap-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-neutral-950">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  {item.variantLabel && <p className="mt-1 text-xs text-muted-foreground">{item.variantLabel}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {money(item.price)} × {item.quantity}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="text-xs text-teal"
                      onClick={() => buyNowItem ? updateBuyNowQuantity(item.quantity + 1) : updateQuantity(item.key, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      {t("checkout.add")}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground"
                      onClick={() => buyNowItem ? updateBuyNowQuantity(item.quantity - 1) : updateQuantity(item.key, item.quantity - 1)}
                    >
                      {t("checkout.removeOne")}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-300"
                      onClick={() => buyNowItem ? clearBuyNow() : removeItem(item.key)}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                  {item.quantity >= item.stock && <p className="mt-1 text-xs text-amber-300">{t("checkout.onlyAvailable")} {item.stock}</p>}
                </div>
                <p className="text-sm font-medium">{money(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("checkout.subtotal")}</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("checkout.shipping")}</span>
              <span>{shipping.governorate ? isLoadingShipping ? t("checkout.calculating") : shippingQuote ? money(shippingCost) : t("checkout.unavailable") : t("checkout.selectLocation")}</span>
            </div>
            {discount > 0 && <div className="flex justify-between text-teal"><span>{t("checkout.couponDiscount")}</span><span>-{money(discount)}</span></div>}
            {shippingQuote && <div className="flex justify-between text-xs text-muted-foreground"><span>{t("checkout.estimatedDelivery")}</span><span>{shippingQuote.rate?.estimated_delivery_days} {shippingQuote.rate?.estimated_delivery_days === 1 ? t("checkout.businessDay") : t("checkout.businessDays")}</span></div>}
            <div className="flex justify-between text-base font-semibold">
              <span>{t("checkout.total")}</span>
              <span className="text-teal">{money(total)}</span>
            </div>
          </div>
          <Button type="submit" disabled={mutation.isPending || isLoadingShipping || !shippingQuote} className="mt-6 w-full rounded-full">
            {mutation.isPending ? t("checkout.placingOrder") : t("checkout.placeOrder")}
          </Button>
        </aside>
      </form>
    </main>
  );
}

export default CheckoutPage;
