import type { Deck } from "@/lib/decks";
import { parseMarkdownSections } from "@/lib/sections";

const HEADING_LINE_RE = /^#{1,6}\s+/;

function stripHeadingLine(markdown: string): string {
  const lines = markdown.split("\n");
  const first = lines[0]?.trimStart() ?? "";
  if (HEADING_LINE_RE.test(first)) {
    return lines.slice(1).join("\n").trim();
  }
  return markdown.trim();
}

function summarizeMarkdownSlide(
  markdown: string,
  index: number
): string | null {
  const raw = markdown.trim();
  if (!raw) {
    return null;
  }

  const withoutHeading = stripHeadingLine(raw);
  const content = withoutHeading || raw;
  return `Slide ${String(index + 1)}\n\n${content}`;
}

function summarizeCanvasSlide(
  deck: Deck,
  slideIndex: number,
  sectionById: Map<string, string>
): string | null {
  const slide = deck.slides[slideIndex];
  if (!slide) {
    return null;
  }
  const authored = slide.speakerNotes?.trim();
  if (authored) {
    return authored;
  }

  const lines: string[] = [`Slide ${String(slideIndex + 1)}`];
  for (const box of slide.canvasLayout) {
    if (box.kind === "separator" || !box.sectionId) {
      continue;
    }
    const section = sectionById.get(box.sectionId);
    if (!section) {
      continue;
    }
    if (!lines.includes(section)) {
      lines.push(`- ${section}`);
    }
  }

  return lines.length > 1 ? lines.join("\n") : lines[0];
}

export function getSpeakerNotesForDeck(deck: Deck): (string | null)[] {
  if (deck.slides.length > 0) {
    const sections = parseMarkdownSections(deck.mdx);
    const sectionById = new Map<string, string>();

    for (const [index, section] of sections.entries()) {
      sectionById.set(section.id, section.heading);
      // Backward compat with old persisted section id shape.
      sectionById.set(`s${index}-${section.id.slice(0, 30)}`, section.heading);
    }

    return deck.slides.map((_, index) =>
      summarizeCanvasSlide(deck, index, sectionById)
    );
  }

  const sections = parseMarkdownSections(deck.mdx);
  return sections.map((section, index) =>
    summarizeMarkdownSlide(section.content, index)
  );
}
