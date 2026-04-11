import SlideBar from "./slide-bar";

const VALUE_PROPS = [
  {
    num: "01",
    title: "Write in Markdown, embed real code",
    desc: "Plain MDX slides you can write fast. Drop in any React component when a bullet point is not enough.",
  },
  {
    num: "02",
    title: "Compose on a canvas, not a template",
    desc: "Place blocks freely with guides and snapping instead of fighting master layouts.",
  },
  {
    num: "03",
    title: "Demos that stay alive on the slide",
    desc: "Upload a .tsx file and embed it directly. Charts, counters, and widgets that actually run.",
  },
  {
    num: "04",
    title: "A second screen in your pocket",
    desc: "Speaker notes and slide control on your phone, always synced to what's on the screen.",
  },
  {
    num: "05",
    title: "The room joins with one scan",
    desc: "QR hands guests notes or co-presenters control without passing cables or accounts around.",
  },
  {
    num: "06",
    title: "From edit to the stage in one click",
    desc: "Design on a canvas that mirrors the live stage. No export, no format conversion, no surprises.",
  },
] as const;

function ValuePropsGrid() {
  return (
    <div className="grid w-full grid-cols-1 border-border border-t border-l sm:grid-cols-2 lg:grid-cols-3">
      {VALUE_PROPS.map((item) => (
        <article
          className="flex min-h-0 items-start border-border border-r border-b bg-background p-5 sm:p-6"
          key={item.num}
        >
          <div className="flex w-full flex-col gap-2 text-left">
            <p className="font-semibold text-[15px] leading-snug tracking-tight">
              {item.title}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {item.desc}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function WhySlide() {
  return (
    <section className="landing-section sticky top-0 z-2 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="02 / 07" right="WHY BETTER SLIDES" />

      <div className="relative flex flex-1 flex-col lg:flex-row">
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col lg:flex-row">
          {/* Left: content — same shell + max width as hero-slide */}
          <div className="flex min-w-0 flex-1 items-center justify-center border-border border-b p-6 sm:p-8 lg:justify-end lg:border-b-0 lg:p-12 lg:pr-8">
            <div className="flex w-full max-w-2xl flex-col items-start gap-7">
              <h2 className="font-semibold text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.08] tracking-[-0.025em]">
                Shaped around
                <br />
                <span className="opacity-35">how you really work.</span>
              </h2>
            </div>
          </div>

          {/* Mobile: compact list */}
          <div className="flex flex-col gap-3 border-border border-t p-6 sm:hidden">
            {VALUE_PROPS.map((item) => (
              <div className="flex items-start gap-3" key={item.num}>
                <span className="mt-0.5 shrink-0 font-mono text-[11px] text-muted-foreground/50">
                  {item.num}
                </span>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.title}
                </p>
              </div>
            ))}
          </div>

          {/* Right: grid — horizontally centered in column (same padding axis as hero-slide) */}
          <div className="relative hidden min-h-0 min-w-0 flex-1 flex-col justify-center p-6 sm:flex sm:h-72 md:h-80 lg:h-auto lg:p-12 lg:pl-8">
            <div className="flex w-full justify-center">
              <div className="w-full max-w-3xl overflow-auto xl:max-w-4xl">
                <ValuePropsGrid />
              </div>
            </div>
          </div>
        </div>
        {/* end unified container */}
      </div>

      <SlideBar left="" position="bottom" right="" />
    </section>
  );
}
