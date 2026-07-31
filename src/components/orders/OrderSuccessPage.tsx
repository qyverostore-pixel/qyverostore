import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createWhatsAppOrderUrl } from "@/lib/whatsapp";
import { getOrderById } from "@/services/orders";
import { useStorefrontSettings } from "@/providers/StorefrontSettingsProvider";

export function OrderSuccessPage({ orderId }: { orderId?: string }) {
  const settings = useStorefrontSettings();
  const { data: order } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId!),
    enabled: Boolean(orderId),
  });
  return (
    <main className="min-h-screen bg-noise px-6 pb-24 pt-12 sm:pb-32 sm:pt-20">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center sm:p-12">
        <CheckCircle2 className="mx-auto size-12 text-teal" />
        <h1 className="text-display mt-6 text-3xl font-light sm:text-4xl">Order placed.</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Your order has been received. You can follow its status from your account.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {order && settings.whatsapp && (
            <Button asChild>
              <a
                href={createWhatsAppOrderUrl(order, settings.whatsapp, "QYVERO")}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle />
                Contact QYVERO on WhatsApp
              </a>
            </Button>
          )}
          <Button asChild>
            <Link to="/profile/orders">View my orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/products">Continue shopping</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
