import SlideBar from "./slide-bar";

const PAIN_POINTS = [
  {
    num: "01",
    title: "Drag-and-drop doesn't scale",
    desc: "Google Slides and PowerPoint trap content in GUI editors — slow to build, painful to revise.",
  },
  {
    num: "02",
    title: "No support for live components",
    desc: "Neither platform can render interactive charts, counters, or custom UI. You're limited to static images.",
  },
  {
    num: "03",
    title: "Your notes are stuck on a second screen",
    desc: "Presenter view in both tools requires a split display. There's no native way to use your phone.",
  },
  {
    num: "04",
    title: "Formatting breaks on every revision",
    desc: "One content change in PowerPoint or Google Slides means manually fixing layouts across every slide.",
  },
  {
    num: "05",
    title: "Versioning is a file attachment nightmare",
    desc: '"final_v3_REAL.pptx" exists because both tools offer no real alternative to emailed attachments.',
  },
  {
    num: "06",
    title: "Always starting from a blank canvas",
    desc: "Your Markdown notes and docs are ignored. Both tools make you rebuild structure from scratch every time.",
  },
] as const;

export default function ProblemSlide() {
  return (
    <section className="landing-section sticky top-0 z-2 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="02 / 07" right="THE PROBLEM" />

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col lg:flex-row">
        <section className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:justify-end lg:p-12 lg:pr-8">
          <h2 className="font-bold text-[clamp(2.25rem,4.8vw,4.25rem)] leading-[1.06] tracking-tight">
            Creating presentations <span className="opacity-35">is easy.</span>
            <br />
            <span aria-hidden="true" className="block h-2" />
            It&apos;s the process that{" "}
            <span className="opacity-35">takes time.</span>
          </h2>
        </section>

        <section className="flex flex-1 items-center p-6 sm:p-8 lg:p-12 lg:pl-8">
          <div className="grid w-full grid-cols-1 border-border border-t border-l sm:grid-cols-2">
            {PAIN_POINTS.map((item) => (
              <article
                className="flex items-center justify-center border-border border-r border-b bg-background p-5 sm:p-6"
                key={item.num}
              >
                <div className="w-full text-left">
                  <p className="mb-2 font-semibold text-[15px] leading-tight tracking-tight">
                    {item.title}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <SlideBar left="" position="bottom" right="" />
    </section>
  );
}
