"use client";

import { isStylePreset, stylePresets, useAppStore } from "@/stores/app.store";
import { Select } from "@/components/ui";

export function StylePresetSwitcher() {
  const stylePreset = useAppStore((state) => state.stylePreset);
  const setStylePreset = useAppStore((state) => state.setStylePreset);

  return (
    <Select
      id="style-preset"
      label="Tema"
      value={stylePreset}
      onChange={(event) => {
        if (isStylePreset(event.target.value)) {
          setStylePreset(event.target.value);
        }
      }}
      options={stylePresets.map((preset) => ({
        label: preset.label,
        value: preset.id,
      }))}
    />
  );
}
