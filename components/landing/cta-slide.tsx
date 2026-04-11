"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SlideBar from "./slide-bar";

export default function CtaSlide() {
  return (
    <section className="landing-section sticky top-0 z-7 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="07 / 07" right="GET STARTED" />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center lg:gap-7 lg:p-8">
        <h2 className="font-semibold text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.08] tracking-[-0.025em]">
          Ready to Present
        </h2>
        <p className="max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg">
          Make your first deck in minutes. It is free to get started and no card
          is needed.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
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

      <SlideBar left="" position="bottom" right="" />
    </section>
  );
}
