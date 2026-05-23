import { useQuery } from "@tanstack/react-query";
import type { DivineBookCatalog } from "@/types/divine-books";

export const divineBooksQueryKey = ["divine-books-catalog"] as const;

export function useDivineBooksQuery(initialData: DivineBookCatalog) {
  return useQuery({
    queryKey: divineBooksQueryKey,
    queryFn: getDivineBookCatalogClient,
    initialData,
  });
}

async function getDivineBookCatalogClient(): Promise<DivineBookCatalog> {
  const response = await fetch("/api/divine-books", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar Livros Divinos.");
  }

  return response.json() as Promise<DivineBookCatalog>;
}
