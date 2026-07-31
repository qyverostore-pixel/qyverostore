import { useQuery } from "@tanstack/react-query";
import { getCoupons } from "@/services/coupons";
export const couponKeys = { all: ["coupons"] as const, list: ["coupons", "list"] as const };
export const useCoupons = () => useQuery({ queryKey: couponKeys.list, queryFn: getCoupons });
