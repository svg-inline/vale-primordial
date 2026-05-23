# 05 — State Management com Zustand

## Princípio

Zustand substitui:

- O `useState` global do LiteDom (que re-renderizava a página inteira)
- As funções do `divine-books.store.js` (localStorage manual)
- As preferências de `storage.js`

---

## Instalação

```bash
npm install zustand
```

---

## `src/stores/app.store.ts`

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type StylePreset =
  | "dark"
  | "arcane"
  | "classic"
  | "high-contrast"
  | "cupcake"
  | "dracula"
  | "light";

interface AppState {
  stylePreset: StylePreset;
  language: string;
  setStylePreset: (preset: StylePreset) => void;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      stylePreset: "dark",
      language: "pt-BR",
      setStylePreset: (preset) => set({ stylePreset: preset }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "pw-helper:app:v1",
      partialize: (state) => ({
        stylePreset: state.stylePreset,
        language: state.language,
      }),
    },
  ),
);
```

---

## `src/stores/divine-books.store.ts`

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DivineBooksFilters {
  tabId: string;
  query: string;
  stat: string;
  ownedMode: "all" | "owned" | "missing";
}

interface DivineBooksState {
  owned: Record<string, number>;
  treeProgressByRoot: Record<string, Record<string, boolean>>;
  recipePreferences: Record<string, string>;
  presets: Record<string, { owned: Record<string, number> }>;
  filters: DivineBooksFilters;

  // Actions
  updateOwned: (itemId: string, delta: number) => void;
  setTreeNodeProgress: (
    rootItemId: string,
    nodeId: string,
    value: boolean,
  ) => void;
  resetTreeProgress: (rootItemId: string) => void;
  setRecipePreference: (itemId: string, recipeId: string) => void;
  setFilters: (filters: Partial<DivineBooksFilters>) => void;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  exportState: () => string;
  importState: (json: string) => void;
}

export const defaultDivineBooksFilters: DivineBooksFilters = {
  tabId: "all",
  query: "",
  stat: "",
  ownedMode: "all",
};

export const useDivineBooksStore = create<DivineBooksState>()(
  persist(
    (set, get) => ({
      owned: {},
      treeProgressByRoot: {},
      recipePreferences: {},
      presets: {},
      filters: defaultDivineBooksFilters,

      updateOwned: (itemId, delta) =>
        set((state) => {
          const current = Number(state.owned[itemId]) || 0;
          const next = Math.max(current + delta, 0);
          const owned = { ...state.owned };
          if (next > 0) {
            owned[itemId] = next;
          } else {
            delete owned[itemId];
          }
          return { owned };
        }),

      setTreeNodeProgress: (rootItemId, nodeId, value) =>
        set((state) => {
          const treeProgress = {
            ...state.treeProgressByRoot,
            [rootItemId]: {
              ...(state.treeProgressByRoot[rootItemId] ?? {}),
            },
          };
          if (value) {
            treeProgress[rootItemId][nodeId] = true;
          } else {
            delete treeProgress[rootItemId][nodeId];
          }
          return { treeProgressByRoot: treeProgress };
        }),

      resetTreeProgress: (rootItemId) =>
        set((state) => {
          const treeProgressByRoot = { ...state.treeProgressByRoot };
          delete treeProgressByRoot[rootItemId];
          return { treeProgressByRoot };
        }),

      setRecipePreference: (itemId, recipeId) =>
        set((state) => ({
          recipePreferences: { ...state.recipePreferences, [itemId]: recipeId },
        })),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      savePreset: (name) =>
        set((state) => ({
          presets: {
            ...state.presets,
            [name]: { owned: { ...state.owned } },
          },
        })),

      loadPreset: (name) =>
        set((state) => {
          const preset = state.presets[name];
          if (!preset) return {};
          return { owned: { ...preset.owned } };
        }),

      deletePreset: (name) =>
        set((state) => {
          const presets = { ...state.presets };
          delete presets[name];
          return { presets };
        }),

      exportState: () => {
        const state = get();
        return JSON.stringify({
          owned: state.owned,
          treeProgressByRoot: state.treeProgressByRoot,
          recipePreferences: state.recipePreferences,
          presets: state.presets,
        });
      },

      importState: (json) => {
        try {
          const parsed = JSON.parse(json);
          set({
            owned: parsed.owned ?? {},
            treeProgressByRoot: parsed.treeProgressByRoot ?? {},
            recipePreferences: parsed.recipePreferences ?? {},
            presets: parsed.presets ?? {},
          });
        } catch {
          // JSON inválido — ignorar silenciosamente
        }
      },
    }),
    {
      name: "pw-helper:divine-books:v1",
      partialize: (state) => ({
        owned: state.owned,
        treeProgressByRoot: state.treeProgressByRoot,
        recipePreferences: state.recipePreferences,
        presets: state.presets,
        filters: state.filters,
      }),
    },
  ),
);
```

---

## `src/stores/equipments.store.ts`

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EquipmentsState {
  selectedIds: string[];
  filters: {
    type: string;
    class: string;
    level: number | null;
    query: string;
  };
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  setFilters: (filters: Partial<EquipmentsState["filters"]>) => void;
}

export const useEquipmentsStore = create<EquipmentsState>()(
  persist(
    (set) => ({
      selectedIds: [],
      filters: { type: "", class: "", level: null, query: "" },

      toggleSelected: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((i) => i !== id)
            : [...state.selectedIds, id],
        })),

      clearSelected: () => set({ selectedIds: [] }),

      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
    }),
    {
      name: "pw-helper:equipments:v1",
      partialize: (state) => ({ selectedIds: state.selectedIds }),
    },
  ),
);
```

---

## `src/stores/dusk-drops.store.ts`

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DuskDropsState {
  filters: {
    dungeon: string;
    boss: string;
    item: string;
    mode: "all" | "solo" | "group";
    query: string;
  };
  setFilters: (filters: Partial<DuskDropsState["filters"]>) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  dungeon: "",
  boss: "",
  item: "",
  mode: "all" as const,
  query: "",
};

export const useDuskDropsStore = create<DuskDropsState>()((set) => ({
  filters: defaultFilters,
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
```

---

## `src/stores/stones.store.ts`

```ts
import { create } from "zustand";

interface StonesState {
  fromLevel: number;
  toLevel: number;
  quantity: number;
  setFromLevel: (level: number) => void;
  setToLevel: (level: number) => void;
  setQuantity: (qty: number) => void;
}

export const useStonesStore = create<StonesState>()((set) => ({
  fromLevel: 1,
  toLevel: 5,
  quantity: 1,
  setFromLevel: (level) => set({ fromLevel: level }),
  setToLevel: (level) => set({ toLevel: level }),
  setQuantity: (qty) => set({ quantity: qty }),
}));
```

---

## Uso nos componentes

```tsx
"use client";
import { useDivineBooksStore } from "@/stores/divine-books.store";

export function DivineBookCard({ book }) {
  const { owned, updateOwned } = useDivineBooksStore();
  const ownedQty = owned[book.id] ?? 0;

  return (
    <article>
      <h2>{book.name}</h2>
      <button onClick={() => updateOwned(book.id, 1)}>+1</button>
      {ownedQty > 0 && <span>{ownedQty} obtido(s)</span>}
    </article>
  );
}
```

---

## SSR — Hidratação do Zustand

O middleware `persist` usa `localStorage`. Em SSR o `localStorage` não existe.
Para evitar hydration mismatch usar `useEffect` ou o hook `useHydration`:

```tsx
// src/hooks/useHydration.ts
import { useEffect, useState } from "react";

export function useHydration() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
```

```tsx
"use client";
export function DivineBooksBrowser({ initialData }) {
  const hydrated = useHydration();
  const owned = useDivineBooksStore((s) => s.owned);

  if (!hydrated) {
    // Renderiza sem dados do localStorage para evitar mismatch
    return <DivineBooksGrid books={initialData.books} owned={{}} />;
  }

  return <DivineBooksGrid books={initialData.books} owned={owned} />;
}
```
