"use client";

import {
  ArrowRightIcon,
  DeviceMobileCamera,
  WifiHigh,
} from "@phosphor-icons/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SlideBar } from "./slide-bar";

const QR_DOTS = [
  "111111100001111111",
  "100000100001000001",
  "101110100001011101",
  "101110100001011101",
  "101110100001011101",
  "100000100001000001",
  "111111100001111111",
  "000000000000000000",
  "101010111100101010",
  "010101000011010101",
  "111001011010110011",
  "001101100101001110",
  "110010001110110001",
  "000000000000000000",
  "111111100101100111",
  "100000100111001001",
  "101110101001111010",
  "100000101010001101",
];
const HERO_DOT_IDS = ["dot-1", "dot-2", "dot-3", "dot-4", "dot-5", "dot-6"];
const QR_CELLS = QR_DOTS.join("")
  .split("")
  .map((dot, cellIndex) => ({
    dot,
    id: `qr-${Math.floor(cellIndex / 18)}-${cellIndex % 18}`,
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
                            ? "h-1.5 w-4 animate-pulse bg-foreground"
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
                  <div className="grid h-full w-full grid-cols-18 gap-px bg-muted p-[2px]">
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
        left="better-slides.com"
        right={
          <span className="animation-duration-[1.6s] inline-block motion-safe:animate-bounce">
            SCROLL TO EXPLORE ↓
          </span>
        }
      />
    </section>
  );
}
