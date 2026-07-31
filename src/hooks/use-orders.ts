import { useQuery } from "@tanstack/react-query";
import { getMyOrder, getMyOrders } from "@/services/orders";

export const myOrderKeys = {
  all: ["my-orders"] as const,
  detail: (id: string) => ["my-orders", id] as const,
};

export const useMyOrders = () =>
  useQuery({ queryKey: myOrderKeys.all, queryFn: getMyOrders, refetchOnWindowFocus: false });

export const useMyOrder = (id: string | null) =>
  useQuery({
    queryKey: myOrderKeys.detail(id ?? ""),
    queryFn: () => getMyOrder(id!),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });
