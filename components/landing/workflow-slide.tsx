"use client";

import {
  ArrowBendDownRight,
  CodeBlock,
  PresentationChart,
} from "@phosphor-icons/react";

import { ThemeToggle } from "@/components/theme-toggle";
import { SlideBar } from "./slide-bar";

const MDX_SNIPPET = [
  { id: "title", line: "# Product Design Review" },
  { id: "blank-1", line: "" },
  { id: "goals", line: "## Goals" },
  { id: "goal-1", line: "- Keep slide writing in markdown" },
  { id: "goal-2", line: "- Embed React where interaction matters" },
  { id: "blank-2", line: "" },
  { id: "theme-toggle", line: "<ThemeToggle />" },
] as const;

export function WorkflowSlide() {
  return (
    <section className="landing-section sticky top-0 z-4 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="04 / 07" right="WORKFLOW" />

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-8 md:grid-cols-[0.9fr_1.1fr] md:px-8">
        <div className="flex flex-col justify-center">
          <h2 className="mt-4 font-bold text-[clamp(2rem,4.7vw,4.2rem)] leading-[1.05] tracking-tight">
            One source.
            <br />
            <span className="opacity-35">Two outputs.</span>
          </h2>

          <div className="mt-7 space-y-3">
            <div className="flex items-start gap-3">
              <CodeBlock
                className="mt-0.5 shrink-0 text-foreground/75"
                size={16}
              />
              <p className="text-sm leading-relaxed">
                Author your deck as plain markdown and add components like{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  {"<ThemeToggle />"}
                </code>
                .
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ArrowBendDownRight
                className="mt-0.5 shrink-0 text-foreground/75"
                size={16}
              />
              <p className="text-sm leading-relaxed">
                The parser turns markdown into slide content and mounts your
                component in the exact place you define.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <PresentationChart
                className="mt-0.5 shrink-0 text-foreground/75"
                size={16}
              />
              <p className="text-sm leading-relaxed">
                Present in full screen with both narrative text and interactive
                controls rendered together.
              </p>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-2 gap-4">
          <div className="flex min-h-0 flex-col border border-border bg-card">
            <div className="flex items-center justify-between border-border border-b px-3 py-2">
              <p className="font-mono text-[10px] text-muted-foreground tracking-[0.12em]">
                deck.mdx
              </p>
              <span className="font-mono text-[10px] text-muted-foreground/70">
                editor
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-background p-4 font-mono text-[11px] leading-6">
              {MDX_SNIPPET.map((snippet) => (
                <p
                  className={
                    snippet.line.startsWith("<")
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-foreground/85"
                  }
                  key={snippet.id}
                >
                  {snippet.line || "\u00A0"}
                </p>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 flex-col border border-border bg-card">
            <div className="flex items-center justify-between border-border border-b px-3 py-2">
              <p className="font-mono text-[10px] text-muted-foreground tracking-[0.12em]">
                live presentation
              </p>
              <span className="font-mono text-[10px] text-muted-foreground/70">
                full screen preview
              </span>
            </div>

            <div className="min-h-0 flex-1 bg-background p-3">
              <div className="relative flex h-full w-full flex-col border border-border bg-card p-6">
                <div className="absolute top-3 right-3">
                  <ThemeToggle />
                </div>

                <p className="max-w-[85%] font-semibold text-[clamp(1rem,1.8vw,1.45rem)] leading-tight">
                  Product Design Review
                </p>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                  Goals
                </p>

                <ul className="mt-4 list-disc space-y-1 pl-5 text-muted-foreground text-sm">
                  <li>Keep slide writing in markdown</li>
                  <li>Embed React where interaction matters</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
