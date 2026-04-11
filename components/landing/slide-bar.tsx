import type { ReactNode } from "react";

/** Shared by slide index and section title so both read as one system (tracking matches editor chrome). */
const slideBarLabelClassName =
  "font-mono text-[11px] text-foreground uppercase tracking-[0.12em]";

interface SlideBarProps {
  center?: boolean;
  left: string;
  position?: "top" | "bottom";
  right: ReactNode;
}

export default function SlideBar({
  left,
  center = false,
  right,
  position = "top",
}: SlideBarProps) {
  return (
    <div
      className={`flex h-12 shrink-0 items-center border-border px-4 sm:px-8 ${
        center ? "justify-center" : "justify-between"
      } ${position === "top" ? "border-b" : "border-t"}`}
    >
      {center ? (
        <span className={slideBarLabelClassName}>{right}</span>
      ) : (
        <>
          <span className={slideBarLabelClassName}>{left}</span>
          <span className={slideBarLabelClassName}>{right}</span>
        </>
      )}
    </div>
  );
}
