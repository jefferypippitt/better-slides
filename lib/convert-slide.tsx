import type { ReactNode } from "react";
import {
  Slide,
  SlideCode,
  SlideColumns,
  SlideList,
  SlideListItem,
  SlideNote,
  SlideStatement,
  SlideStatementList,
  SlideSubtitle,
  SlideTitle,
} from "@/components/slides/primitives";

// ─── AST types ────────────────────────────────────────────────────────────────

interface HeadingBlock {
  id: string;
  text: string;
  type: "h1" | "h2" | "h3";
}
interface ParagraphBlock {
  id: string;
  text: string;
  type: "paragraph";
}
interface ListItem {
  id: string;
  text: string;
}
interface ListBlock {
  id: string;
  items: ListItem[];
  type: "list";
}
interface CodeBlock {
  content: string;
  id: string;
  lang: string;
  type: "code";
}
type Block = HeadingBlock | ParagraphBlock | ListBlock | CodeBlock;

/** A parsed block plus the index of the first line after it. */
interface ParseResult {
  block: Block;
  next: number;
}

// ─── Regexes (top-level per Ultracite rules) ──────────────────────────────────

const H3_RE = /^###\s+(.+)$/;
const H2_RE = /^##\s+(.+)$/;
const H1_RE = /^#\s+(.+)$/;
const LIST_RE = /^[-*+]\s+(.+)$|^\d+\.\s+(.+)$/;
const CODE_FENCE_RE = /^```(\S*)$/;
const JSX_TAG_RE = /<[A-Z][a-zA-Z]*[\s/>]/;

const HEADING_PATTERNS = [
  { re: H3_RE, type: "h3" },
  { re: H2_RE, type: "h2" },
  { re: H1_RE, type: "h1" },
] as const;

// ─── Parser ────────────────────────────────────────────────────────────────────

function parseHeading(line: string, id: string): HeadingBlock | null {
  for (const { re, type } of HEADING_PATTERNS) {
    const match = line.match(re);
    if (match) {
      return { id, type, text: match[1].trim() };
    }
  }
  return null;
}

function parseCode(
  lines: string[],
  start: number,
  lang: string,
  id: string
): ParseResult {
  let i = start + 1;
  const codeLines: string[] = [];
  while (i < lines.length && !lines[i].startsWith("```")) {
    codeLines.push(lines[i]);
    i++;
  }
  return {
    block: { id, type: "code", lang, content: codeLines.join("\n") },
    next: i + 1, // skip closing fence
  };
}

function parseList(
  lines: string[],
  start: number,
  firstItem: string,
  id: string
): ParseResult {
  const items: ListItem[] = [{ id: `${id}-0`, text: firstItem }];
  let i = start + 1;
  while (i < lines.length) {
    const next = lines[i];
    if (next.trim() === "") {
      i++;
      continue;
    }
    const nextMatch = next.match(LIST_RE);
    if (!nextMatch) {
      break;
    }
    items.push({
      id: `${id}-${items.length}`,
      text: nextMatch[1] ?? nextMatch[2],
    });
    i++;
  }
  return { block: { id, type: "list", items }, next: i };
}

function startsNewBlock(line: string): boolean {
  return [H1_RE, H2_RE, H3_RE, LIST_RE, CODE_FENCE_RE].some((re) =>
    re.test(line)
  );
}

function parseParagraph(
  lines: string[],
  start: number,
  id: string
): ParseResult {
  const paraLines = [lines[start].trim()];
  let i = start + 1;
  while (
    i < lines.length &&
    lines[i].trim() !== "" &&
    !startsNewBlock(lines[i])
  ) {
    paraLines.push(lines[i].trim());
    i++;
  }
  return {
    block: { id, type: "paragraph", text: paraLines.join(" ") },
    next: i,
  };
}

function parseBlockAt(
  lines: string[],
  start: number,
  id: string
): ParseResult | null {
  const line = lines[start];

  const heading = parseHeading(line, id);
  if (heading) {
    return { block: heading, next: start + 1 };
  }

  const fence = line.match(CODE_FENCE_RE);
  if (fence) {
    return parseCode(lines, start, fence[1] || "text", id);
  }

  const listMatch = line.match(LIST_RE);
  if (listMatch) {
    return parseList(lines, start, listMatch[1] ?? listMatch[2], id);
  }

  if (line.trim() !== "") {
    return parseParagraph(lines, start, id);
  }

  return null;
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const result = parseBlockAt(lines, i, `block-${blocks.length}`);
    if (result) {
      blocks.push(result.block);
      i = result.next;
    } else {
      i++;
    }
  }

  return blocks;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function codeTitle(lang: string): string {
  const MAP: Record<string, string> = {
    typescript: "index.ts",
    ts: "index.ts",
    tsx: "index.tsx",
    javascript: "index.js",
    js: "index.js",
    jsx: "index.jsx",
    html: "index.html",
    xml: "index.xml",
    css: "styles.css",
  };
  return MAP[lang] ?? `code.${lang}`;
}

function h2Positions(blocks: Block[]): number[] {
  return blocks.flatMap((b, i) => (b.type === "h2" ? [i] : []));
}

function ListItems({ list }: { list: ListBlock }): ReactNode {
  return (
    <SlideList>
      {list.items.map((item) => (
        <SlideListItem key={item.id}>{item.text}</SlideListItem>
      ))}
    </SlideList>
  );
}

function ColumnContent({
  heading,
  body,
}: {
  heading: string;
  body: Block[];
}): ReactNode {
  return (
    <>
      <SlideSubtitle>{heading}</SlideSubtitle>
      {body.map((block) => {
        if (block.type === "paragraph" || block.type === "h3") {
          return <SlideNote key={block.id}>{block.text}</SlideNote>;
        }
        if (block.type === "list") {
          return <ListItems key={block.id} list={block} />;
        }
        return null;
      })}
    </>
  );
}

// ─── Layouts ──────────────────────────────────────────────────────────────────

interface SlideParts {
  body: Block[];
  codes: CodeBlock[];
  h1: HeadingBlock | null;
  h2s: HeadingBlock[];
  lists: ListBlock[];
  paragraphs: ParagraphBlock[];
}

function getSlideParts(blocks: Block[]): SlideParts {
  const h1Index = blocks.findIndex((b) => b.type === "h1");
  const h1 = h1Index >= 0 ? (blocks[h1Index] as HeadingBlock) : null;
  const body = h1Index >= 0 ? blocks.slice(h1Index + 1) : blocks;

  return {
    body,
    h1,
    h2s: body.filter((b) => b.type === "h2") as HeadingBlock[],
    lists: body.filter((b) => b.type === "list") as ListBlock[],
    codes: body.filter((b) => b.type === "code") as CodeBlock[],
    paragraphs: body.filter((b) => b.type === "paragraph") as ParagraphBlock[],
  };
}

/** Two-column: h1 + exactly 2 h2s. */
function renderTwoColumn({ h1, h2s, body }: SlideParts): ReactNode | null {
  if (!h1 || h2s.length !== 2) {
    return null;
  }
  const [i1, i2] = h2Positions(body);
  const leftBlocks = body.slice(i1 + 1, i2);
  const rightBlocks = body.slice(i2 + 1);

  return (
    <Slide align="left">
      <SlideTitle>{h1.text}</SlideTitle>
      <SlideColumns
        left={<ColumnContent body={leftBlocks} heading={h2s[0].text} />}
        right={<ColumnContent body={rightBlocks} heading={h2s[1].text} />}
      />
    </Slide>
  );
}

/** Title + code blocks. */
function renderTitleCode({
  h1,
  h2s,
  codes,
  paragraphs,
}: SlideParts): ReactNode | null {
  if (!h1 || codes.length === 0) {
    return null;
  }
  const subtitle = h2s[0]?.text ?? paragraphs[0]?.text;
  return (
    <Slide align="left">
      <SlideTitle>{h1.text}</SlideTitle>
      {subtitle && <SlideSubtitle>{subtitle}</SlideSubtitle>}
      {codes.map((c) => (
        <SlideCode key={c.id} title={codeTitle(c.lang)}>
          {c.content}
        </SlideCode>
      ))}
    </Slide>
  );
}

/** Title + lists. */
function renderTitleList({
  h1,
  h2s,
  lists,
  paragraphs,
}: SlideParts): ReactNode | null {
  if (!h1 || lists.length === 0) {
    return null;
  }
  const subtitle = h2s[0]?.text ?? paragraphs[0]?.text;
  return (
    <Slide align="left">
      <SlideTitle>{h1.text}</SlideTitle>
      {subtitle && <SlideSubtitle>{subtitle}</SlideSubtitle>}
      {lists.map((list) => (
        <ListItems key={list.id} list={list} />
      ))}
    </Slide>
  );
}

/** Statement list: no h1, multiple h2s. */
function renderStatementList({ h1, h2s, body }: SlideParts): ReactNode | null {
  if (h1 || h2s.length < 2) {
    return null;
  }
  const positions = h2Positions(body);
  return (
    <Slide align="left">
      <SlideStatementList>
        {positions.map((pos, n) => {
          const nextPos = positions[n + 1] ?? body.length;
          const heading = body[pos] as HeadingBlock;
          const desc = body
            .slice(pos + 1, nextPos)
            .find((b) => b.type === "paragraph") as ParagraphBlock | undefined;
          return (
            <SlideStatement
              description={desc?.text}
              key={heading.id}
              title={heading.text}
            />
          );
        })}
      </SlideStatementList>
    </Slide>
  );
}

/** Title + subtitle + optional note, or title only. */
function renderTitle({ h1, h2s, paragraphs }: SlideParts): ReactNode | null {
  if (!h1) {
    return null;
  }
  const subtitle = h2s[0]?.text ?? paragraphs[0]?.text;
  const minParagraphsForNote = h2s.length > 0 ? 0 : 1;
  const note =
    paragraphs.length > minParagraphsForNote
      ? paragraphs.at(-1)?.text
      : undefined;
  return (
    <Slide>
      <SlideTitle>{h1.text}</SlideTitle>
      {subtitle && <SlideSubtitle>{subtitle}</SlideSubtitle>}
      {note && note !== subtitle && <SlideNote>{note}</SlideNote>}
    </Slide>
  );
}

/** Statement: no h1, just paragraphs. */
function renderStatement({ paragraphs }: SlideParts): ReactNode | null {
  if (paragraphs.length === 0) {
    return null;
  }
  return (
    <Slide>
      <SlideTitle>{paragraphs[0].text}</SlideTitle>
      {paragraphs[1] && <SlideSubtitle>{paragraphs[1].text}</SlideSubtitle>}
    </Slide>
  );
}

const LAYOUTS = [
  renderTwoColumn,
  renderTitleCode,
  renderTitleList,
  renderStatementList,
  renderTitle,
  renderStatement,
];

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns true if the markdown already contains JSX component tags. */
export function hasMdxComponents(markdown: string): boolean {
  return JSX_TAG_RE.test(markdown);
}

/** Convert a single slide's plain markdown to a slide ReactNode. */
export function convertMarkdownToSlide(markdown: string): ReactNode {
  const parts = getSlideParts(parseBlocks(markdown));

  for (const layout of LAYOUTS) {
    const slide = layout(parts);
    if (slide !== null) {
      return slide;
    }
  }

  return (
    <Slide>
      <SlideTitle>{""}</SlideTitle>
    </Slide>
  );
}
