# 07 — Feature: Livros Divinos

## Contexto atual

A feature mais complexa do projeto. Inclui:

- Catálogo com filtros (aba, stat, status de obtenção)
- Calculadora de materiais base
- Visualização em árvore de receitas
- Estado persistido (owned, presets, progressos)
- Import/export de estado

## Mapeamento de arquivos

| Arquivo atual                                                    | Arquivo novo                                                      |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| `features/divine-books/pages/DivineBooksPage.js`                 | `app/divine-books/page.tsx` + `DivineBooksBrowser.tsx`            |
| `features/divine-books/worker/divine-books.calculator.js`        | `lib/calculators/divine-books.ts`                                 |
| `features/divine-books/worker/divine-books.handlers.js`          | (incorporado no calculator)                                       |
| `features/divine-books/stores/divine-books.store.js`             | `stores/divine-books.store.ts`                                    |
| `features/divine-books/components/DivineBookCard.js`             | `components/features/divine-books/DivineBookCard.tsx`             |
| `features/divine-books/components/DivineBookFilters.js`          | `components/features/divine-books/DivineBookFilters.tsx`          |
| `features/divine-books/components/DivineBookMaterialsSummary.js` | `components/features/divine-books/DivineBookMaterialsSummary.tsx` |
| `features/divine-books/components/DivineBookTreeView.js`         | `components/features/divine-books/DivineBookTreeView.tsx`         |
| `features/divine-books/data/divine-books.json`                   | Supabase (tables: `items`, `recipes`, `divine_book_tabs`)         |

---

## Tipos TypeScript

### `src/types/divine-books.ts`

```ts
export interface DivineBooksTab {
  id: string;
  label: string;
  sort_order: number;
}

export interface DivineBooksItem {
  id: string;
  type: "divine-book" | "material";
  name: string;
  level: number | null;
  icon: string | null;
  description: string;
  effects: string[];
  tabs: string[];
}

export interface RecipeMaterial {
  item_id: string;
  quantity: number;
  items: Pick<DivineBooksItem, "id" | "name" | "icon"> | null;
}

export interface Recipe {
  id: string;
  result_item_id: string;
  sort_order: number;
  recipe_materials: RecipeMaterial[];
}

export interface DivineBookCatalog {
  schemaVersion: number;
  tabs: DivineBooksTab[];
  items: DivineBooksItem[];
  recipes: Recipe[];
}

// Formato calculado para o card
export interface DivineBooksBookSummary {
  id: string;
  name: string;
  level: number | null;
  icon: string | null;
  effects: string[];
  tabs: string[];
  recipeCount: number;
  ownedQuantity: number;
}

// Resultado da calculadora de materiais base
export interface BaseMaterialsResult {
  required: MaterialEntry[];
  missing: MaterialEntry[];
  progressPercent: number;
  warnings: string[];
}

export interface MaterialEntry {
  itemId: string;
  name: string;
  icon: string | null;
  required: number;
  owned: number;
  missing: number;
}
```

---

## Calculadora migrada

### `src/lib/calculators/divine-books.ts`

> Migrar o conteúdo de `divine-books.calculator.js` para TypeScript.
> A lógica permanece idêntica — apenas adicionar tipos.

```ts
import type {
  DivineBookCatalog,
  DivineBooksItem,
  Recipe,
  BaseMaterialsResult,
  DivineBooksBookSummary,
} from "@/types/divine-books";

export function createDivineBooksService(data: DivineBookCatalog) {
  const books = data.items.filter((i) => i.type === "divine-book");
  const materials = data.items.filter((i) => i.type === "material");
  const itemsById = new Map(data.items.map((i) => [i.id, i]));
  const recipesByResultId = groupBy(data.recipes, "result_item_id");

  // ── filtros ─────────────────────────────────────────────────────────────
  function filterBooks({
    filters = {},
    owned = {},
    recipePreferences = {},
  }: {
    filters?: Partial<DivineBooksFilters>;
    owned?: Record<string, number>;
    recipePreferences?: Record<string, string>;
  }) {
    const f = { ...defaultFilters, ...filters };
    const query = normalizeText(f.query);
    const stat = normalizeText(f.stat);

    const result = books.filter((book) => {
      const recipe = getRecipeForItem(book.id, recipePreferences);
      const matNames = (recipe?.recipe_materials ?? [])
        .map((m) => itemsById.get(m.item_id)?.name ?? "")
        .join(" ");
      const searchable = normalizeText(
        `${book.name} ${book.effects.join(" ")} ${matNames}`,
      );
      const isOwned = (owned[book.id] ?? 0) > 0;

      return (
        (f.tabId === "all" || book.tabs.includes(f.tabId)) &&
        (!query || searchable.includes(query)) &&
        (!stat || normalizeText(book.effects.join(" ")).includes(stat)) &&
        (f.ownedMode === "all" ||
          (f.ownedMode === "owned" && isOwned) ||
          (f.ownedMode === "missing" && !isOwned))
      );
    });

    return {
      books: result.map((b) => toBookSummary(b, owned, recipePreferences)),
      stats: {
        totalBooks: books.length,
        ownedBooks: books.filter((b) => (owned[b.id] ?? 0) > 0).length,
        visibleBooks: result.length,
      },
    };
  }

  // ── materiais base ───────────────────────────────────────────────────────
  function calculateBaseMaterials({
    itemId,
    owned = {},
    treeProgress = {},
    recipePreferences = {},
  }: {
    itemId: string;
    owned?: Record<string, number>;
    treeProgress?: Record<string, boolean>;
    recipePreferences?: Record<string, string>;
  }): BaseMaterialsResult {
    if (!itemsById.has(itemId)) {
      return {
        required: [],
        missing: [],
        progressPercent: 0,
        warnings: ["ITEM_NOT_FOUND"],
      };
    }
    // ... lógica existente adaptada com tipos
  }

  // helpers ...

  return {
    filterBooks,
    calculateBaseMaterials,
    buildTree,
    buildList,
    getItem,
    validateData,
  };
}
```

---

## Server Component — página

### `src/app/divine-books/page.tsx`

```tsx
import { getDivineBookCatalogServer } from "@/lib/queries/divine-books";
import { DivineBooksBrowser } from "@/components/features/divine-books/DivineBooksBrowser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Livros Divinos | Perfect World Helper",
  description: "Calculadora de materiais para Livros Divinos do Perfect World.",
};

export default async function DivineBooksPage() {
  const initialData = await getDivineBookCatalogServer();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <DivineBooksBrowser initialData={initialData} />
    </main>
  );
}
```

---

## Client Component principal

### `src/components/features/divine-books/DivineBooksBrowser.tsx`

```tsx
"use client";

import { useMemo } from "react";
import { useDivineBooksQuery } from "@/hooks/useDivineBooks";
import { useDivineBooksStore } from "@/stores/divine-books.store";
import { createDivineBooksService } from "@/lib/calculators/divine-books";
import { useHydration } from "@/hooks/useHydration";
import { DivineBookFilters } from "./DivineBookFilters";
import { DivineBookCard } from "./DivineBookCard";
import { DivineBookMaterialsSummary } from "./DivineBookMaterialsSummary";
import type { DivineBookCatalog } from "@/types/divine-books";

interface Props {
  initialData: DivineBookCatalog;
}

export function DivineBooksBrowser({ initialData }: Props) {
  const hydrated = useHydration();
  const { data: catalog = initialData } = useDivineBooksQuery(initialData);

  const { owned, filters, recipePreferences, setFilters } =
    useDivineBooksStore();

  const service = useMemo(() => createDivineBooksService(catalog), [catalog]);

  const { books, stats } = useMemo(
    () =>
      service.filterBooks({
        filters,
        owned: hydrated ? owned : {},
        recipePreferences: hydrated ? recipePreferences : {},
      }),
    [service, filters, owned, recipePreferences, hydrated],
  );

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-3xl font-black text-[var(--color-text)]">
          Livros Divinos
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {stats.visibleBooks} visíveis de {stats.totalBooks} livros —{" "}
          {stats.ownedBooks} obtidos
        </p>
      </header>

      <DivineBookFilters
        filters={filters}
        tabs={catalog.tabs}
        stats={catalog.items
          .filter((i) => i.type === "divine-book")
          .flatMap((i) => i.effects)}
        onChange={setFilters}
      />

      {books.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">
          Nenhum livro encontrado.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <li key={book.id}>
              <DivineBookCard book={book} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## Componente DivineBookCard

### `src/components/features/divine-books/DivineBookCard.tsx`

```tsx
"use client";

import { Check, Hammer, Library, Plus } from "lucide-react";
import Image from "next/image";
import { useDivineBooksStore } from "@/stores/divine-books.store";
import type { DivineBooksBookSummary } from "@/types/divine-books";

interface Props {
  book: DivineBooksBookSummary;
}

export function DivineBookCard({ book }: Props) {
  const updateOwned = useDivineBooksStore((s) => s.updateOwned);
  const owned = useDivineBooksStore((s) => s.owned[book.id] ?? 0);
  const isOwned = owned > 0;

  return (
    <article
      className={`relative grid gap-3 overflow-hidden rounded-lg p-4 bg-[var(--color-surface)] border border-[var(--color-border)] ${
        isOwned ? "ring-1 ring-[var(--color-accent)]" : ""
      }`}
    >
      <div className="flex gap-3">
        {book.icon && (
          <Image
            src={book.icon}
            alt=""
            width={48}
            height={48}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] object-contain p-1"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-extrabold leading-tight text-[var(--color-text)]">
              {book.name}
            </h2>
            {isOwned && (
              <span className="inline-flex items-center gap-1 rounded border border-[var(--color-accent)]/50 bg-[var(--color-accent-soft)] px-2 py-1 text-xs font-bold text-[var(--color-accent)]">
                <Check size={14} aria-hidden />
                {owned}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-bold uppercase text-[var(--color-text-muted)]">
            Nível {book.level ?? "-"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {book.effects.map((effect) => (
          <span
            key={effect}
            className="rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-1 text-xs text-[var(--color-accent)]"
          >
            {effect}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-text-muted)]">
          {book.recipeCount > 1 ? (
            <Library size={14} aria-hidden />
          ) : (
            <Hammer size={14} aria-hidden />
          )}
          {book.recipeCount} receita(s)
        </span>
        <button
          type="button"
          onClick={() => updateOwned(book.id, 1)}
          className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm font-semibold bg-[var(--color-accent)] text-[var(--color-page)] hover:opacity-90 transition-opacity"
          aria-label={`Marcar ${book.name} como obtido`}
        >
          <Plus size={16} aria-hidden />
          Obtido
        </button>
      </div>
    </article>
  );
}
```
