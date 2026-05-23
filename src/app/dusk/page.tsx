import type { Metadata } from "next";
import { EmptyFeature } from "@/components/features/EmptyFeature";
import { getDuskDropsCatalog } from "@/lib/data/catalogs";

export const metadata: Metadata = {
  title: "Drops Dusk",
  description: "Consulta de drops das dungeons Dusk.",
};

export default function DuskPage() {
  const data = getDuskDropsCatalog();

  return (
    <EmptyFeature eyebrow="Consulta" title="Drops Dusk" count={data.length}>
      A estrutura da rota ja esta em Next.js. O JSON atual de Drops Dusk esta vazio em
      <code className="mx-1 rounded border border-border px-1">project-old/src/features/dusk-drops/data/dusk-drops.json</code>.
    </EmptyFeature>
  );
}
