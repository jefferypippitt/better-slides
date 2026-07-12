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
  text: string;
  type: "h1" | "h2" | "h3";
}
interface ParagraphBlock {
  text: string;
  type: "paragraph";
}
interface ListBlock {
  items: string[];
  type: "list";
}
interface CodeBlock {
  content: string;
  lang: string;
  type: "code";
}
type Block = HeadingBlock | ParagraphBlock | ListBlock | CodeBlock;

// ─── Regexes (top-level per Ultracite rules) ──────────────────────────────────

const H3_RE = /^###\s+(.+)$/;
const H2_RE = /^##\s+(.+)$/;
const H1_RE = /^#\s+(.+)$/;
const LIST_RE = /^[-*+]\s+(.+)$|^\d+\.\s+(.+)$/;
const CODE_FENCE_RE = /^```(\S*)$/;
const JSX_TAG_RE = /<[A-Z][a-zA-Z]*[\s/>]/;

// ─── Parser ────────────────────────────────────────────────────────────────────

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const h3 = line.match(H3_RE);
    if (h3) {
      blocks.push({ type: "h3", text: h3[1].trim() });
      i++;
      continue;
    }

    const h2 = line.match(H2_RE);
    if (h2) {
      blocks.push({ type: "h2", text: h2[1].trim() });
      i++;
      continue;
    }

    const h1 = line.match(H1_RE);
    if (h1) {
      blocks.push({ type: "h1", text: h1[1].trim() });
      i++;
      continue;
    }

    const fence = line.match(CODE_FENCE_RE);
    if (fence) {
      const lang = fence[1] || "text";
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: "code", lang, content: codeLines.join("\n") });
      continue;
    }

    const listMatch = line.match(LIST_RE);
    if (listMatch) {
      const items: string[] = [listMatch[1] ?? listMatch[2]];
      i++;
      while (i < lines.length) {
        const next = lines[i];
        if (next.trim() === "") {
          i++;
          continue;
        }
        const nextMatch = next.match(LIST_RE);
        if (nextMatch) {
          items.push(nextMatch[1] ?? nextMatch[2]);
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: "list", items });
      continue;
    }

    if (line.trim() !== "") {
      const paraLines = [line.trim()];
      i++;
      while (i < lines.length && lines[i].trim() !== "") {
        const next = lines[i];
        if (
          next.match(H1_RE) ||
          next.match(H2_RE) ||
          next.match(H3_RE) ||
          next.match(LIST_RE) ||
          next.match(CODE_FENCE_RE)
        ) {
          break;
        }
        paraLines.push(next.trim());
        i++;
      }
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
      continue;
    }

    i++;
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
      {body.map((block, idx) => {
        if (block.type === "paragraph" || block.type === "h3") {
          return <SlideNote key={idx}>{block.text}</SlideNote>;
        }
        if (block.type === "list") {
          return (
            <SlideList key={idx}>
              {block.items.map((item, j) => (
                <SlideListItem key={j}>{item}</SlideListItem>
              ))}
            </SlideList>
          );
        }
        return null;
      })}
    </>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns true if the markdown already contains JSX component tags. */
export function hasMdxComponents(markdown: string): boolean {
  return JSX_TAG_RE.test(markdown);
}

/** Convert a single slide's plain markdown to a slide ReactNode. */
export function convertMarkdownToSlide(markdown: string): ReactNode {
  const blocks = parseBlocks(markdown);

  const h1Index = blocks.findIndex((b) => b.type === "h1");
  const h1 = h1Index >= 0 ? (blocks[h1Index] as HeadingBlock) : null;
  const body = h1Index >= 0 ? blocks.slice(h1Index + 1) : blocks;

  const h2s = body.filter((b) => b.type === "h2") as HeadingBlock[];
  const lists = body.filter((b) => b.type === "list") as ListBlock[];
  const codes = body.filter((b) => b.type === "code") as CodeBlock[];
  const paragraphs = body.filter(
    (b) => b.type === "paragraph"
  ) as ParagraphBlock[];

  // ── Two-column: h1 + exactly 2 h2s ─────────────────────────────────────
  if (h1 && h2s.length === 2) {
    const h2Indices = body.reduce<number[]>(
      (acc, b, i) => (b.type === "h2" ? [...acc, i] : acc),
      []
    );
    const [i1, i2] = h2Indices;
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

  // ── Title + Code ────────────────────────────────────────────────────────
  if (h1 && codes.length > 0) {
    const subtitle = h2s[0]?.text ?? paragraphs[0]?.text;
    return (
      <Slide align="left">
        <SlideTitle>{h1.text}</SlideTitle>
        {subtitle && <SlideSubtitle>{subtitle}</SlideSubtitle>}
        {codes.map((c, i) => (
          <SlideCode key={i} title={codeTitle(c.lang)}>
            {c.content}
          </SlideCode>
        ))}
      </Slide>
    );
  }

  // ── Title + List ────────────────────────────────────────────────────────
  if (h1 && lists.length > 0) {
    const subtitle = h2s[0]?.text ?? paragraphs[0]?.text;
    return (
      <Slide align="left">
        <SlideTitle>{h1.text}</SlideTitle>
        {subtitle && <SlideSubtitle>{subtitle}</SlideSubtitle>}
        {lists.map((list, li) => (
          <SlideList key={li}>
            {list.items.map((item, j) => (
              <SlideListItem key={j}>{item}</SlideListItem>
            ))}
          </SlideList>
        ))}
      </Slide>
    );
  }

  // ── Statement list: no h1, multiple h2s ─────────────────────────────────
  if (!h1 && h2s.length >= 2) {
    const h2Indices = blocks.reduce<number[]>(
      (acc, b, i) => (b.type === "h2" ? [...acc, i] : acc),
      []
    );
    return (
      <Slide align="left">
        <SlideStatementList>
          {h2Indices.map((idx, n) => {
            const nextIdx =
              n + 1 < h2Indices.length ? h2Indices[n + 1] : blocks.length;
            const desc = blocks
              .slice(idx + 1, nextIdx)
              .find((b) => b.type === "paragraph") as
              | ParagraphBlock
              | undefined;
            return (
              <SlideStatement
                description={desc?.text}
                key={idx}
                title={(blocks[idx] as HeadingBlock).text}
              />
            );
          })}
        </SlideStatementList>
      </Slide>
    );
  }

  // ── Title + Subtitle + optional note ────────────────────────────────────
  if (h1 && (h2s.length > 0 || paragraphs.length > 0)) {
    const subtitle = h2s[0]?.text ?? paragraphs[0]?.text;
    const note =
      paragraphs.length > (h2s.length > 0 ? 0 : 1)
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

  // ── Title only ──────────────────────────────────────────────────────────
  if (h1) {
    return (
      <Slide>
        <SlideTitle>{h1.text}</SlideTitle>
      </Slide>
    );
  }

  // ── Statement: no h1, just paragraphs ───────────────────────────────────
  if (paragraphs.length > 0) {
    return (
      <Slide>
        <SlideTitle>{paragraphs[0].text}</SlideTitle>
        {paragraphs[1] && <SlideSubtitle>{paragraphs[1].text}</SlideSubtitle>}
      </Slide>
    );
  }

  // ── Fallback ─────────────────────────────────────────────────────────────
  return (
    <Slide>
      <SlideTitle>{""}</SlideTitle>
    </Slide>
  );
}
