import Link from "next/link";
import type { ReactNode } from "react";

import {
  Slide,
  SlideBadge,
  SlideCode,
  SlideColumns,
  SlideHeaderBadge,
  SlideList,
  SlideListItem,
  SlideNote,
  SlideSpeaker,
  SlideSpeakerGrid,
  SlideSpeakerList,
  SlideSplitLayout,
  SlideStatement,
  SlideStatementList,
  SlideSubtitle,
  SlideTitle,
} from "@/components/slides/primitives";

// ── Layout components ──────────────────────────────────────────────────────────

interface CardsProps {
  children: ReactNode;
}

interface CardProps {
  children: ReactNode;
  href: string;
  title: string;
}

function Cards({ children }: CardsProps) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function Card({ href, title, children }: CardProps) {
  return (
    <Link
      className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <p className="font-semibold text-card-foreground text-sm">{title}</p>
      <div className="mt-1 text-muted-foreground text-sm leading-relaxed [&_p]:m-0">
        {children}
      </div>
    </Link>
  );
}

// ── HTML element overrides ─────────────────────────────────────────────────────

function H3({ children }: { children?: ReactNode }) {
  return (
    <h3 className="mt-5 mb-2 font-semibold text-foreground text-xl tracking-tight first:mt-0">
      {children}
    </h3>
  );
}

function H4({ children }: { children?: ReactNode }) {
  return (
    <h4 className="mt-4 mb-1.5 font-semibold text-base text-foreground tracking-tight first:mt-0">
      {children}
    </h4>
  );
}

function P({ children }: { children?: ReactNode }) {
  return (
    <p className="my-2 text-foreground/90 leading-relaxed first:mt-0">
      {children}
    </p>
  );
}

function Ul({ children }: { children?: ReactNode }) {
  return (
    <ul className="my-2 list-disc space-y-1 pl-5 text-foreground/90">
      {children}
    </ul>
  );
}

function Ol({ children }: { children?: ReactNode }) {
  return (
    <ol className="my-2 list-decimal space-y-1 pl-5 text-foreground/90">
      {children}
    </ol>
  );
}

function Li({ children }: { children?: ReactNode }) {
  return <li className="leading-relaxed">{children}</li>;
}

function Blockquote({ children }: { children?: ReactNode }) {
  return (
    <blockquote className="my-3 border-primary/40 border-l-4 pl-4 text-muted-foreground italic">
      {children}
    </blockquote>
  );
}

function InlineCode({ children }: { children?: ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
      {children}
    </code>
  );
}

function Strong({ children }: { children?: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

function Em({ children }: { children?: ReactNode }) {
  return <em className="text-foreground/80 italic">{children}</em>;
}

function Anchor({ href, children }: { href?: string; children?: ReactNode }) {
  return (
    <a
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export const mdxBaseComponents = {
  // Layout
  Card,
  Cards,

  // Slide primitives
  Slide,
  SlideBadge,
  SlideCode,
  SlideColumns,
  SlideHeaderBadge,
  SlideList,
  SlideListItem,
  SlideNote,
  SlideSpeaker,
  SlideSpeakerGrid,
  SlideSpeakerList,
  SlideSplitLayout,
  SlideStatement,
  SlideStatementList,
  SlideSubtitle,
  SlideTitle,

  // HTML element overrides
  h3: H3,
  h4: H4,
  p: P,
  ul: Ul,
  ol: Ol,
  li: Li,
  blockquote: Blockquote,
  code: InlineCode,
  strong: Strong,
  em: Em,
  a: Anchor,
};

// Backward-compatible export for places that still expect `mdxComponents`.
export const mdxComponents = mdxBaseComponents;
