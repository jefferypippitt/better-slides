"use client";

import {
  ArrowsOutCardinalIcon,
  CodeSimpleIcon,
  DeviceMobileCameraIcon,
  DeviceMobileIcon,
  FileArrowUpIcon,
  FilesIcon,
  ListChecksIcon,
  MoonIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { SlideBar } from "./slide-bar";

const FEATURES = [
  {
    icon: <CodeSimpleIcon size={22} weight="light" />,
    title: "MDX Editor",
    desc: "Draft slides in plain Markdown, then drop in live React components anywhere you need custom visuals.",
  },
  {
    icon: <FileArrowUpIcon size={22} weight="light" />,
    title: "Flexible File Uploads",
    desc: "Bring in your existing source files and turn them into slides instead of rewriting content from scratch.",
  },
  {
    icon: <DeviceMobileIcon size={22} weight="light" />,
    title: "Mobile Notes View",
    desc: "Use your phone as a private confidence monitor while the audience only sees the presentation.",
  },
  {
    icon: <MoonIcon size={22} weight="light" />,
    title: "Dark Mode",
    desc: "Switch themes instantly for bright rooms, projectors, or late-night edits without eye strain.",
  },
  {
    icon: <ArrowsOutCardinalIcon size={22} weight="light" />,
    title: "Visual Slide Composer",
    desc: "Rearrange sections by dragging visual blocks on a live canvas when the narrative order changes.",
  },
  {
    icon: <DeviceMobileCameraIcon size={22} weight="light" />,
    title: "QR Presenter Connect",
    desc: "Scan once to pair your phone and control progression remotely with no account setup or cable pairing.",
  },
  {
    icon: <ListChecksIcon size={22} weight="light" />,
    title: "Presenter Notes",
    desc: "Attach per-slide talking points, reminders, and timing cues that stay hidden from your audience.",
  },
  {
    icon: <FilesIcon size={22} weight="light" />,
    title: "Multi-Slide Workflow",
    desc: "Jump between slides quickly, duplicate ideas, and iterate on the full deck without losing momentum.",
  },
  {
    icon: <UploadSimpleIcon size={22} weight="light" />,
    title: "Import TSX Slides",
    desc: "Bring your existing .tsx slide files into a deck and present them without rebuilding everything from scratch.",
  },
] as const;

export function FeaturesSlide() {
  return (
    <section className="landing-section sticky top-0 z-4 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="04 / 07" right="FEATURES" />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 p-8">
        <h2 className="text-center font-bold text-[clamp(1.8rem,4vw,3rem)] tracking-tight">
          Everything you need.
        </h2>

        <div className="grid w-full grid-cols-2 gap-px border border-border bg-border lg:grid-cols-3">
          {FEATURES.map((feat) => (
            <div
              className="flex flex-col gap-4 bg-background p-8"
              key={feat.title}
            >
              <div className="text-foreground">{feat.icon}</div>
              <div>
                <p className="mb-1 font-semibold text-sm">{feat.title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
