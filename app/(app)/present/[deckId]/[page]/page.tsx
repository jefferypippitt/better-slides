import Image from "next/image";
import { notFound } from "next/navigation";
import { Tweet } from "react-tweet";
import { ClientMdxRenderer } from "@/components/mdx/client-mdx-renderer";
import { ClientWidgetSlot } from "@/components/mdx/client-widget-slot";
import { TimerBox } from "@/components/present/timer-box";
import { Slide } from "@/components/slides/primitives";
import type { MarkdownSection } from "@/lib/sections";
import { parseMarkdownSections } from "@/lib/sections";
import { getAuthorizedDeckForPresent } from "@/server/present";

export const dynamic = "force-dynamic";

const HEADING_PREFIX_RE = /^#{1,6}\s+/;
const YOUTUBE_WATCH_RE = /[?&]v=([^&#]+)/;
const YOUTUBE_SHORT_RE = /youtu\.be\/([^?&#]+)/;
const YOUTUBE_EMBED_RE = /youtube\.com\/embed\/([^?&#]+)/;
const TWITTER_STATUS_RE = /\/status\/(\d+)/;

function extractTweetId(url: string): string | null {
  const match = TWITTER_STATUS_RE.exec(url);
  return match ? match[1] : null;
}

function toYoutubeEmbedUrl(url: string): string | null {
  const watchMatch = YOUTUBE_WATCH_RE.exec(url);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  const shortMatch = YOUTUBE_SHORT_RE.exec(url);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }
  const embedMatch = YOUTUBE_EMBED_RE.exec(url);
  if (embedMatch) {
    return `https://www.youtube.com/embed/${embedMatch[1]}`;
  }
  return null;
}
const PRESENT_FRAME_CLASSES =
  "slide-view @container absolute inset-4 overflow-hidden rounded-2xl bg-background";

interface RenderCanvasBoxArgs {
  box: NonNullable<
    Awaited<ReturnType<typeof getAuthorizedDeckForPresent>>
  >["slides"][number]["canvasLayout"][number];
  deckId: string;
  sectionById: Map<string, MarkdownSection>;
  slideCount: number;
  slideIndex: number;
  uploadedWidgets: { compiledJs: string; componentName: string }[];
}

interface Props {
  params: Promise<{ deckId: string; page: string }>;
}

function getTextStyleClasses(textStyle: "title" | "subtitle" | "body"): string {
  if (textStyle === "title") {
    return "text-[clamp(2rem,6cqw,6rem)] font-bold leading-[0.95] tracking-tight";
  }
  if (textStyle === "subtitle") {
    return "text-[clamp(1.25rem,3.5cqw,2.8rem)] font-semibold leading-tight tracking-tight";
  }
  return "text-[clamp(1rem,2cqw,1.5rem)] font-medium leading-snug tracking-normal";
}

function stripSectionHeading(content: string): string {
  const lines = content.split("\n");
  const first = lines[0]?.trimStart() ?? "";
  if (HEADING_PREFIX_RE.test(first)) {
    return lines.slice(1).join("\n").trim();
  }
  return content.trim();
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: each canvas box kind is an explicit branch; co-location is intentional.
function renderCanvasBox({
  box,
  deckId,
  sectionById,
  slideIndex,
  slideCount,
  uploadedWidgets,
}: RenderCanvasBoxArgs) {
  if (box.kind === "separator") {
    const isVertical = box.h > box.w;
    return (
      <div
        className={`absolute flex ${isVertical ? "justify-center" : "items-center"}`}
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        <div
          className={`rounded-full bg-foreground/70 ${
            isVertical ? "h-full w-[4px]" : "h-[4px] w-full"
          }`}
        />
      </div>
    );
  }

  if (box.kind === "component") {
    if (!box.componentName?.trim()) {
      return null;
    }
    return (
      <div
        className="absolute overflow-auto p-3"
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        <ClientWidgetSlot
          componentName={box.componentName}
          uploadedWidgets={uploadedWidgets}
        />
      </div>
    );
  }

  if (box.kind === "image") {
    if (!box.imageUrl) {
      return null;
    }
    return (
      <div
        className="absolute overflow-hidden"
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: user-provided external URLs require img tag */}
        {/* biome-ignore lint/correctness/useImageSize: dimensions are controlled via CSS for user-provided URLs */}
        <img alt="" className="h-full w-full object-cover" src={box.imageUrl} />
      </div>
    );
  }

  if (box.kind === "youtube") {
    if (!box.youtubeUrl) {
      return null;
    }
    const embedUrl = toYoutubeEmbedUrl(box.youtubeUrl);
    if (!embedUrl) {
      return null;
    }
    return (
      <div
        className="absolute overflow-hidden"
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
          src={embedUrl}
          title="YouTube video"
        />
      </div>
    );
  }

  if (box.kind === "twitter") {
    const tweetId = box.twitterUrl ? extractTweetId(box.twitterUrl) : null;
    if (!tweetId) {
      return null;
    }
    return (
      <div
        className="absolute flex items-center justify-center overflow-hidden"
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        <div className="h-full w-full [&>div]:bg-transparent! [&_.react-tweet-tweet]:bg-transparent!">
          <Tweet id={tweetId} />
        </div>
      </div>
    );
  }

  if (box.kind === "shape") {
    return (
      <div
        className="absolute"
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        <div
          className={`h-full w-full ${box.shapeType === "circle" ? "rounded-full" : "rounded-sm"}`}
          style={{ backgroundColor: box.shapeColor ?? "#818cf8" }}
        />
      </div>
    );
  }

  if (box.kind === "text") {
    if (!box.staticText?.trim()) {
      return null;
    }
    const textStyle = box.textStyle ?? "subtitle";
    return (
      <div
        className="absolute overflow-hidden p-3"
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        <p className={`wrap-break-word ${getTextStyleClasses(textStyle)}`}>
          {box.staticText}
        </p>
      </div>
    );
  }

  if (box.kind === "page-number") {
    return (
      <div
        className="absolute flex items-center justify-center font-mono text-[clamp(0.75rem,2cqw,1.5rem)] text-foreground/70"
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        {slideIndex + 1} / {slideCount}
      </div>
    );
  }

  if (box.kind === "timer") {
    return (
      <div
        className="absolute"
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        <TimerBox />
      </div>
    );
  }

  if (box.kind === "qr-code") {
    return (
      <div
        className="absolute flex items-center justify-center p-2"
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        <Image
          alt="Notes QR code"
          className="h-full w-full object-contain"
          height={300}
          src={`/api/notes-qr/${deckId}`}
          unoptimized
          width={300}
        />
      </div>
    );
  }

  if (box.kind === "url-qr") {
    if (!box.customQrUrl) {
      return null;
    }
    return (
      <div
        className="absolute flex items-center justify-center p-2"
        key={box.id}
        style={{
          height: `${box.h}%`,
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
        }}
      >
        <Image
          alt="QR code"
          className="h-full w-full object-contain"
          height={300}
          src={`/api/qr?url=${encodeURIComponent(box.customQrUrl)}`}
          unoptimized
          width={300}
        />
      </div>
    );
  }

  const section = box.sectionId ? sectionById.get(box.sectionId) : undefined;
  if (!section) {
    return null;
  }

  const textStyle = box.textStyle ?? "body";
  return (
    <div
      className="absolute overflow-hidden p-3"
      key={box.id}
      style={{
        height: `${box.h}%`,
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.w}%`,
      }}
    >
      <SectionBoxContent
        section={section}
        textStyle={textStyle}
        uploadedWidgets={uploadedWidgets}
      />
    </div>
  );
}

function SectionBoxContent({
  section,
  textStyle,
  uploadedWidgets,
}: {
  section: MarkdownSection;
  textStyle: "title" | "subtitle" | "body";
  uploadedWidgets: { compiledJs: string; componentName: string }[];
}) {
  const bodyMdx = stripSectionHeading(section.content);
  return (
    <div className="flex h-full flex-col gap-2 overflow-auto">
      <p className={`wrap-break-word ${getTextStyleClasses(textStyle)}`}>
        {section.heading}
      </p>
      {bodyMdx && (
        <ClientMdxRenderer
          className="text-[clamp(0.85rem,1.5cqw,1.2rem)] leading-snug [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-[0.9em] [&_li]:mb-0.5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
          source={bodyMdx}
          uploadedWidgets={uploadedWidgets}
        />
      )}
    </div>
  );
}

export default async function SlidePage({ params }: Props) {
  const { deckId, page } = await params;
  const deck = await getAuthorizedDeckForPresent(deckId);
  if (!deck) {
    notFound();
  }
  const uploadedWidgets = deck.widgets.map((widget) => ({
    compiledJs: widget.compiledJs,
    componentName: widget.componentName,
  }));

  const slideIndex = Number.parseInt(page, 10) - 1;

  // ── Canvas layout mode ──────────────────────────────────────────────────
  if (deck.slides.length > 0) {
    const slideLayout = deck.slides[slideIndex];
    if (!slideLayout) {
      notFound();
    }

    const sections = parseMarkdownSections(deck.mdx);
    const sectionById = new Map<string, MarkdownSection>();
    for (const [index, section] of sections.entries()) {
      sectionById.set(section.id, section);
      // Backward compat: old IDs were s{index}-{slug}
      sectionById.set(`s${index}-${section.id.slice(0, 30)}`, section);
    }

    const isBoxRenderable = (
      box: (typeof slideLayout.canvasLayout)[number]
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: each box kind requires an explicit renderable check.
    ): boolean => {
      if (box.kind === "separator") {
        return true;
      }
      if (box.kind === "component") {
        return Boolean(box.componentName?.trim());
      }
      if (box.kind === "image") {
        return Boolean(box.imageUrl);
      }
      if (box.kind === "youtube") {
        return Boolean(box.youtubeUrl && toYoutubeEmbedUrl(box.youtubeUrl));
      }
      if (box.kind === "twitter") {
        return Boolean(box.twitterUrl && extractTweetId(box.twitterUrl));
      }
      if (box.kind === "shape") {
        return true;
      }
      if (box.kind === "text") {
        return Boolean(box.staticText?.trim());
      }
      if (box.kind === "page-number") {
        return true;
      }
      if (box.kind === "timer") {
        return true;
      }
      if (box.kind === "qr-code") {
        return true;
      }
      if (box.kind === "url-qr") {
        return Boolean(box.customQrUrl);
      }
      return box.sectionId ? sectionById.has(box.sectionId) : false;
    };
    const renderableBoxes = slideLayout.canvasLayout.filter(isBoxRenderable);

    if (renderableBoxes.length === 0) {
      // Empty canvas slide — render a blank slide
      return <div className={PRESENT_FRAME_CLASSES} />;
    }

    return (
      <div className={PRESENT_FRAME_CLASSES}>
        {renderableBoxes.map((box) =>
          renderCanvasBox({
            box,
            deckId,
            sectionById,
            slideIndex,
            slideCount: deck.slides.length,
            uploadedWidgets,
          })
        )}
      </div>
    );
  }

  // ── Standard MDX mode (H2 sections as slides) ───────────────────────────
  const sections = parseMarkdownSections(deck.mdx);

  if (slideIndex < 0 || slideIndex >= sections.length) {
    notFound();
  }

  const source = sections[slideIndex].content;

  return (
    <div className={PRESENT_FRAME_CLASSES}>
      <Slide className="h-full w-full">
        <ClientMdxRenderer source={source} uploadedWidgets={uploadedWidgets} />
      </Slide>
    </div>
  );
}
