import type { ReactNode } from "react";

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
        <span className="font-medium font-mono text-[11px] text-foreground tracking-[0.15em]">
          {right}
        </span>
      ) : (
        <>
          <span className="font-medium font-mono text-[11px] text-foreground tracking-[0.15em]">
            {left}
          </span>
          <span className="font-medium font-mono text-[11px] text-foreground tracking-[0.15em]">
            {right}
          </span>
        </>
      )}
    </div>
  );
}
