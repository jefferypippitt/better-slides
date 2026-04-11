"use client";

import {
  ArrowBendDownRight,
  CodeBlock,
  PresentationChart,
} from "@phosphor-icons/react";

import { ThemeToggle } from "@/components/theme-toggle";
import SlideBar from "./slide-bar";

const MDX_SNIPPET = [
  { id: "title", line: "# Product Design Review" },
  { id: "blank-1", line: "" },
  { id: "goals", line: "## Goals" },
  { id: "goal-1", line: "- Keep slide writing in markdown" },
  { id: "goal-2", line: "- Embed React where interaction matters" },
  { id: "blank-2", line: "" },
  { id: "theme-toggle", line: "<ThemeToggle />" },
] as const;

function getSnippetLineClassName(line: string): string {
  if (line.startsWith("#")) {
    return "text-[#0000ff] dark:text-[#569cd6]";
  }
  if (line.startsWith("-")) {
    return "text-[#001080] dark:text-[#d4d4d4]";
  }
  if (line.startsWith("<")) {
    return "text-[#267f99] dark:text-[#4ec9b0]";
  }
  if (line === "") {
    return "text-transparent";
  }
  return "text-[#001080] dark:text-[#d4d4d4]";
}

export default function WorkflowSlide() {
  return (
    <section className="landing-section sticky top-0 z-4 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="04 / 07" right="WORKFLOW" />

      <div className="relative flex flex-1 flex-col lg:flex-row">
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col lg:flex-row">
          {/* Left: content */}
          <div className="flex flex-1 items-center justify-center border-border border-b p-6 sm:p-8 lg:justify-end lg:border-b-0 lg:p-12 lg:pr-8">
            <div className="flex flex-col items-start gap-7">
              <h2 className="font-semibold text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.08] tracking-[-0.025em]">
                Write once.
                <br />
                <span className="opacity-35">Present everywhere.</span>
              </h2>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CodeBlock
                    className="mt-0.5 shrink-0 text-foreground/75"
                    size={16}
                  />
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Write in Markdown and embed React components wherever you
                    need them.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowBendDownRight
                    className="mt-0.5 shrink-0 text-foreground/75"
                    size={16}
                  />
                  <p className="text-base text-muted-foreground leading-relaxed">
                    We take it from there and turn your content into slides
                    right away.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <PresentationChart
                    className="mt-0.5 shrink-0 text-foreground/75"
                    size={16}
                  />
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Go fullscreen when you're ready. Notes and controls stay
                    with you.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: simple step list */}
          <div className="flex flex-col gap-3 border-border border-t p-6 sm:hidden">
            {[
              "Write in Markdown and embed React components wherever you need them.",
              "We take it from there and turn your content into slides right away.",
              "Go fullscreen when you're ready. Notes and controls stay right there.",
            ].map((step, i) => (
              <div className="flex items-start gap-3" key={step}>
                <span className="mt-0.5 shrink-0 font-mono text-[11px] text-muted-foreground/50">
                  0{i + 1}
                </span>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Right: canvases - vertically stacked */}
          <div className="hidden w-full grid-rows-2 gap-4 sm:grid sm:h-72 sm:p-6 md:h-80 md:p-8 lg:h-auto lg:flex-1 lg:gap-6 lg:p-12 lg:pl-8">
            {/* Editor canvas */}
            <div className="flex min-h-0 flex-col border border-border bg-card">
              <div className="flex items-center justify-between border-border border-b px-4 py-2.5">
                <p className="font-mono text-[11px] text-muted-foreground tracking-[0.12em]">
                  product-review.mdx
                </p>
                <span className="font-mono text-[11px] text-muted-foreground/70">
                  editor
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden bg-[#ffffff] p-0 font-mono text-[13px] leading-7 dark:bg-[#1e1e1e]">
                <div className="flex h-full">
                  {/* Line numbers */}
                  <div className="flex select-none flex-col border-[#e0e0e0] border-r bg-[#ffffff] px-3 py-6 text-right text-[#237893] dark:border-[#3c3c3c] dark:bg-[#1e1e1e] dark:text-[#858585]">
                    {MDX_SNIPPET.map((snippet, index) => (
                      <span className="text-[12px]" key={`line-${snippet.id}`}>
                        {index + 1}
                      </span>
                    ))}
                  </div>
                  {/* Code content */}
                  <div className="flex-1 overflow-auto bg-[#ffffff] p-6 dark:bg-[#1e1e1e]">
                    {MDX_SNIPPET.map((snippet) => (
                      <p
                        className={getSnippetLineClassName(snippet.line)}
                        key={snippet.id}
                      >
                        {snippet.line || "\u00A0"}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview canvas */}
            <div className="flex min-h-0 flex-col border border-border bg-card">
              <div className="flex items-center justify-between border-border border-b px-4 py-2.5">
                <p className="font-mono text-[11px] text-muted-foreground tracking-[0.12em]">
                  live presentation
                </p>
                <span className="font-mono text-[11px] text-muted-foreground/70">
                  full screen preview
                </span>
              </div>

              <div className="min-h-0 flex-1 bg-background p-5">
                <div className="relative flex h-full w-full flex-col border border-border bg-card p-8">
                  <div className="absolute top-3 right-3">
                    <ThemeToggle />
                  </div>

                  <p className="max-w-[85%] font-semibold text-[clamp(1rem,1.8vw,1.75rem)] leading-tight">
                    Product Design Review
                  </p>
                  <p className="mt-4 text-[15px] text-muted-foreground leading-relaxed">
                    Goals
                  </p>

                  <ul className="mt-5 list-disc space-y-1.5 pl-5 text-[15px] text-muted-foreground">
                    <li>Keep slide writing in markdown</li>
                    <li>Embed React where interaction matters</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* end unified container */}
      </div>

      <SlideBar left="" position="bottom" right="" />
    </section>
  );
}
