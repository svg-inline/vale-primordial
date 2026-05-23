import type { Metadata } from "next";
import { EmptyFeature } from "@/components/features/EmptyFeature";
import { getEquipmentsCatalog } from "@/lib/data/catalogs";

export const metadata: Metadata = {
  title: "Equipamentos",
  description: "Lista de equipamentos e calculadora de materiais.",
};

export default function EquipmentsPage() {
  const data = getEquipmentsCatalog();

  return (
    <EmptyFeature eyebrow="Materiais" title="Equipamentos" count={data.length}>
      A pagina foi criada no App Router. O catalogo atual de equipamentos ainda nao possui registros.
    </EmptyFeature>
  );
}
