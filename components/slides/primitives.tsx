import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

// ─── Shared types ─────────────────────────────────────────────────────────────

interface SlideChildrenProps {
  children: ReactNode;
  className?: string;
}

// ─── Slide ────────────────────────────────────────────────────────────────────

interface SlideProps extends SlideChildrenProps {
  align?: "center" | "left";
}

export function Slide({ children, align = "center", className }: SlideProps) {
  return (
    <div
      className={cn(
        "relative flex h-dvh w-dvw flex-col gap-6 overflow-hidden px-12 py-16 sm:px-16 md:px-20 lg:px-24",
        align === "center"
          ? "items-center justify-center text-center"
          : "justify-center",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── SlideTitle ───────────────────────────────────────────────────────────────

export function SlideTitle({ children, className }: SlideChildrenProps) {
  return (
    <h1
      className={cn(
        "font-black text-4xl leading-none tracking-[-0.04em] sm:text-5xl md:text-6xl lg:text-7xl",
        className
      )}
    >
      {children}
    </h1>
  );
}

// ─── SlideSubtitle ────────────────────────────────────────────────────────────

export function SlideSubtitle({ children, className }: SlideChildrenProps) {
  return (
    <p
      className={cn(
        "text-lg text-muted-foreground leading-snug sm:text-xl md:text-2xl",
        className
      )}
    >
      {children}
    </p>
  );
}

// ─── SlideBadge ───────────────────────────────────────────────────────────────

export function SlideBadge({ children, className }: SlideChildrenProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full bg-foreground px-4 py-1.5 font-semibold text-background text-sm",
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── SlideHeaderBadge ─────────────────────────────────────────────────────────

export function SlideHeaderBadge({ children, className }: SlideChildrenProps) {
  return (
    <div className="flex items-center gap-3">
      <p
        className={cn(
          "font-semibold text-xl italic tracking-tight sm:text-2xl",
          className
        )}
      >
        {children}
      </p>
    </div>
  );
}

// ─── SlideNote ────────────────────────────────────────────────────────────────

export function SlideNote({ children, className }: SlideChildrenProps) {
  return (
    <p
      className={cn(
        "text-base text-muted-foreground leading-snug sm:text-lg",
        className
      )}
    >
      {children}
    </p>
  );
}

// ─── SlideList ────────────────────────────────────────────────────────────────

export function SlideList({ children, className }: SlideChildrenProps) {
  return <ul className={cn("flex flex-col gap-4", className)}>{children}</ul>;
}

// ─── SlideListItem ────────────────────────────────────────────────────────────

export function SlideListItem({ children, className }: SlideChildrenProps) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 font-medium text-lg sm:text-xl md:text-2xl",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground"
      />
      <span>{children}</span>
    </li>
  );
}

// ─── SlideCode ────────────────────────────────────────────────────────────────

const LANG_EXT_MAP: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".html": "xml",
  ".xml": "xml",
  ".svg": "xml",
};

function detectLang(title?: string): string {
  if (!title) {
    return "typescript";
  }
  const dot = title.lastIndexOf(".");
  if (dot === -1) {
    return "typescript";
  }
  return LANG_EXT_MAP[title.slice(dot)] ?? "typescript";
}

interface SlideCodeProps {
  children: string;
  className?: string;
  title?: string;
}

export function SlideCode({ children, title, className }: SlideCodeProps) {
  const lang = detectLang(title);
  const highlighted = hljs.highlight(children.trim(), { language: lang });

  return (
    <div
      className={cn(
        "slide-code-wrapper w-full min-w-0 max-w-[42rem]",
        className
      )}
    >
      {title && (
        <div
          className="slide-code-title rounded-t border border-b-0 px-4 py-1.5 font-mono text-muted-foreground text-xs"
          style={{
            background: "var(--slide-code-bg)",
            borderColor: "var(--slide-code-border)",
          }}
        >
          {title}
        </div>
      )}
      <pre
        className={cn(
          "overflow-x-auto rounded border p-4 font-mono",
          title && "rounded-t-none"
        )}
        style={{
          background: "var(--slide-code-bg)",
          borderColor: "var(--slide-code-border)",
          color: "var(--slide-code-text)",
          fontSize: "clamp(0.75rem, 1.5vw + 0.5rem, 0.875rem)",
        }}
      >
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: required for syntax highlighting */}
        <code dangerouslySetInnerHTML={{ __html: highlighted.value }} />
      </pre>
    </div>
  );
}

// ─── SlideColumns ─────────────────────────────────────────────────────────────

interface SlideColumnsProps {
  className?: string;
  left: ReactNode;
  right: ReactNode;
}

export function SlideColumns({ left, right, className }: SlideColumnsProps) {
  return (
    <div className={cn("grid w-full grid-cols-2 gap-8", className)}>
      <div className="flex min-w-0 flex-col gap-4">{left}</div>
      <div className="flex min-w-0 flex-col gap-4">{right}</div>
    </div>
  );
}

// ─── SlideSplitLayout ─────────────────────────────────────────────────────────

export function SlideSplitLayout({
  left,
  right,
  className,
}: SlideColumnsProps) {
  return (
    <div
      className={cn(
        "relative flex h-dvh w-dvw overflow-hidden border border-border",
        className
      )}
    >
      <div className="flex w-1/2 min-w-0 flex-col justify-center gap-6 overflow-x-auto px-12 py-16 sm:px-16 md:px-20 lg:px-24">
        {left}
      </div>
      <div aria-hidden="true" className="w-px shrink-0 bg-border" />
      <div className="flex w-1/2 min-w-0 flex-col justify-center gap-6 overflow-x-auto px-12 py-16 sm:px-16 md:px-20 lg:px-24">
        {right}
      </div>
    </div>
  );
}

// ─── SlideStatement ───────────────────────────────────────────────────────────

interface SlideStatementProps {
  className?: string;
  description?: string;
  title: string;
}

export function SlideStatement({
  title,
  description,
  className,
}: SlideStatementProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-border border-y py-4",
        className
      )}
    >
      <h3 className="font-semibold text-lg sm:text-xl">{title}</h3>
      {description && (
        <p className="text-base text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// ─── SlideStatementList ───────────────────────────────────────────────────────

export function SlideStatementList({
  children,
  className,
}: SlideChildrenProps) {
  return (
    <div className={cn("flex w-full flex-col", className)}>{children}</div>
  );
}

// ─── SlideSpeaker ─────────────────────────────────────────────────────────────

interface SlideSpeakerProps {
  avatar?: string;
  className?: string;
  name: string;
  title: string;
}

export function SlideSpeaker({
  name,
  title,
  avatar,
  className,
}: SlideSpeakerProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
        {avatar ? (
          <Image alt={name} className="object-cover" fill src={avatar} />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="font-medium text-sm uppercase tracking-widest">{name}</p>
        <p className="text-muted-foreground text-sm uppercase tracking-wider">
          {title}
        </p>
      </div>
    </div>
  );
}

// ─── SlideSpeakerGrid ─────────────────────────────────────────────────────────

export function SlideSpeakerGrid({ children, className }: SlideChildrenProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}

// ─── SlideSpeakerList ─────────────────────────────────────────────────────────

export function SlideSpeakerList({ children, className }: SlideChildrenProps) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
}
