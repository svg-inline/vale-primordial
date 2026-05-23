import { create } from "zustand";
import { persist } from "zustand/middleware";

export const stylePresets = [
  { id: "dark", label: "Escuro" },
  { id: "arcane", label: "Arcano" },
  { id: "classic", label: "Classico" },
  { id: "high-contrast", label: "Alto contraste" },
  { id: "cupcake", label: "Cupcake" },
  { id: "dracula", label: "Dracula" },
  { id: "light", label: "Claro" },
] as const;

export const supportedLocales = ["pt-BR", "en-US", "es-ES"] as const;

export type StylePreset = (typeof stylePresets)[number]["id"];
export type AppLocale = (typeof supportedLocales)[number];

interface AppState {
  stylePreset: StylePreset;
  language: AppLocale;
  setStylePreset: (preset: StylePreset) => void;
  setLanguage: (language: AppLocale) => void;
}

export function isStylePreset(value: string): value is StylePreset {
  return stylePresets.some((preset) => preset.id === value);
}

export function isAppLocale(value: string): value is AppLocale {
  return supportedLocales.some((locale) => locale === value);
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      stylePreset: "dark",
      language: "pt-BR",
      setStylePreset: (stylePreset) => set({ stylePreset }),
      setLanguage: (language) => set({ language }),
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
