"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SlideBar } from "./slide-bar";

export function CtaSlide() {
  return (
    <section className="landing-section sticky top-0 z-7 flex h-svh flex-col overflow-hidden bg-background">
      <SlideBar left="07 / 07" right="GET STARTED" />

      <div className="flex flex-1 flex-col items-center justify-center gap-7 p-8 text-center">
        <h2 className="font-bold text-[clamp(2.25rem,6.5vw,5.25rem)] leading-[0.95] tracking-tight">
          Ready to
          <br />
          <span className="opacity-35">present?</span>
        </h2>

        <p className="max-w-md text-base text-muted-foreground leading-relaxed md:text-lg">
          Create your first presentation in minutes. Free to start, no credit
          card required.
        </p>

        <div className="flex gap-3">
          <Link href="/sign-up">
            <Button size="lg" variant="default">
              Join Now <ChevronRight />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>
      </div>

      <SlideBar
        left="better-slides.com"
        position="bottom"
        right="BUILD FAST · PRESENT CLEARLY"
      />
    </section>
  );
}
