"use client";

import {
  ArrowSquareOutIcon,
  ArrowsOutCardinalIcon,
  CodeSimpleIcon,
  DeviceMobileCameraIcon,
  DeviceMobileIcon,
  ListChecksIcon,
  ShapesIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import SlideBar from "./slide-bar";

const FEATURES = [
  {
    icon: <CodeSimpleIcon size={24} weight="light" />,
    title: "MDX Editor",
    desc: "Draft slides in plain Markdown, then drop in live React components anywhere you need custom visuals.",
  },
  {
    icon: <UploadSimpleIcon size={24} weight="light" />,
    title: "TSX Widget Uploads",
    desc: "Upload `.tsx` React components like theme toggles, counters, charts, and custom UI, then render them directly in your slides.",
  },
  {
    icon: <DeviceMobileIcon size={24} weight="light" />,
    title: "Mobile Notes View",
    desc: "Use your phone to read notes and control the presentation. We even have an auto-sync system where each note is synced to the presentation in real-time.",
  },
  {
    icon: <ShapesIcon size={24} weight="light" />,
    title: "Built-in Elements",
    desc: "Drop in separators, text blocks, images, shapes, emoji, timers, and page numbers without writing custom code.",
  },
  {
    icon: <ArrowsOutCardinalIcon size={24} weight="light" />,
    title: "Visual Layout Composer",
    desc: "Rearrange sections by dragging visual blocks on a live canvas. The layout stays at the same position on every slide.",
  },
  {
    icon: <DeviceMobileCameraIcon size={24} weight="light" />,
    title: "QR Connect",
    desc: "Scan your phone to connect to the presentation and control it remotely. We support multiple presenters connected to the same deck.",
  },
  {
    icon: <ListChecksIcon size={24} weight="light" />,
    title: "Precision Editing Tools",
    desc: "Use grid snapping, center guides, and quick undo to fine-tune layout details fast without fighting alignment.",
  },
  {
    icon: <ArrowSquareOutIcon size={24} weight="light" />,
    title: "1:1 Stage Preview",
    desc: "Design on a 16:9 canvas that mirrors the live stage, then open Present mode in one click when it is time to deliver.",
  },
] as const;

export default function FeaturesSlide() {
  const renderCard = (feature: (typeof FEATURES)[number]) => (
    <div className="flex w-full flex-col gap-3 bg-background p-4 sm:gap-4 sm:p-6 lg:p-8">
      <div className="text-foreground">{feature.icon}</div>
      <div>
        <p className="mb-1.5 font-semibold text-[15px] tracking-tight">
          {feature.title}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {feature.desc}
        </p>
      </div>
    </div>
  );

  return (
    <section className="landing-section sticky top-0 z-5 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="05 / 07" right="FEATURES" />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-6 lg:gap-10 lg:p-8">
        <h2 className="text-center font-bold text-[clamp(2.25rem,4.8vw,4.25rem)] leading-tight tracking-tight">
          Everything you need.
        </h2>

        {/* Grid: 2 rows x 4 columns */}
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              className="border border-border bg-background"
              key={feature.title}
            >
              {renderCard(feature)}
            </div>
          ))}
        </div>
      </div>

      <SlideBar left="" position="bottom" right="" />
    </section>
  );
}
