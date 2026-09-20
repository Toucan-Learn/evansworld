export const SKY_PRESETS = [
  { id: "earth", label: "Earth sky" },
  { id: "pixel", label: "Pixel sky" },
  { id: "rocket", label: "Rocket flight" },
  { id: "sand", label: "Sand" },
  { id: "water", label: "Water" },
  { id: "drawing", label: "Evan’s drawing" },
] as const;

export type SkyPreset = (typeof SKY_PRESETS)[number]["id"];
export const SKY_PRESET_KEY = "evan-universe-sky-preset";

export function isSkyPreset(value: unknown): value is SkyPreset {
  return SKY_PRESETS.some((preset) => preset.id === value);
}

export function savedSkyPreset(): SkyPreset {
  try {
    const value = localStorage.getItem(SKY_PRESET_KEY);
    if (isSkyPreset(value)) return value;
  } catch {}
  return "drawing";
}
