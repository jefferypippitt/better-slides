import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getMdxComponentByName,
  resolveMdxComponents,
} from "@/components/mdx/component-registry";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { auth } from "@/lib/auth";
import { getDeckForUser } from "@/lib/decks";
import type { MarkdownSection } from "@/lib/sections";
import { parseMarkdownSections } from "@/lib/sections";

export const dynamic = "force-dynamic";

const Slide = mdxComponents.Slide;
const HEADING_PREFIX_RE = /^#{1,6}\s+/;

interface RenderCanvasBoxArgs {
  box: NonNullable<
    Awaited<ReturnType<typeof getDeckForUser>>
  >["slides"][number]["canvasLayout"][number];
  resolvedMdxComponents: ReturnType<typeof resolveMdxComponents>;
  sectionById: Map<string, MarkdownSection>;
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

function renderCanvasBox({
  box,
  resolvedMdxComponents,
  sectionById,
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
    const Component = getMdxComponentByName(
      box.componentName ?? "",
      uploadedWidgets
    );
    if (!Component) {
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
        <Component />
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
        components={resolvedMdxComponents}
        section={section}
        textStyle={textStyle}
      />
    </div>
  );
}

async function SectionBoxContent({
  components,
  section,
  textStyle,
}: {
  components: ReturnType<typeof resolveMdxComponents>;
  section: MarkdownSection;
  textStyle: "title" | "subtitle" | "body";
}) {
  const bodyMdx = stripSectionHeading(section.content);
  return (
    <div className="flex h-full flex-col gap-2 overflow-auto">
      <p className={`wrap-break-word ${getTextStyleClasses(textStyle)}`}>
        {section.heading}
      </p>
      {bodyMdx && (
        <div className="text-[clamp(0.85rem,1.5cqw,1.2rem)] leading-snug [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-[0.9em] [&_li]:mb-0.5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
          <MDXRemote components={components} source={bodyMdx} />
        </div>
      )}
    </div>
  );
}

export default async function SlidePage({ params }: Props) {
  const { deckId, page } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    notFound();
  }
  const deck = await getDeckForUser(deckId, session.user.id);
  if (!deck) {
    notFound();
  }
  const uploadedWidgets = deck.widgets.map((widget) => ({
    compiledJs: widget.compiledJs,
    componentName: widget.componentName,
  }));
  const resolvedMdxComponents = resolveMdxComponents(deck.mdx, uploadedWidgets);

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

    const renderableBoxes = slideLayout.canvasLayout.filter((box) => {
      if (box.kind === "separator") {
        return true;
      }
      if (box.kind === "component") {
        return Boolean(
          getMdxComponentByName(box.componentName ?? "", uploadedWidgets)
        );
      }
      return box.sectionId ? sectionById.has(box.sectionId) : false;
    });

    if (renderableBoxes.length === 0) {
      // Empty canvas slide — render a blank slide
      return (
        <div className="absolute inset-x-0 top-11 bottom-11 bg-background" />
      );
    }

    return (
      <div className="@container absolute inset-x-0 top-11 bottom-11 overflow-hidden bg-background">
        {renderableBoxes.map((box) =>
          renderCanvasBox({
            box,
            resolvedMdxComponents,
            sectionById,
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
    <Slide>
      <MDXRemote components={resolvedMdxComponents} source={source} />
    </Slide>
  );
}
