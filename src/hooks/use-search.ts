import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { searchProducts } from "@/services/search";

const SEARCH_DELAY = 300;

export const searchKeys = {
  all: ["product-search"] as const,
  term: (term: string) => [...searchKeys.all, term] as const,
};

export function useProductSearch(term: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const normalizedTerm = term.trim();
  const [debouncedTerm, setDebouncedTerm] = useState(normalizedTerm);

  useEffect(() => {
    if (normalizedTerm === debouncedTerm) return;

    void queryClient.cancelQueries({ queryKey: searchKeys.all });
    const timeout = window.setTimeout(() => setDebouncedTerm(normalizedTerm), SEARCH_DELAY);
    return () => window.clearTimeout(timeout);
  }, [debouncedTerm, normalizedTerm, queryClient]);

  const searchNow = useCallback(
    (value: string) => {
      const nextTerm = value.trim();
      if (nextTerm !== debouncedTerm) void queryClient.cancelQueries({ queryKey: searchKeys.all });
      setDebouncedTerm(nextTerm);
    },
    [debouncedTerm, queryClient],
  );

  const query = useQuery({
    queryKey: searchKeys.term(debouncedTerm),
    queryFn: ({ signal }) => searchProducts(debouncedTerm, signal),
    enabled: enabled && Boolean(debouncedTerm),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return useMemo(
    () => ({
      ...query,
      searchNow,
      isDebouncing: Boolean(normalizedTerm) && normalizedTerm !== debouncedTerm,
    }),
    [debouncedTerm, normalizedTerm, query, searchNow],
  );
}
