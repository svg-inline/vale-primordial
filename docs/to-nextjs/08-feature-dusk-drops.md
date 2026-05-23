# 08 — Feature: Drops Dusk

## Mapeamento de arquivos

| Atual                                               | Novo                                                      |
| --------------------------------------------------- | --------------------------------------------------------- |
| `features/dusk-drops/pages/DuskDropsPage.js`        | `app/dusk/page.tsx` + `DuskDropsBrowser.tsx`              |
| `features/dusk-drops/worker/dusk-drops.handlers.js` | `lib/queries/dusk-drops.ts`                               |
| `features/dusk-drops/data/dusk-drops.json`          | Supabase (`dusk_drops`, `dusk_bosses`, `dusk_boss_drops`) |
| `features/dusk-drops/stores/dusk-drops.store.js`    | `stores/dusk-drops.store.ts`                              |

---

## Tipos TypeScript

### `src/types/dusk-drops.ts`

```ts
export interface DuskBossDrop {
  id: string;
  boss_id: string;
  item_id: string;
  quantity_min: number;
  quantity_max: number;
  chance: number | null;
  sort_order: number;
  items: {
    id: string;
    name: string;
    icon: string | null;
    type: string;
  } | null;
}

export interface DuskBoss {
  id: string;
  dusk_id: string;
  name: string;
  sort_order: number;
  dusk_boss_drops: DuskBossDrop[];
}

export interface DuskDrop {
  id: string;
  name: string;
  mode: "solo" | "group";
  sort_order: number;
  dusk_bosses: DuskBoss[];
}
```

---

## Server Component — página

### `src/app/dusk/page.tsx`

```tsx
import { getDuskDropsServer } from "@/lib/queries/dusk-drops";
import { DuskDropsBrowser } from "@/components/features/dusk-drops/DuskDropsBrowser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drops Dusk | Perfect World Helper",
  description: "Consulta de drops das dungeons Dusk do Perfect World.",
};

export default async function DuskDropsPage() {
  const initialData = await getDuskDropsServer();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <DuskDropsBrowser initialData={initialData} />
    </main>
  );
}
```

---

## Client Component principal

### `src/components/features/dusk-drops/DuskDropsBrowser.tsx`

```tsx
"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useDuskDropsStore } from "@/stores/dusk-drops.store";
import { useDuskDropsQuery } from "@/hooks/useDuskDrops";
import { DuskDropTable } from "./DuskDropTable";
import { DuskDropFilters } from "./DuskDropFilters";
import type { DuskDrop } from "@/types/dusk-drops";

interface Props {
  initialData: DuskDrop[];
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function DuskDropsBrowser({ initialData }: Props) {
  const { data: allDrops = initialData } = useDuskDropsQuery(initialData);
  const { filters, setFilters, resetFilters } = useDuskDropsStore();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = normalizeText(filters.query);
    return allDrops.filter((dungeon) => {
      if (filters.mode !== "all" && dungeon.mode !== filters.mode) return false;
      if (filters.dungeon && dungeon.id !== filters.dungeon) return false;

      if (!query) return true;

      const dungeonMatch = normalizeText(dungeon.name).includes(query);
      const bossMatch = dungeon.dusk_bosses.some((boss) =>
        normalizeText(boss.name).includes(query),
      );
      const itemMatch = dungeon.dusk_bosses.some((boss) =>
        boss.dusk_boss_drops.some((drop) =>
          normalizeText(drop.items?.name ?? "").includes(query),
        ),
      );

      return dungeonMatch || bossMatch || itemMatch;
    });
  }, [allDrops, filters]);

  const hasActiveFilters =
    filters.query || filters.dungeon || filters.mode !== "all";

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-3xl font-black text-[var(--color-text)]">
          Drops Dusk
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {filtered.length} dungeon(s) encontrada(s)
        </p>
      </header>

      {/* Barra de busca */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar dungeon, boss ou item..."
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-4 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className="inline-flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <SlidersHorizontal size={16} aria-hidden />
          Filtros
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded border border-[var(--color-danger)]/50 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
            aria-label="Limpar filtros"
          >
            <X size={16} aria-hidden />
            Limpar
          </button>
        )}
      </div>

      {filtersOpen && (
        <DuskDropFilters
          filters={filters}
          dungeons={allDrops}
          onChange={setFilters}
        />
      )}

      {filtered.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">
          Nenhum resultado encontrado para os filtros aplicados.
        </p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((dungeon) => (
            <DuskDropTable key={dungeon.id} dungeon={dungeon} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Componente DuskDropTable

### `src/components/features/dusk-drops/DuskDropTable.tsx`

```tsx
import Image from "next/image";
import type { DuskDrop } from "@/types/dusk-drops";

interface Props {
  dungeon: DuskDrop;
}

export function DuskDropTable({ dungeon }: Props) {
  return (
    <section
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
      aria-label={dungeon.name}
    >
      <header className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
        <h2 className="font-bold text-[var(--color-text)]">{dungeon.name}</h2>
        <span className="rounded border border-[var(--color-border)] px-2 py-0.5 text-xs font-bold uppercase text-[var(--color-text-muted)]">
          {dungeon.mode === "solo" ? "Solo" : "Grupo"}
        </span>
      </header>

      {dungeon.dusk_bosses.map((boss) => (
        <div
          key={boss.id}
          className="border-b border-[var(--color-border)] last:border-0"
        >
          <p className="px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
            {boss.name}
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50">
                <th className="px-4 py-2 text-left font-semibold text-[var(--color-text-muted)]">
                  Item
                </th>
                <th className="px-4 py-2 text-right font-semibold text-[var(--color-text-muted)]">
                  Qtd
                </th>
                <th className="px-4 py-2 text-right font-semibold text-[var(--color-text-muted)]">
                  Chance
                </th>
              </tr>
            </thead>
            <tbody>
              {boss.dusk_boss_drops.map((drop) => (
                <tr
                  key={drop.id}
                  className="border-b border-[var(--color-border)]/50 last:border-0 hover:bg-[var(--color-surface-raised)]"
                >
                  <td className="flex items-center gap-2 px-4 py-2">
                    {drop.items?.icon && (
                      <Image
                        src={drop.items.icon}
                        alt=""
                        width={24}
                        height={24}
                        className="rounded object-contain"
                      />
                    )}
                    <span className="text-[var(--color-text)]">
                      {drop.items?.name ?? drop.item_id}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--color-text)]">
                    {drop.quantity_min === drop.quantity_max
                      ? drop.quantity_min
                      : `${drop.quantity_min}–${drop.quantity_max}`}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--color-text-muted)]">
                    {drop.chance != null
                      ? `${(drop.chance * 100).toFixed(1)}%`
                      : "Garantido"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
```
