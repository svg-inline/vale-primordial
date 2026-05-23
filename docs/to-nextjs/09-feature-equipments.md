# 09 — Feature: Equipamentos

## Mapeamento de arquivos

| Atual                                              | Novo                                                          |
| -------------------------------------------------- | ------------------------------------------------------------- |
| `features/equipments/pages/EquipmentsPage.js`      | `app/equipments/page.tsx` + `EquipmentsBrowser.tsx`           |
| `features/equipments/worker/equipment.handlers.js` | `lib/queries/equipments.ts` + `lib/calculators/equipments.ts` |
| `features/equipments/data/equipments.json`         | Supabase (`equipments`, `equipment_materials`)                |
| `features/equipments/stores/equipments.store.js`   | `stores/equipments.store.ts`                                  |

---

## Tipos TypeScript

### `src/types/equipments.ts`

```ts
export interface EquipmentMaterial {
  id: string;
  equipment_id: string;
  item_id: string;
  quantity: number;
  items: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
}

export interface Equipment {
  id: string;
  name: string;
  type: "weapon" | "armor" | "ornament";
  class: string;
  level: number;
  grade: number;
  equipment_materials: EquipmentMaterial[];
}

export interface EquipmentFilters {
  type: string;
  class: string;
  level: number | null;
  grade: number | null;
  query: string;
}

export interface AggregatedMaterial {
  itemId: string;
  name: string;
  icon: string | null;
  totalQuantity: number;
  sources: Array<{
    equipmentId: string;
    equipmentName: string;
    quantity: number;
  }>;
}

export interface EquipmentCalculationResult {
  selectedEquipments: Equipment[];
  aggregatedMaterials: AggregatedMaterial[];
  warnings: string[];
}
```

---

## Calculadora de materiais

### `src/lib/calculators/equipments.ts`

```ts
import type {
  Equipment,
  AggregatedMaterial,
  EquipmentCalculationResult,
} from "@/types/equipments";

export function calculateEquipmentMaterials(
  equipments: Equipment[],
  selectedIds: string[],
): EquipmentCalculationResult {
  if (selectedIds.length === 0) {
    return {
      selectedEquipments: [],
      aggregatedMaterials: [],
      warnings: ["NO_EQUIPMENT_SELECTED"],
    };
  }

  const selected = equipments.filter((e) => selectedIds.includes(e.id));

  if (selected.length === 0) {
    return {
      selectedEquipments: [],
      aggregatedMaterials: [],
      warnings: ["EQUIPMENT_NOT_FOUND"],
    };
  }

  const materialMap = new Map<string, AggregatedMaterial>();

  for (const equipment of selected) {
    for (const mat of equipment.equipment_materials) {
      const existing = materialMap.get(mat.item_id);
      const source = {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        quantity: mat.quantity,
      };

      if (existing) {
        existing.totalQuantity += mat.quantity;
        existing.sources.push(source);
      } else {
        materialMap.set(mat.item_id, {
          itemId: mat.item_id,
          name: mat.items?.name ?? mat.item_id,
          icon: mat.items?.icon ?? null,
          totalQuantity: mat.quantity,
          sources: [source],
        });
      }
    }
  }

  return {
    selectedEquipments: selected,
    aggregatedMaterials: [...materialMap.values()].sort(
      (a, b) => b.totalQuantity - a.totalQuantity,
    ),
    warnings: [],
  };
}

export function filterEquipments(
  equipments: Equipment[],
  filters: {
    type?: string;
    class?: string;
    level?: number | null;
    grade?: number | null;
    query?: string;
  },
) {
  const query = normalizeText(filters.query ?? "");

  return equipments.filter((eq) => {
    if (filters.type && eq.type !== filters.type) return false;
    if (filters.class && eq.class !== filters.class && filters.class !== "all")
      return false;
    if (filters.level != null && eq.level !== filters.level) return false;
    if (filters.grade != null && eq.grade !== filters.grade) return false;
    if (query && !normalizeText(eq.name).includes(query)) return false;
    return true;
  });
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
```

---

## Server Component — página

### `src/app/equipments/page.tsx`

```tsx
import { getEquipmentsServer } from "@/lib/queries/equipments";
import { EquipmentsBrowser } from "@/components/features/equipments/EquipmentsBrowser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Equipamentos | Perfect World Helper",
  description:
    "Lista de equipamentos e calculadora de materiais do Perfect World.",
};

export default async function EquipmentsPage() {
  const initialData = await getEquipmentsServer();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <EquipmentsBrowser initialData={initialData} />
    </main>
  );
}
```

---

## Client Component principal

### `src/components/features/equipments/EquipmentsBrowser.tsx`

```tsx
"use client";

import { useMemo } from "react";
import { useEquipmentsQuery } from "@/hooks/useEquipments";
import { useEquipmentsStore } from "@/stores/equipments.store";
import {
  calculateEquipmentMaterials,
  filterEquipments,
} from "@/lib/calculators/equipments";
import { EquipmentFilters } from "./EquipmentFilters";
import { EquipmentMaterialsList } from "./EquipmentMaterialsList";
import type { Equipment } from "@/types/equipments";

interface Props {
  initialData: Equipment[];
}

export function EquipmentsBrowser({ initialData }: Props) {
  const { data: allEquipments = initialData } = useEquipmentsQuery(initialData);
  const { selectedIds, filters, toggleSelected, clearSelected, setFilters } =
    useEquipmentsStore();

  const visibleEquipments = useMemo(
    () => filterEquipments(allEquipments, filters),
    [allEquipments, filters],
  );

  const calculation = useMemo(
    () => calculateEquipmentMaterials(allEquipments, selectedIds),
    [allEquipments, selectedIds],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="grid gap-4">
        <header>
          <h1 className="text-3xl font-black text-[var(--color-text)]">
            Equipamentos
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {selectedIds.length} selecionado(s) de {visibleEquipments.length}{" "}
            visíveis
          </p>
        </header>

        <EquipmentFilters filters={filters} onChange={setFilters} />

        <ul className="grid gap-2">
          {visibleEquipments.map((eq) => {
            const isSelected = selectedIds.includes(eq.id);
            return (
              <li key={eq.id}>
                <button
                  type="button"
                  onClick={() => toggleSelected(eq.id)}
                  aria-pressed={isSelected}
                  className={`w-full rounded border px-4 py-3 text-left text-sm transition-colors ${
                    isSelected
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
                  }`}
                >
                  <span className="font-semibold">{eq.name}</span>
                  <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                    Lv.{eq.level} · {eq.type} · {eq.class}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <aside
        className="lg:sticky lg:top-4"
        aria-label="Materiais calculados"
        aria-live="polite"
      >
        <EquipmentMaterialsList result={calculation} onClear={clearSelected} />
      </aside>
    </div>
  );
}
```

---

## Componente EquipmentMaterialsList

### `src/components/features/equipments/EquipmentMaterialsList.tsx`

```tsx
import Image from "next/image";
import { Trash2 } from "lucide-react";
import type { EquipmentCalculationResult } from "@/types/equipments";

interface Props {
  result: EquipmentCalculationResult;
  onClear: () => void;
}

export function EquipmentMaterialsList({ result, onClear }: Props) {
  if (result.selectedEquipments.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          Selecione equipamentos para calcular os materiais.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="font-bold text-[var(--color-text)]">
          Materiais necessários
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs text-[var(--color-danger)] hover:opacity-80"
          aria-label="Limpar seleção"
        >
          <Trash2 size={14} aria-hidden />
          Limpar
        </button>
      </header>

      <ul className="divide-y divide-[var(--color-border)]">
        {result.aggregatedMaterials.map((mat) => (
          <li key={mat.itemId} className="flex items-center gap-3 px-4 py-3">
            {mat.icon && (
              <Image
                src={mat.icon}
                alt=""
                width={32}
                height={32}
                className="rounded object-contain"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                {mat.name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {mat.sources.length} equipamento(s)
              </p>
            </div>
            <span className="text-sm font-bold text-[var(--color-accent)]">
              ×{mat.totalQuantity}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```
