import { useQuery } from "@tanstack/react-query";
import { getShippingQuote, getShippingZones } from "@/services/shipping";

export const shippingKeys = {
  all: ["shipping-zones"] as const,
  quote: (governorate: string, city: string) => ["shipping-quote", governorate, city] as const,
};
export const useShippingZones = (admin = false) =>
  useQuery({ queryKey: [...shippingKeys.all, admin], queryFn: () => getShippingZones(admin) });
export const useShippingQuote = (governorate: string, city: string) =>
  useQuery({
    queryKey: shippingKeys.quote(governorate, city),
    queryFn: () => getShippingQuote(governorate, city),
    enabled: Boolean(governorate),
  });
