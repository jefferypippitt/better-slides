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
      if (sections.length <= 1) {
        return;
      }

      gsap.set(sections.slice(1), {
        opacity: 0,
        y: 40,
        scale: 0.98,
        pointerEvents: "none",
        transformOrigin: "center center",
      });

      for (const section of sections.slice(1)) {
        const children = Array.from(section.children) as HTMLElement[];

        gsap.set(children, { y: 16, opacity: 0 });

        ScrollTrigger.create({
          trigger: section,
          start: "top 88%",
          onEnter: () => {
            gsap.to(section, {
              duration: 0.65,
              ease: "power2.out",
              opacity: 1,
              y: 0,
              scale: 1,
              overwrite: "auto",
            });

            gsap.to(children, {
              y: 0,
              opacity: 1,
              duration: 0.55,
              stagger: 0.1,
              ease: "power3.out",
              overwrite: "auto",
            });

            gsap.set(section, { pointerEvents: "auto" });
          },
          onEnterBack: () => {
            gsap.to(section, {
              duration: 0.55,
              ease: "power2.out",
              opacity: 1,
              y: 0,
              scale: 1,
              overwrite: "auto",
            });

            gsap.to(children, {
              y: 0,
              opacity: 1,
              duration: 0.45,
              stagger: 0.08,
              ease: "power3.out",
              overwrite: "auto",
            });

            gsap.set(section, { pointerEvents: "auto" });
          },
          onLeaveBack: () => {
            gsap.set(section, {
              opacity: 0,
              y: 40,
              scale: 0.98,
              pointerEvents: "none",
            });
            gsap.set(children, { y: 16, opacity: 0 });
          },
        });
      }
      ScrollTrigger.refresh();
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
