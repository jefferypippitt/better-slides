"use client";

import { TEXT_COLOR_PRESETS } from "@/lib/text-color";

/** Starting value for the native picker when the box uses the theme color. */
const PICKER_FALLBACK_COLOR = "#000000";

interface TextColorControlProps {
  /** Records a single undo step once a live picker drag is finished. */
  onCommit: () => void;
  /** `live` is true while dragging in the native picker (no undo step yet). */
  onSelect: (color: string | undefined, options: { live: boolean }) => void;
  value: string | undefined;
}

export function TextColorControl({
  onCommit,
  onSelect,
  value,
}: TextColorControlProps) {
  const isDefault = value === undefined;
  const isPreset = TEXT_COLOR_PRESETS.some((preset) => preset.value === value);
  const isCustom = !(isDefault || isPreset);

  return (
    <>
      <span className="font-medium">Text color</span>
      <div className="flex items-center gap-1">
        <button
          aria-pressed={isDefault}
          className={`rounded px-1.5 py-0.5 ${
            isDefault ? "bg-muted text-foreground" : "hover:bg-muted/80"
          }`}
          onClick={() => onSelect(undefined, { live: false })}
          type="button"
        >
          Default
        </button>
        {TEXT_COLOR_PRESETS.map((preset) => {
          const isActive = preset.value === value;
          return (
            <button
              aria-label={preset.label}
              aria-pressed={isActive}
              className={`size-3.5 rounded-full ring-offset-1 ring-offset-background transition hover:scale-110 ${
                isActive ? "ring-2 ring-foreground" : ""
              }`}
              key={preset.value}
              onClick={() => onSelect(preset.value, { live: false })}
              style={{ backgroundColor: preset.value }}
              title={preset.label}
              type="button"
            />
          );
        })}
        <label
          className={`relative ml-0.5 flex size-4 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-offset-1 ring-offset-background ${
            isCustom ? "ring-2 ring-foreground" : "ring-1 ring-border"
          }`}
          title="Custom color"
        >
          <span
            aria-hidden
            className="size-full"
            style={{
              background: isCustom
                ? value
                : "conic-gradient(#ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)",
            }}
          />
          <input
            aria-label="Custom text color"
            className="absolute inset-0 cursor-pointer opacity-0"
            onBlur={onCommit}
            onChange={(e) => onSelect(e.target.value, { live: true })}
            type="color"
            value={value ?? PICKER_FALLBACK_COLOR}
          />
        </label>
      </div>
    </>
  );
}
