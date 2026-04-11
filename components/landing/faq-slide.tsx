"use client";

import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import SlideBar from "./slide-bar";

const FAQS = [
  {
    q: "Is there a free plan?",
    a: "Yes. You can create and present decks for free with no card required. Some advanced features may be gated later on, but the core always stays free.",
  },
  {
    q: "Do I need to know how to code?",
    a: "Not at all. Write plain Markdown and you get beautiful slides straight away. The code side is there if you want it, but it is entirely optional.",
  },
  {
    q: "How do I present? Is it fullscreen?",
    a: "Yes. Open any deck and hit present to go fullscreen. Your notes and slide controls stay visible the whole time.",
  },
  {
    q: "Can I share a deck with someone else?",
    a: "Anyone with the link can view and navigate through your slides without needing an account. Only the deck owner can make changes.",
  },
  {
    q: "Which file formats are supported?",
    a: "Your content lives in Markdown. Upload .md or .mdx files to get started, and .tsx files for any slides where you want interactive elements.",
  },
  {
    q: "How does the mobile notes feature work?",
    a: "During a presentation, scan the QR code on screen with your phone. Your notes stay in sync with the current slide and only you can see them.",
  },
  {
    q: "Can I embed custom React components?",
    a: "Yes. Drop .tsx files into the editor and use them in any slide. They render live with no setup needed.",
  },
  {
    q: "Is my data private?",
    a: "Your decks are private to your account and no one else can access them. That said, content is not encrypted at rest so avoid storing anything sensitive.",
  },
] as const;

export default function FaqSlide() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="landing-section sticky top-0 z-6 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="06 / 07" right="FAQ" />

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col lg:flex-row">
        {/* Left: title */}
        <section className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12">
          <h2 className="font-semibold text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.08] tracking-[-0.025em]">
            Got
            <br />
            <span className="opacity-35">questions?</span>
          </h2>
        </section>

        {/* Right: accordion */}
        <section className="flex flex-1 flex-col justify-center gap-8 p-6 sm:p-8 lg:p-12">
          <div className="divide-y divide-border border border-border">
            {FAQS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={item.q}>
                  <button
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-foreground/3"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    type="button"
                  >
                    <span className="font-semibold text-sm">{item.q}</span>
                    {isOpen ? (
                      <MinusIcon
                        className="shrink-0 text-muted-foreground"
                        size={14}
                      />
                    ) : (
                      <PlusIcon
                        className="shrink-0 text-muted-foreground"
                        size={14}
                      />
                    )}
                  </button>
                  {isOpen && (
                    <p className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <SlideBar left="" position="bottom" right="" />
    </section>
  );
}
