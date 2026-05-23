import type { Metadata } from "next";
import { DuskDropsBrowser } from "@/components/features/dusk-drops/DuskDropsBrowser";
import { getDuskDropsCatalogServer } from "@/lib/queries/dusk-drops";

export const metadata: Metadata = {
  title: "Drops Dusk",
  description: "Consulta de drops das dungeons Dusk.",
};

export default function DuskPage() {
  const catalog = getDuskDropsCatalogServer();

  return <DuskDropsBrowser catalog={catalog} />;
}
