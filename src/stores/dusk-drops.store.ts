import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DuskDropFilters } from "@/types/dusk-drops";

interface DuskDropsState {
  filters: DuskDropFilters;
  setFilters: (filters: Partial<DuskDropFilters>) => void;
  resetFilters: () => void;
}

export const defaultDuskDropFilters: DuskDropFilters = {
  query: "",
  chapter: "all",
  dusk: "all",
  boss: "all",
  mode: "all",
  dropTable: "all",
  sort: "name",
};

export const useDuskDropsStore = create<DuskDropsState>()(
  persist(
    (set) => ({
      filters: defaultDuskDropFilters,

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () => set({ filters: defaultDuskDropFilters }),
    }),
    {
      name: "pw-helper:dusk-drops:v1",
      partialize: (state) => ({
        filters: state.filters,
      }),
    },
  ),
);
