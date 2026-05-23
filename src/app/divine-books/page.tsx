import type { Metadata } from "next";
import { DivineBooksBrowser } from "@/components/features/divine-books/DivineBooksBrowser";
import { getDivineBookCatalogServer } from "@/lib/queries/divine-books";

export const metadata: Metadata = {
  title: "Livros Divinos",
  description: "Catalogo e calculadora de materiais para Livros Divinos.",
};

export default async function DivineBooksPage() {
  const catalog = await getDivineBookCatalogServer();

  return <DivineBooksBrowser catalog={catalog} />;
}
