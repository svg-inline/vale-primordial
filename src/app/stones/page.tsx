import type { Metadata } from "next";
import { EmptyFeature } from "@/components/features/EmptyFeature";
import { getStonesCatalog } from "@/lib/data/catalogs";

export const metadata: Metadata = {
  title: "Pedras",
  description: "Calculadora de forja de pedras.",
};

export default function StonesPage() {
  const data = getStonesCatalog();

  return (
    <EmptyFeature eyebrow="Forja" title="Pedras" count={data.length}>
      A rota e a base visual ja estao prontas. O arquivo de pedras migrado esta vazio no projeto antigo.
    </EmptyFeature>
  );
}
