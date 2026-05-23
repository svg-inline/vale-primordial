import { useQuery } from "@tanstack/react-query";
import type { DuskDropsCatalog } from "@/types/dusk-drops";

export const duskDropsQueryKey = ["dusk-drops-catalog"] as const;

export function useDuskDropsQuery(initialData: DuskDropsCatalog) {
  return useQuery({
    queryKey: duskDropsQueryKey,
    queryFn: async () => initialData,
    initialData,
    staleTime: Infinity,
  });
}
