import SlideBar from "./slide-bar";

const PAIN_POINTS = [
  {
    num: "01",
    title: "Slide building is tedious",
    desc: "Pixel-pushing layouts by hand kills momentum when you should be shaping the story.",
  },
  {
    num: "02",
    title: "Formatting becomes a black hole",
    desc: "Fonts, spacing, and consistency checks quietly eat hours across every deck revision.",
  },
  {
    num: "03",
    title: "Turning markdown ideas into decks is manual",
    desc: "Teams keep copy-pasting notes into slide builders instead of working from one markdown source of truth.",
  },
  {
    num: "04",
    title: "Presenting without notes is risky",
    desc: "Speakers juggle memory, timing, and flow because notes are awkward to access on the go.",
  },
  {
    num: "05",
    title: "From idea to first draft is too slow",
    desc: "Most tools make iteration heavy, so shipping a clean first version takes far too long.",
  },
  {
    num: "06",
    title: "Sharing and versioning are still messy",
    desc: "Attachments, conflicting edits, and scattered copies create friction when teams collaborate.",
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
          <div className="grid w-full grid-cols-1 sm:grid-cols-2">
            {PAIN_POINTS.map((item) => (
              <article
                className="flex items-center justify-center border border-border bg-background p-5 sm:p-6"
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
