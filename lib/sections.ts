const FRONT_MATTER_RE = /^---[\s\S]*?---\n?/;
const HEADING_SPLIT_RE = /(?=^#{1,4} )/m;
const HEADING_STRIP_RE = /^#+\s*/;
const HEADING_LINE_RE = /^#{1,4} /;

export interface MarkdownSection {
  content: string;
  heading: string;
  id: string;
}

export function getSectionId(heading: string, _index: number): string {
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  return slug || "untitled";
}

export function parseMarkdownSections(mdx: string): MarkdownSection[] {
  const body = mdx.replace(FRONT_MATTER_RE, "").trimStart();
  const chunks = body.split(HEADING_SPLIT_RE);

  const firstChunk = chunks[0]?.trim() ?? "";
  const hasLeadingBlock =
    firstChunk.length > 0 && !HEADING_LINE_RE.test(firstChunk);

  const leadingSection: MarkdownSection[] = hasLeadingBlock
    ? [{ id: "lead", heading: "Intro", content: firstChunk }]
    : [];

  const headingSections = chunks
    .map((chunk) => chunk.trim())
    .filter((chunk) => HEADING_LINE_RE.test(chunk))
    .map((chunk, index) => {
      const firstLine = chunk.split("\n")[0] ?? "";
      const heading =
        firstLine.replace(HEADING_STRIP_RE, "").trim() ||
        `Section ${String(index + 1)}`;
      return {
        id: getSectionId(heading, index),
        heading,
        content: chunk,
      };
    });

  return [...leadingSection, ...headingSections];
}
