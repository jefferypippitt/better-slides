const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

/** Quick-pick swatches shown next to the custom color picker. */
export const TEXT_COLOR_PRESETS: readonly { label: string; value: string }[] = [
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
];

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_RE.test(value);
}
