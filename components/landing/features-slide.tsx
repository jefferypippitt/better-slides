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
    desc: "Write slides in Markdown and embed live React components for custom visuals.",
  },
  {
    icon: <UploadSimpleIcon size={24} weight="light" />,
    title: "TSX Widget Uploads",
    desc: "Upload `.tsx` files and render interactive widgets — charts, counters, toggles, etc.",
  },
  {
    icon: <DeviceMobileIcon size={24} weight="light" />,
    title: "Mobile Notes View",
    desc: "Read speaker notes on your phone, synced to the current slide in real-time.",
  },
  {
    icon: <ShapesIcon size={24} weight="light" />,
    title: "Built-in Elements",
    desc: "Separators, images, shapes, emoji, timers, social embeds, etc.",
  },
  {
    icon: <ArrowsOutCardinalIcon size={24} weight="light" />,
    title: "Visual Layout Composer",
    desc: "Drag blocks on a live canvas to rearrange your layout across every slide.",
  },
  {
    icon: <DeviceMobileCameraIcon size={24} weight="light" />,
    title: "QR Connect",
    desc: "Scan to join as a remote. Multiple presenters can connect to the same deck simultaneously.",
  },
  {
    icon: <ListChecksIcon size={24} weight="light" />,
    title: "Precision Editing Tools",
    desc: "Grid snapping, center guides, and quick undo for pixel-accurate layout control.",
  },
  {
    icon: <ArrowSquareOutIcon size={24} weight="light" />,
    title: "1:1 Stage Preview",
    desc: "Design on a 16:9 canvas that mirrors the live stage. One click to present.",
  },
] as const;

export default function FeaturesSlide() {
  const renderCard = (feature: (typeof FEATURES)[number]) => (
    <div className="flex w-full gap-3 bg-background p-4 sm:p-5">
      <div className="mt-0.5 shrink-0 text-foreground">{feature.icon}</div>
      <div>
        <p className="mb-1 font-semibold text-[15px] tracking-tight">
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

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <h2 className="text-center font-bold text-[clamp(2.25rem,4.8vw,4.25rem)] leading-tight tracking-tight">
          Everything you need.
        </h2>

        {/* Grid: 2 rows x 4 columns */}
        <div className="grid w-full grid-cols-1 border-border border-t border-l sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              className="border-border border-r border-b bg-background"
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
