import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { type NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";

import { auth } from "@/lib/auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a presentation expert. Convert the following document into MDX presentation slides.
Use --- on its own line to separate slides. Use # for slide titles.
Use SlideCode blocks for any code samples. Return only the MDX content, no explanation.`;

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx")) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    return result.value;
  }

  if (name.endsWith(".pdf")) {
    const buffer = await file.arrayBuffer();
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      parts.push(
        content.items
          .map((item) => ("str" in item ? (item.str ?? "") : ""))
          .join(" ")
      );
    }
    return parts.join("\n\n");
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    const { read, utils } = await import("xlsx");
    const workbook = read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return utils.sheet_to_csv(sheet);
  }

  if (name.endsWith(".csv")) {
    const text = await file.text();
    const result = Papa.parse(text, { header: true });
    return JSON.stringify(result.data, null, 2);
  }

  if (name.endsWith(".html") || name.endsWith(".htm")) {
    const text = await file.text();
    return text
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return file.text();
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await extractText(file);

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${SYSTEM_PROMPT}\n\n---\n\n${text}`,
      },
    ],
  });

  const mdx = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  return NextResponse.json({ mdx });
}
