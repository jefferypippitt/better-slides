"use client";

import { useEffect, useRef, useState } from "react";

type LineKind = "h1" | "h2" | "divider" | "text";

interface EditorLine {
  readonly id: string;
  readonly kind: LineKind;
  readonly text: string;
}

const EDITOR_LINES: EditorLine[] = [
  { id: "h1", text: "# My Presentation", kind: "h1" },
  { id: "sub", text: "Welcome to the future of slides.", kind: "text" },
  { id: "h2a", text: "## Key Features", kind: "h2" },
  { id: "feat1", text: "- Markdown first", kind: "text" },
  { id: "feat2", text: "- Instant slide structure", kind: "text" },
  { id: "h2b", text: "## Get Started", kind: "h2" },
  { id: "cta", text: "Sign up free today ->", kind: "text" },
];

const FULL_MDX = EDITOR_LINES.map((line) => line.text).join("\n");
const CHAR_SPEED_MS = 28;
const PAUSE_MS = 3000;
const ROW_HEIGHT_PX = 24;
const ROW_FONT_SIZE_PX = 11;
const EDITOR_VERTICAL_PADDING_PX = 20;
const ROW_STYLE = {
  height: ROW_HEIGHT_PX,
  lineHeight: `${ROW_HEIGHT_PX}px`,
  fontSize: ROW_FONT_SIZE_PX,
} as const;
const COLUMN_VERTICAL_PADDING_STYLE = {
  paddingTop: EDITOR_VERTICAL_PADDING_PX,
  paddingBottom: EDITOR_VERTICAL_PADDING_PX,
} as const;

function lineOpacityClass(kind: LineKind): string {
  if (kind === "h1" || kind === "h2") {
    return "text-[#0000ff] dark:text-[#569cd6]";
  }
  if (kind === "divider") {
    return "text-[#267f99] dark:text-[#4ec9b0]";
  }
  return "text-[#001080] dark:text-[#d4d4d4]";
}

function getTypedLines(charCount: number): string[] {
  let remainingChars = charCount;
  const typedLines: string[] = [];

  for (let index = 0; index < EDITOR_LINES.length; index += 1) {
    const fullLine = EDITOR_LINES[index]?.text ?? "";
    const visibleCount = Math.max(0, Math.min(fullLine.length, remainingChars));
    typedLines.push(fullLine.slice(0, visibleCount));

    remainingChars -= fullLine.length;
    if (remainingChars > 0 && index < EDITOR_LINES.length - 1) {
      remainingChars -= 1;
    }
  }

  return typedLines;
}

function getCursorLineIndex(charCount: number): number {
  let remainingChars = charCount;

  for (let index = 0; index < EDITOR_LINES.length; index += 1) {
    const fullLine = EDITOR_LINES[index]?.text ?? "";

    if (remainingChars <= fullLine.length) {
      return index;
    }

    remainingChars -= fullLine.length;
    if (index < EDITOR_LINES.length - 1) {
      remainingChars -= 1;
    }
  }

  return EDITOR_LINES.length - 1;
}

export default function PresentationCanvas() {
  const [charCount, setCharCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const charRef = useRef(0);

  useEffect(() => {
    if (isPaused) {
      const timeoutId = setTimeout(() => {
        charRef.current = 0;
        setCharCount(0);
        setIsPaused(false);
      }, PAUSE_MS);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    const intervalId = setInterval(() => {
      const next = charRef.current + 1;

      if (next > FULL_MDX.length) {
        setIsPaused(true);
        return;
      }

      charRef.current = next;
      setCharCount(next);
    }, CHAR_SPEED_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isPaused]);

  const typedLines = getTypedLines(charCount);
  const cursorLineIndex = getCursorLineIndex(charCount);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <p className="text-center font-mono font-semibold text-[12px] text-muted-foreground tracking-[0.12em]">
        presentations.mdx
      </p>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-border bg-card">
        <div className="flex h-full min-h-0">
          <div
            className="flex select-none flex-col border-[#e0e0e0] border-r bg-[#ffffff] px-2.5 text-right font-mono text-[#237893] dark:border-[#3c3c3c] dark:bg-[#1e1e1e] dark:text-[#858585]"
            style={COLUMN_VERTICAL_PADDING_STYLE}
          >
            {EDITOR_LINES.map((line, index) => (
              <span className="" key={`line-num-${line.id}`} style={ROW_STYLE}>
                {index + 1}
              </span>
            ))}
          </div>

          <div
            className="flex-1 overflow-hidden bg-[#ffffff] px-5 font-mono dark:bg-[#1e1e1e]"
            style={COLUMN_VERTICAL_PADDING_STYLE}
          >
            {EDITOR_LINES.map((line, index) => {
              const content = typedLines[index] ?? "";
              const isCurrentLine = !isPaused && index === cursorLineIndex;
              return (
                <p
                  className={`overflow-hidden whitespace-pre ${lineOpacityClass(line.kind)}`}
                  key={line.id}
                  style={ROW_STYLE}
                >
                  {content || "\u00A0"}
                  {isCurrentLine && <span className="editor-cursor" />}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
