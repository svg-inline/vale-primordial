import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DivineBookFilters } from "@/types/divine-books";

interface DivineBooksPreset {
  owned: Record<string, number>;
  treeProgressByRoot: Record<string, Record<string, boolean>>;
  recipePreferences: Record<string, string>;
}

interface DivineBooksState {
  owned: Record<string, number>;
  treeProgressByRoot: Record<string, Record<string, boolean>>;
  recipePreferences: Record<string, string>;
  presets: Record<string, DivineBooksPreset>;
  filters: DivineBookFilters;
  updateOwned: (itemId: string, delta: number) => void;
  clearOwned: () => void;
  setTreeNodeProgress: (rootItemId: string, nodeId: string, value: boolean) => void;
  resetTreeProgress: (rootItemId: string) => void;
  setRecipePreference: (itemId: string, recipeId: string) => void;
  setFilters: (filters: Partial<DivineBookFilters>) => void;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  exportState: () => string;
  importState: (json: string) => boolean;
}

export const defaultDivineBooksFilters: DivineBookFilters = {
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
          const quantity = Math.max((state.owned[itemId] ?? 0) + delta, 0);
          const owned = { ...state.owned };

          if (quantity > 0) {
            owned[itemId] = quantity;
          } else {
            delete owned[itemId];
          }

          return { owned };
        }),

      clearOwned: () => set({ owned: {}, treeProgressByRoot: {} }),

      setTreeNodeProgress: (rootItemId, nodeId, value) =>
        set((state) => {
          const rootProgress = { ...(state.treeProgressByRoot[rootItemId] ?? {}) };
          const treeProgressByRoot = { ...state.treeProgressByRoot };

          if (value) {
            rootProgress[nodeId] = true;
          } else {
            delete rootProgress[nodeId];
          }

          if (Object.keys(rootProgress).length === 0) {
            delete treeProgressByRoot[rootItemId];
          } else {
            treeProgressByRoot[rootItemId] = rootProgress;
          }

          return { treeProgressByRoot };
        }),

      resetTreeProgress: (rootItemId) =>
        set((state) => {
          const treeProgressByRoot = { ...state.treeProgressByRoot };
          delete treeProgressByRoot[rootItemId];
          return { treeProgressByRoot };
        }),

      setRecipePreference: (itemId, recipeId) =>
        set((state) => {
          const recipePreferences = { ...state.recipePreferences };

          if (recipeId) {
            recipePreferences[itemId] = recipeId;
          } else {
            delete recipePreferences[itemId];
          }

          return { recipePreferences };
        }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      savePreset: (name) =>
        set((state) => {
          const presetName = name.trim();

          if (!presetName) {
            return {};
          }

          return {
            presets: {
              ...state.presets,
              [presetName]: {
                owned: { ...state.owned },
                treeProgressByRoot: { ...state.treeProgressByRoot },
                recipePreferences: { ...state.recipePreferences },
              },
            },
          };
        }),

      loadPreset: (name) =>
        set((state) => {
          const preset = state.presets[name];

          if (!preset) {
            return {};
          }

          return {
            owned: { ...preset.owned },
            treeProgressByRoot: { ...preset.treeProgressByRoot },
            recipePreferences: { ...preset.recipePreferences },
          };
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
          const parsed = JSON.parse(json) as Partial<DivineBooksPreset> & {
            presets?: Record<string, DivineBooksPreset>;
          };

          set({
            owned: parsed.owned ?? {},
            treeProgressByRoot: parsed.treeProgressByRoot ?? {},
            recipePreferences: parsed.recipePreferences ?? {},
            presets: parsed.presets ?? {},
          });

          return true;
        } catch {
          return false;
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
