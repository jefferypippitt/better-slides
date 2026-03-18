"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef } from "react";

function isTouchDevice() {
  return (
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );
}

export default function LandingScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const touch = isTouchDevice();

    const lenis = new Lenis({
      lerp: touch ? 1 : 0.08,
      smoothWheel: !touch,
    });

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

      if (touch) {
        gsap.set(sections.slice(1), { opacity: 0, pointerEvents: "none" });
      } else {
        gsap.set(sections.slice(1), {
          opacity: 0,
          y: 40,
          scale: 0.98,
          pointerEvents: "none",
          transformOrigin: "center center",
        });
      }

      for (const section of sections.slice(1)) {
        const sectionChildren = Array.from(section.children) as HTMLElement[];

        if (touch) {
          gsap.set(sectionChildren, { opacity: 0 });
        } else {
          gsap.set(sectionChildren, { y: 16, opacity: 0 });
        }

        ScrollTrigger.create({
          trigger: section,
          start: "top 88%",
          onEnter: () => {
            if (touch) {
              gsap.to(section, {
                duration: 0.5,
                ease: "power2.out",
                opacity: 1,
                overwrite: "auto",
              });
              gsap.to(sectionChildren, {
                opacity: 1,
                duration: 0.4,
                stagger: 0.08,
                ease: "power3.out",
                overwrite: "auto",
              });
            } else {
              gsap.to(section, {
                duration: 0.65,
                ease: "power2.out",
                opacity: 1,
                y: 0,
                scale: 1,
                overwrite: "auto",
              });
              gsap.to(sectionChildren, {
                y: 0,
                opacity: 1,
                duration: 0.55,
                stagger: 0.1,
                ease: "power3.out",
                overwrite: "auto",
              });
            }
            gsap.set(section, { pointerEvents: "auto" });
          },
          onEnterBack: () => {
            if (touch) {
              gsap.to(section, {
                duration: 0.4,
                ease: "power2.out",
                opacity: 1,
                overwrite: "auto",
              });
              gsap.to(sectionChildren, {
                opacity: 1,
                duration: 0.35,
                stagger: 0.06,
                ease: "power3.out",
                overwrite: "auto",
              });
            } else {
              gsap.to(section, {
                duration: 0.55,
                ease: "power2.out",
                opacity: 1,
                y: 0,
                scale: 1,
                overwrite: "auto",
              });
              gsap.to(sectionChildren, {
                y: 0,
                opacity: 1,
                duration: 0.45,
                stagger: 0.08,
                ease: "power3.out",
                overwrite: "auto",
              });
            }
            gsap.set(section, { pointerEvents: "auto" });
          },
          onLeaveBack: () => {
            if (touch) {
              gsap.set(section, { opacity: 0, pointerEvents: "none" });
              gsap.set(sectionChildren, { opacity: 0 });
            } else {
              gsap.set(section, {
                opacity: 0,
                y: 40,
                scale: 0.98,
                pointerEvents: "none",
              });
              gsap.set(sectionChildren, { y: 16, opacity: 0 });
            }
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
    <div ref={containerRef} style={{ overflowX: "clip" }}>
      {children}
    </div>
  );
}
