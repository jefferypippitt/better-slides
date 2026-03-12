import { Button } from "@/components/ui/button";
import { SlideBar } from "./slide-bar";

const FORMATS = [
  "PDF",
  "CSV",
  "DOCX",
  "TXT",
  "HTML",
  "ODT",
  "RTF",
  "EPUB",
  "JSON",
  "XLSX",
  "MD",
] as const;

export function UploadFormatsSlide() {
  return (
    <section className="landing-section sticky top-0 z-5 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="05 / 07" right="UPLOAD FORMATS" />

      <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <div>
          <h2 className="mb-4 font-bold text-[clamp(1.6rem,4vw,3.2rem)] leading-tight tracking-tight">
            Drop a file.
            <br />
            <span className="opacity-35">Import files instantly.</span>
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {FORMATS.map((fmt, index) => (
            <Button
              className="h-10 px-5 font-mono text-[10px] tracking-[0.14em]"
              key={fmt}
              size="default"
              type="button"
              variant={index % 2 === 0 ? "default" : "secondary"}
            >
              {fmt}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
