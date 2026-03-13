"use client";

import {
  ArrowRightIcon,
  CaretDown,
  DeviceMobileCamera,
  WifiHigh,
} from "@phosphor-icons/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SlideBar } from "./slide-bar";

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

export function HeroSlide() {
  return (
    <section className="landing-section sticky top-0 z-1 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="01 / 07" right="WELCOME" />

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-6 py-10 md:grid-cols-2 md:px-8">
        <div className="max-w-xl">
          <h1 className="font-bold text-[clamp(2.25rem,6vw,5.25rem)] leading-none tracking-tight">
            Better
            <br />
            <span className="opacity-35">Slides</span>
          </h1>

          <p className="mt-5 max-w-md font-light text-muted-foreground text-sm leading-relaxed">
            Create beautiful presentations from Markdown, then upload optional
            `.tsx` React widgets for interactive slides.
          </p>

          <div className="mt-8 flex gap-3">
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

        <div className="relative mx-auto w-full max-w-[660px]">
          <div className="relative h-[390px] overflow-hidden border border-border bg-card p-4">
            <div className="relative mt-3 grid h-[330px] grid-cols-[1.2fr_0.75fr_1fr] gap-3">
              <div className="relative overflow-hidden border border-border bg-background p-3">
                <div className="flex items-center justify-between border border-border bg-card px-2 py-1">
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                    Acme Corp Board Update
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground/70">
                    slide 4
                  </span>
                </div>

                <div className="mt-3 border border-border bg-card p-2.5">
                  <p className="font-semibold text-[11px]">
                    Q3 Results Snapshot
                  </p>
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    Executive summary for the quarterly board presentation.
                  </p>
                  <ul className="mt-2 space-y-1 pl-4 text-[10px] text-muted-foreground">
                    <li>Revenue reached $24.8M, up 18% quarter over quarter</li>
                    <li>Gross margin improved from 61% to 64%</li>
                    <li>Enterprise retention held at 96%</li>
                    <li>Next quarter focus: launch EU expansion playbook</li>
                  </ul>
                </div>

                <div className="mt-2 border border-border bg-card px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    {HERO_DOT_IDS.map((dotId, index) => (
                      <span
                        className={`rounded-full transition-all ${
                          index === 3
                            ? "h-1.5 w-4 bg-foreground"
                            : "h-1.5 w-1.5 bg-border"
                        }`}
                        key={dotId}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col items-center justify-center p-2">
                <div className="pointer-events-none absolute top-1/2 -left-3 w-3 border-border border-t border-dotted" />
                <div className="pointer-events-none absolute top-1/2 -right-3 w-3 border-border border-t border-dotted" />
                <div className="aspect-square w-full max-w-[170px] border border-border bg-card p-2">
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

                <p className="mt-2 text-center font-mono text-[8px] text-muted-foreground leading-relaxed">
                  scan on phone
                  <br />
                  auto sync notes
                </p>
              </div>

              <div className="relative border border-border bg-background p-2">
                <div className="mx-auto flex h-full max-w-[170px] flex-col border border-border bg-card p-2">
                  <div className="mx-auto h-1 w-12 rounded-full bg-border" />
                  <div className="mt-2 flex items-center justify-between border border-border px-2 py-1">
                    <span className="font-mono text-[8px] text-muted-foreground tracking-[0.1em]">
                      presenter phone
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[8px] text-emerald-500">
                      <WifiHigh className="animate-pulse" size={9} />
                      synced
                    </span>
                  </div>

                  <div className="mt-2 flex-1 border border-border bg-background px-2 py-1.5">
                    <p className="font-mono text-[8px] text-muted-foreground tracking-[0.1em]">
                      speaker notes
                    </p>
                    <p className="mt-1 text-[9px] text-muted-foreground/75 leading-relaxed">
                      <span className="font-semibold text-foreground">
                        [Opening / Transition:]
                      </span>{" "}
                      "Good morning, everyone. Let's start with a quick snapshot
                      of our Q3 performance."
                    </p>
                    <p className="mt-1 text-[9px] text-muted-foreground/75 leading-relaxed">
                      <span className="font-semibold text-foreground">
                        [Closing / Hand-off:]
                      </span>{" "}
                      "In summary, Q3 delivered strong top-line momentum and
                      meaningful margin expansion We're entering Q4 with
                      confidence and clear priorities.
                    </p>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <button
                      className="inline-flex items-center justify-center border border-border bg-background px-1.5 py-1 font-mono text-[8px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                      type="button"
                    >
                      previous
                    </button>
                    <button
                      className="inline-flex items-center justify-center border border-transparent bg-primary px-1.5 py-1 font-mono text-[8px] text-primary-foreground transition-colors hover:bg-primary/90"
                      type="button"
                    >
                      next
                    </button>
                  </div>
                </div>

                <DeviceMobileCamera
                  className="absolute top-5 -left-2 text-foreground/70"
                  size={12}
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
