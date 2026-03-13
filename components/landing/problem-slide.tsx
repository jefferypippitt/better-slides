import { SlideBar } from "./slide-bar";

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

export function ProblemSlide() {
  return (
    <section className="landing-section sticky top-0 z-2 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="02 / 07" right="THE PROBLEM" />

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left: big title */}
        <div className="flex flex-1 items-center justify-center border-border border-b p-12 lg:border-r lg:border-b-0">
          <h2 className="font-bold text-[clamp(2.2rem,5.5vw,4.5rem)] leading-[1.1] tracking-tight">
            Creating presentations
            <br />
            <span className="opacity-35">is easy.</span>
            <br />
            It&apos;s the process
            <br />
            <span className="opacity-35">that takes time.</span>
          </h2>
        </div>

        {/* Right: pain points */}
        <div className="flex flex-1 flex-col justify-center gap-8 p-12">
          {PAIN_POINTS.map((item) => (
            <div className="flex items-start gap-6" key={item.num}>
              <span className="mt-0.5 shrink-0 font-mono text-[11px] text-muted-foreground tracking-[0.12em]">
                {item.num}
              </span>
              <div>
                <p className="mb-1 font-semibold text-sm">{item.title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
