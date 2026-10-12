export type CornerRadius = "none" | "sm" | "md" | "lg";

export const DEFAULT_CORNER_RADIUS: CornerRadius = "none";

export const CORNER_RADIUS_OPTIONS: readonly {
  label: string;
  value: CornerRadius;
}[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "SM" },
  { value: "md", label: "MD" },
  { value: "lg", label: "LG" },
];

/**
 * Full class names so Tailwind can detect them. These use container-width
 * units instead of `rounded-sm`/`-md`/`-lg` because the theme sets
 * `--radius: 0rem`, which collapses those to square corners. `cqw` also keeps
 * the editor canvas and the presented slide looking the same at any size.
 */
export const CORNER_RADIUS_CLASSES: Record<CornerRadius, string> = {
  none: "rounded-none",
  sm: "rounded-[0.75cqw]",
  md: "rounded-[1.5cqw]",
  lg: "rounded-[3cqw]",
};

export function isCornerRadius(value: unknown): value is CornerRadius {
  return CORNER_RADIUS_OPTIONS.some((option) => option.value === value);
}
