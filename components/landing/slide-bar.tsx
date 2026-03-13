import type { ReactNode } from "react";

interface SlideBarProps {
  center?: boolean;
  left: string;
  position?: "top" | "bottom";
  right: ReactNode;
}

export function SlideBar({
  left,
  center = false,
  right,
  position = "top",
}: SlideBarProps) {
  return (
    <div
      className={`flex h-12 shrink-0 items-center border-border px-8 ${
        center ? "justify-center" : "justify-between"
      } ${position === "top" ? "border-b" : "border-t"}`}
    >
      {center ? (
        <span className="font-mono text-[11px] text-muted-foreground tracking-[0.12em]">
          {right}
        </span>
      ) : (
        <>
          <span className="font-mono text-[11px] text-muted-foreground tracking-[0.12em]">
            {left}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground tracking-[0.12em]">
            {right}
          </span>
        </>
      )}
    </div>
  );
}
