"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef } from "react";

export function LandingScroll({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    window.scrollTo(0, 0);

    lenis.on("scroll", ScrollTrigger.update);

    const rafCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);

    const context = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>(".landing-section");
      gsap.set(sections, { clearProps: "opacity,transform" });
      gsap.set(sections.slice(1), {
        rotateX: 8,
        opacity: 0,
        scale: 0.97,
        pointerEvents: "none",
        transformOrigin: "center center",
      });

      // Sections 2+ — scrubbed tilt settle as they enter viewport.
      // Delay the final CTA section so it doesn't overlap FAQ too early.
      for (const [index, section] of sections.slice(1).entries()) {
        const isLastSection = index === sections.length - 2;
        const interactiveProgressThreshold = isLastSection ? 0.78 : 0.6;
        const children = Array.from(section.children) as HTMLElement[];
        let isSectionInteractive = false;
        const setSectionInteractivity = (isInteractive: boolean) => {
          if (isSectionInteractive === isInteractive) {
            return;
          }
          isSectionInteractive = isInteractive;
          gsap.set(section, { pointerEvents: isInteractive ? "auto" : "none" });
        };

        gsap.set(children, { y: 18 });

        gsap.to(section, {
          rotateX: 0,
          opacity: 1,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: isLastSection ? "top 35%" : "top 88%",
            end: "top 6%",
            scrub: 1.5,
            onUpdate: (self) => {
              setSectionInteractivity(
                self.progress >= interactiveProgressThreshold
              );
            },
            onEnter: () => {
              gsap.to(children, {
                y: 0,
                duration: 0.65,
                stagger: 0.12,
                ease: "power3.out",
                overwrite: "auto",
              });
            },
            onLeaveBack: () => {
              setSectionInteractivity(false);
              gsap.set(children, { y: 18 });
            },
          },
        });
      }
    }, containerRef);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(rafCallback);
      context.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ perspective: "1200px", overflowX: "clip" }}
    >
      {children}
    </div>
  );
}
