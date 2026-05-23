"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { stylePresets, useAppStore } from "@/stores/app.store";
import type { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-style-preset"
      defaultTheme="dark"
      enableSystem={false}
      themes={stylePresets.map((preset) => preset.id)}
    >
      <StylePresetSync />
      {children}
    </NextThemesProvider>
  );
}

function StylePresetSync() {
  const stylePreset = useAppStore((state) => state.stylePreset);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(stylePreset);
    document.documentElement.dataset.stylePreset = stylePreset;
  }, [setTheme, stylePreset]);

  return null;
}
