import type { Metadata } from "next";
import { DivineBookTreeBrowser } from "@/components/features/divine-books/DivineBookTreeBrowser";
import { getDivineBookCatalogServer } from "@/lib/queries/divine-books";

export const metadata: Metadata = {
  title: "Arvore de materiais",
  description: "Arvore completa de materiais dos Livros Divinos.",
};

interface DivineBookTreePageProps {
  searchParams: Promise<{
    book?: string | string[];
  }>;
}

export default async function DivineBookTreePage({ searchParams }: DivineBookTreePageProps) {
  const [catalog, params] = await Promise.all([getDivineBookCatalogServer(), searchParams]);
  const bookParam = Array.isArray(params.book) ? params.book[0] : params.book;

  return <DivineBookTreeBrowser catalog={catalog} initialBookId={bookParam ?? ""} />;
}
