"use client";

import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { SlideBar } from "./slide-bar";

const FAQS = [
  {
    q: "Which file formats are supported?",
    a: "Deck content is markdown-first: upload `.md` and `.mdx`. For interactive slides, you can also upload `.tsx` React widgets and use them inside MDX.",
  },
  {
    q: "Do I need to know how to code?",
    a: "No. Write plain Markdown and you get beautiful slides instantly. Code knowledge unlocks extras like custom React widgets, but it's entirely optional.",
  },
  {
    q: "How does the mobile notes feature work?",
    a: "Scan the QR code shown during a presentation to pair your phone. Presenter notes sync in real time — only you see them.",
  },
  {
    q: "Can I embed custom React components?",
    a: "Yes. Drop in .tsx widget files from the editor using MDX. They render live inside any slide without any build step.",
  },
  {
    q: "Is my data private?",
    a: "All decks are stored privately and tied to your account. No one else can view or access them.",
  },
] as const;

export function FaqSlide() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="landing-section sticky top-0 z-6 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="06 / 07" right="FAQ" />

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left: title */}
        <div className="flex flex-1 items-center justify-center border-border border-b p-12 lg:border-r lg:border-b-0">
          <h2 className="font-bold text-[clamp(2.2rem,5.5vw,4.5rem)] leading-[1.1] tracking-tight">
            Questions,
            <br />
            <span className="opacity-35">answered.</span>
          </h2>
        </div>

        {/* Right: accordion */}
        <div className="flex flex-1 flex-col justify-center gap-8 p-12">
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
        </div>
      </div>

      <SlideBar left="" position="bottom" right="" />
    </section>
  );
}
