"use client";

import {
  ArrowRightIcon,
  CaretDown,
  DeviceMobileCamera,
  WifiHigh,
} from "@phosphor-icons/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import SlideBar from "./slide-bar";

const QR_DOTS = [
  "111111100110101111111",
  "100000100101010100000",
  "101110100110110101110",
  "101110100001001101110",
  "101110100111010101110",
  "100000100010101100000",
  "111111101010101111111",
  "000000000101010000000",
  "100011101010110111001",
  "001100010101001000101",
  "110011101011100111010",
  "001010010100011010101",
  "101101101011101101001",
  "000000001101010010110",
  "111111101010111011000",
  "100000100101000100101",
  "101110101011101011010",
  "101110100100010100101",
  "101110101011100011010",
  "100000100100011100101",
  "111111101011101011010",
];
const HERO_DOT_IDS = ["dot-1", "dot-2", "dot-3", "dot-4", "dot-5", "dot-6"];
const QR_SIZE = QR_DOTS[0]?.length ?? 0;
const QR_CELLS = QR_DOTS.join("")
  .split("")
  .map((dot, cellIndex) => ({
    dot,
    id: `qr-${Math.floor(cellIndex / QR_SIZE)}-${cellIndex % QR_SIZE}`,
  }));

export default function HeroSlide() {
  return (
    <section className="landing-section sticky top-0 z-1 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="01 / 07" right="WELCOME" />

      <div className="relative flex flex-1 flex-col lg:flex-row">
        {/* Unified container — both sides share the same padding axis */}
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col lg:flex-row">
          {/* Left: content */}
          <div className="flex flex-1 items-center justify-center border-border border-b p-6 sm:p-8 lg:justify-end lg:border-b-0 lg:p-12 lg:pr-8">
            <div className="flex flex-col items-start gap-4">
              <h1 className="font-bold text-[clamp(2.25rem,4.8vw,4.25rem)] leading-none tracking-tight">
                Better Slides
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Create beautiful presentations from Markdown, then upload
                optional TypeScript files to add interactive components to any
                slide.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up">
                  <Button className="gap-2" size="lg">
                    Get started <ArrowRightIcon size={15} />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right: canvas - larger on lg */}
          <div className="relative hidden flex-1 items-center justify-start p-6 sm:p-8 lg:flex lg:p-12 lg:pl-8">
            <div className="relative h-[520px] w-full max-w-[580px] overflow-hidden border border-border bg-card p-4">
              <div className="relative mt-3 grid h-[440px] grid-cols-[1.2fr_0.75fr_1fr]">
                <div className="relative flex flex-col overflow-hidden border border-border bg-background p-3">
                  <div className="flex items-center justify-between bg-card px-2.5 py-1.5">
                    <span className="font-bold font-mono text-[14px] text-foreground">
                      Acme Corp Board Update
                    </span>
                  </div>

                  <div className="flex-1 bg-card p-3.5">
                    <p className="font-semibold text-[13px]">
                      Q3 Results Snapshot
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Executive summary for the quarterly board presentation.
                    </p>
                    <ul className="mt-3 space-y-1.5 pl-4 text-[11px] text-muted-foreground">
                      <li>
                        Revenue reached $24.8M, up 18% quarter over quarter
                      </li>
                      <li>Gross margin improved from 61% to 64%</li>
                      <li>Enterprise retention held at 96%</li>
                      <li>Next quarter focus: launch EU expansion playbook</li>
                    </ul>
                  </div>

                  <div className="border border-border bg-card px-2.5 py-2">
                    <div className="flex items-center justify-center gap-1.5">
                      {HERO_DOT_IDS.map((dotId, index) => (
                        <span
                          className={`rounded-full transition-all ${
                            index === 3
                              ? "h-1.5 w-1.5 bg-foreground"
                              : "h-1.5 w-1.5 bg-border"
                          }`}
                          key={dotId}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative flex flex-col items-center justify-center p-2">
                  <div className="aspect-square w-full max-w-[180px] border border-border bg-card p-2.5">
                    <div
                      className="grid h-full w-full gap-px bg-muted p-[2px]"
                      style={{
                        gridTemplateColumns: `repeat(${QR_SIZE}, minmax(0, 1fr))`,
                      }}
                    >
                      {QR_CELLS.map((cell) => (
                        <span
                          className={
                            cell.dot === "1"
                              ? "aspect-square bg-foreground"
                              : "aspect-square bg-transparent"
                          }
                          key={cell.id}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="mt-2.5 text-center font-mono text-[9px] text-muted-foreground leading-relaxed">
                    scan on phone
                    <br />
                    auto sync notes
                  </p>
                </div>

                <div className="relative border border-border bg-background p-2">
                  <div className="mx-auto flex h-full max-w-[180px] flex-col border border-border bg-card p-2.5">
                    <div className="mx-auto h-1 w-14 rounded-full bg-border" />
                    <div className="mt-3 flex items-center justify-between border border-border px-2.5 py-1.5">
                      <span className="font-mono text-[9px] text-muted-foreground tracking-[0.1em]">
                        presenter phone
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] text-emerald-500">
                        <WifiHigh size={10} />
                        synced
                      </span>
                    </div>

                    <div className="mt-3 flex-1 border border-border bg-background px-2.5 py-2">
                      <p className="font-mono text-[9px] text-muted-foreground tracking-[0.1em]">
                        speaker notes
                      </p>
                      <p className="mt-1.5 text-[10px] text-muted-foreground/75 leading-relaxed">
                        <span className="font-semibold text-foreground">
                          [Opening / Transition:]
                        </span>{" "}
                        "Good morning, everyone. Let's start with a quick
                        snapshot of our Q3 performance."
                      </p>
                      <p className="mt-1.5 text-[10px] text-muted-foreground/75 leading-relaxed">
                        <span className="font-semibold text-foreground">
                          [Closing / Hand-off:]
                        </span>{" "}
                        "In summary, Q3 delivered strong top-line momentum and
                        meaningful margin expansion We're entering Q4 with
                        confidence and clear priorities.
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2">
                      <button
                        className="inline-flex items-center justify-center border border-border bg-background px-2 py-1.5 font-mono text-[9px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                        type="button"
                      >
                        Previous
                      </button>
                      <button
                        className="inline-flex items-center justify-center border border-transparent bg-primary px-2 py-1.5 font-mono text-[9px] text-primary-foreground transition-colors hover:bg-primary/90"
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  <DeviceMobileCamera
                    className="absolute top-6 -left-2.5 text-foreground/70"
                    size={14}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* end unified container */}

        {/* Mobile canvas */}
        <div className="relative mx-auto w-full max-w-[480px] px-6 pb-8 sm:max-w-[660px] sm:px-8 sm:pb-10 lg:hidden">
          <div className="relative h-[260px] overflow-hidden border border-border bg-card p-3.5 sm:h-[340px]">
            <div className="relative grid h-[210px] grid-cols-[1.2fr_0.75fr_1fr] sm:h-[290px]">
              <div className="relative flex flex-col overflow-hidden border border-border bg-background p-2">
                <div className="flex items-center justify-between bg-card px-1.5 py-1">
                  <span className="font-bold font-mono text-[9px] text-foreground">
                    Acme Corp Board Update
                  </span>
                </div>

                <div className="flex-1 bg-card p-1.5">
                  <p className="font-semibold text-[9px]">
                    Q3 Results Snapshot
                  </p>
                  <ul className="mt-1 space-y-0.5 pl-3 text-[7px] text-muted-foreground">
                    <li>Revenue reached $24.8M, up 18% QoQ</li>
                    <li>Gross margin improved from 61% to 64%</li>
                    <li>Enterprise retention held at 96%</li>
                  </ul>
                </div>

                <div className="border border-border bg-card px-1.5 py-1">
                  <div className="flex items-center justify-center gap-1">
                    {HERO_DOT_IDS.map((dotId, index) => (
                      <span
                        className={`rounded-full ${
                          index === 3
                            ? "h-1 w-1 bg-foreground"
                            : "h-1 w-1 bg-border"
                        }`}
                        key={dotId}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col items-center justify-center p-1">
                <div className="pointer-events-none absolute top-1/2 -left-2 w-2 border-border border-t border-dotted" />
                <div className="pointer-events-none absolute top-1/2 -right-2 w-2 border-border border-t border-dotted" />
                <div className="aspect-square w-full max-w-[90px] border border-border bg-card p-1">
                  <div
                    className="grid h-full w-full gap-px bg-muted"
                    style={{
                      gridTemplateColumns: `repeat(${QR_SIZE}, minmax(0, 1fr))`,
                    }}
                  >
                    {QR_CELLS.map((cell) => (
                      <span
                        className={
                          cell.dot === "1"
                            ? "aspect-square bg-foreground"
                            : "aspect-square bg-transparent"
                        }
                        key={cell.id}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-center font-mono text-[6px] text-muted-foreground">
                  scan on phone
                </p>
              </div>

              <div className="relative border border-border bg-background p-1">
                <div className="mx-auto flex h-full max-w-[90px] flex-col border border-border bg-card p-1">
                  <div className="mx-auto h-0.5 w-8 rounded-full bg-border" />
                  <div className="mt-1 flex items-center justify-between border border-border px-1 py-0.5">
                    <span className="font-mono text-[6px] text-muted-foreground tracking-[0.1em]">
                      presenter
                    </span>
                    <span className="inline-flex items-center gap-0.5 font-mono text-[6px] text-emerald-500">
                      <WifiHigh size={7} />
                      synced
                    </span>
                  </div>
                  <div className="mt-1 flex-1 border border-border bg-background px-1 py-0.5">
                    <p className="font-mono text-[6px] text-muted-foreground tracking-[0.1em]">
                      speaker notes
                    </p>
                    <p className="mt-0.5 text-[6px] text-muted-foreground/75 leading-tight">
                      <span className="font-semibold text-foreground">
                        [Opening]:
                      </span>{" "}
                      "Good morning..."
                    </p>
                  </div>
                  <div className="mt-1 grid grid-cols-2">
                    <button
                      className="border border-border bg-background px-1 py-0.5 font-mono text-[6px] text-muted-foreground"
                      type="button"
                    >
                      prev
                    </button>
                    <button
                      className="border border-transparent bg-primary px-1 py-0.5 font-mono text-[6px] text-primary-foreground"
                      type="button"
                    >
                      next
                    </button>
                  </div>
                </div>
                <DeviceMobileCamera
                  className="absolute top-3 -left-1.5 text-foreground/70"
                  size={8}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SlideBar
        left=""
        position="bottom"
        right={
          <span className="inline-flex items-center gap-1.5">
            SCROLL TO EXPLORE
            <CaretDown
              className="animation-duration-[1.6s] motion-safe:animate-bounce"
              size={12}
            />
          </span>
        }
      />
    </section>
  );
}
