# 10 — Feature: Pedras

## Mapeamento de arquivos

| Atual                                      | Novo                                           |
| ------------------------------------------ | ---------------------------------------------- |
| `features/stones/pages/StonesPage.js`      | `app/stones/page.tsx` + `StonesCalculator.tsx` |
| `features/stones/worker/stone.handlers.js` | `lib/calculators/stones.ts`                    |
| `features/stones/data/stones.json`         | Supabase (`stones`, `stone_recipe_materials`)  |
| `features/stones/stores/stones.store.js`   | `stores/stones.store.ts`                       |

---

## Tipos TypeScript

### `src/types/stones.ts`

```ts
export interface StoneRecipeMaterial {
  id: string;
  stone_id: string;
  item_id: string | null;
  stone_id_ref: string | null;
  quantity: number;
  sort_order: number;
}

export interface Stone {
  id: string;
  name: string;
  level: number;
  stone_recipe_materials: StoneRecipeMaterial[];
}

export interface StoneCalculationInput {
  fromLevel: number;
  toLevel: number;
  quantity: number;
}

export interface StoneCalculationStep {
  fromStone: Stone;
  toStone: Stone;
  quantityNeeded: number;
  baseStones: number;
}

export interface StoneCalculationResult {
  fromLevel: number;
  toLevel: number;
  quantity: number;
  steps: StoneCalculationStep[];
  totalBaseStones: number;
  warnings: string[];
}
```

---

## Calculadora de pedras

### `src/lib/calculators/stones.ts`

```ts
import type {
  Stone,
  StoneCalculationInput,
  StoneCalculationResult,
} from "@/types/stones";

export function calculateStones(
  input: StoneCalculationInput,
  stones: Stone[],
): StoneCalculationResult {
  const { fromLevel, toLevel, quantity } = input;

  if (fromLevel >= toLevel) {
    return {
      ...input,
      steps: [],
      totalBaseStones: 0,
      warnings: ["INVALID_STONE_RANGE"],
    };
  }

  if (quantity <= 0) {
    return {
      ...input,
      steps: [],
      totalBaseStones: 0,
      warnings: ["INVALID_QUANTITY"],
    };
  }

  const stonesById = new Map(stones.map((s) => [s.level, s]));
  const steps: StoneCalculationResult["steps"] = [];

  // Calcular cada etapa de fromLevel até toLevel
  let currentQuantity = quantity;

  for (let level = toLevel; level > fromLevel; level--) {
    const toStone = stonesById.get(level);
    const fromStone = stonesById.get(level - 1);

    if (!toStone || !fromStone) {
      continue;
    }

    // Quantas pedras do nível anterior são necessárias para uma pedra deste nível
    const ratio = getRecipeRatio(toStone, level - 1);

    steps.unshift({
      fromStone,
      toStone,
      quantityNeeded: currentQuantity,
      baseStones: currentQuantity * ratio,
    });

    currentQuantity *= ratio;
  }

  return {
    ...input,
    steps,
    totalBaseStones: currentQuantity,
    warnings: [],
  };
}

function getRecipeRatio(stone: Stone, fromLevel: number): number {
  const ref = stone.stone_recipe_materials.find((m) => m.stone_id_ref !== null);
  return ref?.quantity ?? 3; // padrão: 3 pedras do nível anterior
}
```

---

## Server Component — página

### `src/app/stones/page.tsx`

```tsx
import { getStonesServer } from "@/lib/queries/stones";
import { StonesCalculator } from "@/components/features/stones/StonesCalculator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedras | Perfect World Helper",
  description: "Calculadora de forja de pedras do Perfect World.",
};

export default async function StonesPage() {
  const initialData = await getStonesServer();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <StonesCalculator initialData={initialData} />
    </main>
  );
}
```

---

## Client Component principal

### `src/components/features/stones/StonesCalculator.tsx`

```tsx
"use client";

import { useMemo } from "react";
import { useStonesQuery } from "@/hooks/useStones";
import { useStonesStore } from "@/stores/stones.store";
import { calculateStones } from "@/lib/calculators/stones";
import { StoneResult } from "./StoneResult";
import type { Stone } from "@/types/stones";

interface Props {
  initialData: Stone[];
}

export function StonesCalculator({ initialData }: Props) {
  const { data: stones = initialData } = useStonesQuery(initialData);
  const {
    fromLevel,
    toLevel,
    quantity,
    setFromLevel,
    setToLevel,
    setQuantity,
  } = useStonesStore();

  const maxLevel =
    stones.length > 0 ? Math.max(...stones.map((s) => s.level)) : 10;
  const minLevel =
    stones.length > 0 ? Math.min(...stones.map((s) => s.level)) : 1;

  const result = useMemo(
    () => calculateStones({ fromLevel, toLevel, quantity }, stones),
    [fromLevel, toLevel, quantity, stones],
  );

  return (
    <div className="grid gap-6 max-w-xl">
      <header>
        <h1 className="text-3xl font-black text-[var(--color-text)]">
          Forja de Pedras
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Calcule quantas pedras base você precisa para chegar ao nível
          desejado.
        </p>
      </header>

      <section
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 grid gap-4"
        aria-label="Parâmetros do cálculo"
      >
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="from-level"
              className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1"
            >
              Do nível
            </label>
            <input
              id="from-level"
              type="number"
              min={minLevel}
              max={maxLevel - 1}
              value={fromLevel}
              onChange={(e) => setFromLevel(Number(e.target.value))}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label
              htmlFor="to-level"
              className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1"
            >
              Ao nível
            </label>
            <input
              id="to-level"
              type="number"
              min={minLevel + 1}
              max={maxLevel}
              value={toLevel}
              onChange={(e) => setToLevel(Number(e.target.value))}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label
              htmlFor="quantity"
              className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1"
            >
              Quantidade
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>

        {result.warnings.includes("INVALID_STONE_RANGE") && (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            O nível inicial deve ser menor que o nível final.
          </p>
        )}
      </section>

      <StoneResult result={result} aria-live="polite" />
    </div>
  );
}
```

---

## Componente StoneResult

### `src/components/features/stones/StoneResult.tsx`

```tsx
import type { StoneCalculationResult } from "@/types/stones";

interface Props {
  result: StoneCalculationResult;
}

export function StoneResult({ result }: Props) {
  if (result.warnings.length > 0) {
    return null;
  }

  return (
    <section
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
      aria-label="Resultado do cálculo"
    >
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
        <h2 className="font-bold text-[var(--color-text)]">Resultado</h2>
      </header>

      <div className="p-4 grid gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-muted)]">
            Total de pedras base necessárias
          </span>
          <span className="text-2xl font-black text-[var(--color-accent)]">
            {result.totalBaseStones.toLocaleString("pt-BR")}
          </span>
        </div>

        {result.steps.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="pb-2 text-left font-semibold text-[var(--color-text-muted)]">
                  Etapa
                </th>
                <th className="pb-2 text-right font-semibold text-[var(--color-text-muted)]">
                  Quantidade
                </th>
                <th className="pb-2 text-right font-semibold text-[var(--color-text-muted)]">
                  Pedras base
                </th>
              </tr>
            </thead>
            <tbody>
              {result.steps.map((step, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--color-border)]/50 last:border-0"
                >
                  <td className="py-2 text-[var(--color-text)]">
                    {step.fromStone.name} → {step.toStone.name}
                  </td>
                  <td className="py-2 text-right text-[var(--color-text)]">
                    ×{step.quantityNeeded}
                  </td>
                  <td className="py-2 text-right font-semibold text-[var(--color-accent)]">
                    {step.baseStones.toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
```
