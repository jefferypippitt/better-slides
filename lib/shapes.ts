export type ShapeType = "rect" | "circle" | "triangle" | "diamond";

export const SHAPE_TYPES: readonly ShapeType[] = [
  "rect",
  "circle",
  "triangle",
  "diamond",
];

/** Clip paths for shapes that aren't drawn with border-radius. */
export const SHAPE_CLIP_PATHS: Partial<Record<ShapeType, string>> = {
  triangle: "polygon(50% 0%, 100% 100%, 0% 100%)",
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
};
