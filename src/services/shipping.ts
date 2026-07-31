import { supabase } from "@/lib/supabase";

export type ShippingZone = {
  id: string;
  governorate: string;
  city: string | null;
  is_active: boolean;
  created_at: string;
  rate: ShippingRate | null;
};
export type ShippingRate = {
  id: string;
  zone_id: string;
  shipping_cost: number;
  estimated_delivery_days: number;
  is_active: boolean;
};
export type ShippingZoneInput = {
  governorate: string;
  city: string | null;
  is_active: boolean;
  shipping_cost: number;
  estimated_delivery_days: number;
  rate_is_active: boolean;
};

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};
const normalize = (
  zone: ShippingZone & { rate?: ShippingRate | ShippingRate[] | null },
): ShippingZone => ({
  ...zone,
  rate: Array.isArray(zone.rate) ? (zone.rate[0] ?? null) : (zone.rate ?? null),
});
const select =
  "id,governorate,city,is_active,created_at,rate:shipping_rates(id,zone_id,shipping_cost,estimated_delivery_days,is_active)";

export async function getShippingZones(admin = false) {
  let query = supabase.from("shipping_zones").select(select).order("governorate").order("city");
  if (!admin) query = query.eq("is_active", true);
  const { data, error } = await query;
  fail(error);
  return ((data ?? []) as unknown as ShippingZone[]).map(normalize);
}

export async function getShippingQuote(governorate: string, city?: string) {
  if (!governorate) return null;
  const zones = await getShippingZones();
  return (
    zones.find(
      (zone) => zone.city?.toLowerCase() === city?.toLowerCase() && zone.rate?.is_active,
    ) ??
    zones.find((zone) => zone.city === null && zone.rate?.is_active) ??
    null
  );
}

export async function saveShippingZone(input: ShippingZoneInput, id?: string) {
  const zone = {
    governorate: input.governorate.trim(),
    city: input.city?.trim() || null,
    is_active: input.is_active,
  };
  let zoneId = id;
  if (zoneId) {
    const { error } = await supabase.from("shipping_zones").update(zone).eq("id", zoneId);
    fail(error);
  } else {
    const { data, error } = await supabase
      .from("shipping_zones")
      .insert(zone)
      .select("id")
      .single();
    fail(error);
    if (!data) throw new Error("Shipping zone could not be created.");
    zoneId = data.id;
  }
  const rate = {
    shipping_cost: input.shipping_cost,
    estimated_delivery_days: input.estimated_delivery_days,
    is_active: input.rate_is_active,
  };
  const { error } = await supabase
    .from("shipping_rates")
    .upsert({ zone_id: zoneId, ...rate }, { onConflict: "zone_id" });
  fail(error);
}

export async function deleteShippingZone(id: string) {
  const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
  fail(error);
}
