export const defaultStylePreset = "dark";

export const stylePresets = [
  { id: "dark", labelKey: "stylePresets.dark" },
  { id: "arcane", labelKey: "stylePresets.arcane" },
  { id: "classic", labelKey: "stylePresets.classic" },
  { id: "high-contrast", labelKey: "stylePresets.highContrast" },
  { id: "cupcake", labelKey: "stylePresets.cupcake" },
  { id: "dracula", labelKey: "stylePresets.dracula" },
  { id: "light", labelKey: "stylePresets.light" }
];

export function isStylePreset(value) {
  return stylePresets.some((preset) => preset.id === value);
}
