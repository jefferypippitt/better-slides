"use client";

import { ArrowSquareOut, Copy, QrCode, X } from "@phosphor-icons/react";
import Image from "next/image";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  TweetPreview,
  YoutubePreview,
} from "@/components/editor/embed-previews";
import { TextColorControl } from "@/components/editor/text-color-control";
import {
  getMdxComponentByName,
  resolveMdxComponents,
  type UploadedDeckWidget,
} from "@/components/mdx/component-registry";
import { Badge } from "@/components/ui/badge";
import {
  CORNER_RADIUS_CLASSES,
  CORNER_RADIUS_OPTIONS,
  type CornerRadius,
  DEFAULT_CORNER_RADIUS,
} from "@/lib/corner-radius";
import type { CanvasBox as DeckCanvasBox } from "@/lib/decks";
import { parseMarkdownSections } from "@/lib/sections";
import { SHAPE_CLIP_PATHS } from "@/lib/shapes";

export type { CanvasBox } from "@/lib/decks";

interface LayoutCanvasProps {
  initialLayout?: DeckCanvasBox[];
  mdx: string;
  notesPath?: string;
  onLayoutChange?: (layout: DeckCanvasBox[]) => void;
  qrPath?: string;
  showSectionsSidebar?: boolean;
  uploadedWidgets?: UploadedDeckWidget[];
}

type ResizeEdge = "e" | "s" | "se" | "sw" | "ne" | "nw" | "w" | "n";
type CanvasTextStyle = NonNullable<DeckCanvasBox["textStyle"]>;
type GridViewMode = "off" | "lines";
interface DragAlignmentState {
  active: boolean;
  xCentered: boolean;
  yCentered: boolean;
}
const CANVAS_TEXT_STYLE_ORDER: CanvasTextStyle[] = [
  "title",
  "subtitle",
  "body",
];
const SNAP_THRESHOLD = 1.25;
const CENTER_SNAP_THRESHOLD = 1.1;
const MIN_BOX_WIDTH = 15;
const MIN_BOX_HEIGHT = 10;
const PUBLIC_NOTES_BASE_URL = process.env.NEXT_PUBLIC_NOTES_BASE_URL?.trim();
const TRAILING_SLASH_RE = /\/+$/;
const HEADING_PREFIX_RE = /^#{1,6}\s+/;
const BULLET_LINE_RE = /^[-*+]\s+(.+)$/;
const NUMBERED_LINE_RE = /^\d+\.\s+(.+)$/;

function stripSectionHeading(content: string): string {
  const lines = content.split("\n");
  const first = lines[0]?.trimStart() ?? "";
  if (HEADING_PREFIX_RE.test(first)) {
    return lines.slice(1).join("\n").trim();
  }
  return content.trim();
}

function areLayoutsEqual(a: DeckCanvasBox[], b: DeckCanvasBox[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (const [index, boxA] of a.entries()) {
    const boxB = b[index];
    if (!boxB) {
      return false;
    }
    if (
      boxA.id !== boxB.id ||
      boxA.kind !== boxB.kind ||
      boxA.sectionId !== boxB.sectionId ||
      boxA.componentName !== boxB.componentName ||
      boxA.x !== boxB.x ||
      boxA.y !== boxB.y ||
      boxA.w !== boxB.w ||
      boxA.h !== boxB.h ||
      boxA.textStyle !== boxB.textStyle ||
      boxA.cornerRadius !== boxB.cornerRadius ||
      boxA.textColor !== boxB.textColor
    ) {
      return false;
    }
  }
  return true;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: canvas editor state and interactions are intentionally co-located.
export function LayoutCanvas({
  mdx,
  initialLayout,
  notesPath,
  qrPath,
  onLayoutChange,
  uploadedWidgets = [],
  showSectionsSidebar = true,
}: LayoutCanvasProps) {
  const components = useMemo(
    () => resolveMdxComponents(mdx, uploadedWidgets),
    [mdx, uploadedWidgets]
  );
  const sections = useMemo(() => parseMarkdownSections(mdx), [mdx]);
  const [boxes, setBoxes] = useState<DeckCanvasBox[]>(initialLayout ?? []);
  const [serializedSectionBodies, setSerializedSectionBodies] = useState<
    Record<string, MDXRemoteSerializeResult>
  >({});
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [copiedNotesLink, setCopiedNotesLink] = useState(false);
  const [_historyVersion, setHistoryVersion] = useState(0);
  const [gridViewMode, setGridViewMode] = useState<GridViewMode>("lines");
  const [gridSize, setGridSize] = useState<5 | 10 | 20>(10);
  const [centerGuidesEnabled, setCenterGuidesEnabled] = useState(true);
  const [dragAlignment, setDragAlignment] = useState<DragAlignmentState>({
    active: false,
    xCentered: false,
    yCentered: false,
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const boxesRef = useRef<DeckCanvasBox[]>(initialLayout ?? []);
  const historyRef = useRef<DeckCanvasBox[][]>([]);
  const historyIndexRef = useRef(0);
  const snapEnabled = gridViewMode !== "off";
  const selectedImageBox = boxes.find(
    (box) => box.id === selectedBoxId && box.kind === "image"
  );
  const selectedTextBox = boxes.find(
    (box) => box.id === selectedBoxId && box.kind === "text"
  );

  const notesUrl = useMemo(() => {
    if (!notesPath) {
      return null;
    }
    const fallbackOrigin =
      typeof window === "undefined" ? "" : window.location.origin;
    const baseUrl = PUBLIC_NOTES_BASE_URL || fallbackOrigin;
    if (!baseUrl) {
      return notesPath;
    }
    return `${baseUrl.replace(TRAILING_SLASH_RE, "")}${notesPath}`;
  }, [notesPath]);

  const qrImageUrl = useMemo(() => {
    if (!qrPath) {
      return null;
    }
    return qrPath;
  }, [qrPath]);

  function cloneLayout(layout: DeckCanvasBox[]): DeckCanvasBox[] {
    return layout.map((box) => ({ ...box }));
  }

  function clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  function snapValueToGrid(value: number): number {
    if (!snapEnabled) {
      return value;
    }
    const snapped = Math.round(value / gridSize) * gridSize;
    return Math.abs(snapped - value) <= SNAP_THRESHOLD ? snapped : value;
  }

  function snapMoveAxis(start: number, size: number): number {
    const center = start + size / 2;
    if (centerGuidesEnabled && Math.abs(center - 50) <= CENTER_SNAP_THRESHOLD) {
      return clampValue(50 - size / 2, 0, 100 - size);
    }
    const end = start + size;
    const snappedStart = snapValueToGrid(start);
    const snappedEnd = snapValueToGrid(end);
    const snapStartDelta = Math.abs(snappedStart - start);
    const snapEndDelta = Math.abs(snappedEnd - end);
    if (snapStartDelta <= SNAP_THRESHOLD || snapEndDelta <= SNAP_THRESHOLD) {
      const nextStart =
        snapStartDelta <= snapEndDelta ? snappedStart : snappedEnd - size;
      return clampValue(nextStart, 0, 100 - size);
    }
    return clampValue(start, 0, 100 - size);
  }

  function pushHistory(next: DeckCanvasBox[]) {
    const snapshot = cloneLayout(next);
    const base = historyRef.current.slice(0, historyIndexRef.current + 1);
    base.push(snapshot);
    historyRef.current = base;
    historyIndexRef.current = base.length - 1;
    setHistoryVersion((v) => v + 1);
  }

  function applyNextLayout(
    next: DeckCanvasBox[],
    options?: { trackHistory?: boolean }
  ) {
    const snapshot = cloneLayout(next);
    setBoxes(snapshot);
    if (options?.trackHistory ?? true) {
      pushHistory(snapshot);
    }
    onLayoutChange?.(snapshot);
  }

  useEffect(() => {
    boxesRef.current = boxes;
  }, [boxes]);

  useEffect(() => {
    const nextLayout = initialLayout ?? [];
    if (areLayoutsEqual(nextLayout, boxesRef.current)) {
      return;
    }
    const snapshot = nextLayout.map((box) => ({ ...box }));
    setBoxes(snapshot);
    historyRef.current = [snapshot.map((box) => ({ ...box }))];
    historyIndexRef.current = 0;
    setHistoryVersion((v) => v + 1);
  }, [initialLayout]);

  useEffect(() => {
    let cancelled = false;
    async function serializeSectionBodies() {
      const entries = await Promise.all(
        sections.map(async (section) => {
          const body = stripSectionHeading(section.content);
          if (!body) {
            return null;
          }
          try {
            const serialized = await serialize(body, {
              parseFrontmatter: false,
            });
            return [section.id, serialized] as const;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) {
        return;
      }
      const next: Record<string, MDXRemoteSerializeResult> = {};
      for (const entry of entries) {
        if (!entry) {
          continue;
        }
        const [id, serialized] = entry;
        next[id] = serialized;
      }
      setSerializedSectionBodies(next);
    }
    serializeSectionBodies();
    return () => {
      cancelled = true;
    };
  }, [sections]);

  useEffect(() => {
    if (!selectedBoxId) {
      return;
    }
    const stillExists = boxes.some((box) => box.id === selectedBoxId);
    if (!stillExists) {
      setSelectedBoxId(null);
    }
  }, [boxes, selectedBoxId]);

  function commit(next: DeckCanvasBox[], options?: { trackHistory?: boolean }) {
    applyNextLayout(next, options);
  }

  function canUndo(): boolean {
    return historyIndexRef.current > 0;
  }

  function canBringForward(): boolean {
    if (!selectedBoxId) {
      return false;
    }
    const index = boxesRef.current.findIndex((box) => box.id === selectedBoxId);
    return index >= 0 && index < boxesRef.current.length - 1;
  }

  function canSendBackward(): boolean {
    if (!selectedBoxId) {
      return false;
    }
    const index = boxesRef.current.findIndex((box) => box.id === selectedBoxId);
    return index > 0;
  }

  function undo() {
    if (!canUndo()) {
      return;
    }
    historyIndexRef.current -= 1;
    const prev = cloneLayout(historyRef.current[historyIndexRef.current] ?? []);
    setBoxes(prev);
    boxesRef.current = prev;
    onLayoutChange?.(prev);
    setHistoryVersion((v) => v + 1);
  }

  function bringForward() {
    if (!selectedBoxId) {
      return;
    }
    const current = cloneLayout(boxesRef.current);
    const index = current.findIndex((box) => box.id === selectedBoxId);
    if (index < 0 || index >= current.length - 1) {
      return;
    }
    const next = [...current];
    const selected = next[index];
    const after = next[index + 1];
    next[index] = after;
    next[index + 1] = selected;
    applyNextLayout(next);
  }

  function sendBackward() {
    if (!selectedBoxId) {
      return;
    }
    const current = cloneLayout(boxesRef.current);
    const index = current.findIndex((box) => box.id === selectedBoxId);
    if (index <= 0) {
      return;
    }
    const next = [...current];
    const selected = next[index];
    const before = next[index - 1];
    next[index] = before;
    next[index - 1] = selected;
    applyNextLayout(next);
  }

  function resetLayout() {
    commit([]);
    setSelectedBoxId(null);
  }

  async function handleCopyNotesLink() {
    if (!notesUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(notesUrl);
      setCopiedNotesLink(true);
      setTimeout(() => setCopiedNotesLink(false), 1800);
    } catch {
      setCopiedNotesLink(false);
    }
  }

  function nextTextStyle(current: CanvasTextStyle): CanvasTextStyle {
    const currentIndex = CANVAS_TEXT_STYLE_ORDER.indexOf(current);
    const nextIndex = (currentIndex + 1) % CANVAS_TEXT_STYLE_ORDER.length;
    return CANVAS_TEXT_STYLE_ORDER[nextIndex] ?? "body";
  }

  function getTextStyleClasses(textStyle: CanvasTextStyle): string {
    if (textStyle === "title") {
      return "text-[clamp(2rem,6cqw,6rem)] font-bold leading-[0.95] tracking-tight";
    }
    if (textStyle === "subtitle") {
      return "text-[clamp(1.25rem,3.5cqw,2.8rem)] font-semibold leading-tight tracking-tight";
    }
    return "text-[clamp(1rem,2cqw,1.5rem)] font-medium leading-snug tracking-normal";
  }

  function getTextStyleLabel(textStyle: CanvasTextStyle): string {
    if (textStyle === "title") {
      return "Title";
    }
    if (textStyle === "subtitle") {
      return "Subtitle";
    }
    return "Body";
  }

  function parseBodyContent(content: string): {
    paragraphs: string[];
    listItems: string[];
  } {
    const raw = stripSectionHeading(content);
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line !== "---");
    const listItems = lines
      .map((line) => {
        const listMatch =
          line.match(BULLET_LINE_RE) ?? line.match(NUMBERED_LINE_RE);
        return listMatch?.[1]?.trim();
      })
      .filter((item): item is string => Boolean(item));
    const hasOnlyListLines =
      lines.length > 0 && listItems.length === lines.length;
    if (hasOnlyListLines) {
      return { paragraphs: [], listItems };
    }
    return { paragraphs: raw ? [raw] : [], listItems: [] };
  }

  function createBox(
    sectionId: string,
    x: number,
    y: number,
    w: number,
    h: number
  ): DeckCanvasBox {
    return {
      id: `box-${Date.now()}`,
      kind: "section",
      sectionId,
      x,
      y,
      w,
      h,
      textStyle: "body",
    };
  }

  function insertSection(sectionId: string) {
    const prev = boxesRef.current;
    const stagger = prev.length * 3;
    const next = [
      ...prev,
      createBox(
        sectionId,
        Math.min(5 + stagger, 50),
        Math.min(5 + stagger, 50),
        40,
        36
      ),
    ];
    applyNextLayout(next);
  }

  function removeBox(id: string) {
    const next = boxesRef.current.filter((box) => box.id !== id);
    applyNextLayout(next);
    setSelectedBoxId((current) => (current === id ? null : current));
  }

  function cycleBoxTextStyle(boxId: string) {
    const next = boxesRef.current.map((box) => {
      if (box.id !== boxId) {
        return box;
      }
      const currentStyle: CanvasTextStyle = box.textStyle ?? "body";
      return { ...box, textStyle: nextTextStyle(currentStyle) };
    });
    applyNextLayout(next);
  }

  function setBoxCornerRadius(boxId: string, cornerRadius: CornerRadius) {
    const next = boxesRef.current.map((box) =>
      box.id === boxId ? { ...box, cornerRadius } : box
    );
    applyNextLayout(next);
  }

  function setBoxTextColor(
    boxId: string,
    textColor: string | undefined,
    options?: { trackHistory?: boolean }
  ) {
    const next = boxesRef.current.map((box) =>
      box.id === boxId ? { ...box, textColor } : box
    );
    applyNextLayout(next, options);
  }

  /** Records one undo step after live edits made without history (e.g. dragging in the color picker). */
  function commitPendingHistory() {
    const lastSnapshot = historyRef.current[historyIndexRef.current];
    if (lastSnapshot && areLayoutsEqual(lastSnapshot, boxesRef.current)) {
      return;
    }
    pushHistory(boxesRef.current);
  }

  function getCornerResizeClass(edge: ResizeEdge): string {
    if (edge === "nw") {
      return "-top-1.5 -left-1.5 cursor-nw-resize";
    }
    if (edge === "ne") {
      return "-top-1.5 -right-1.5 cursor-ne-resize";
    }
    if (edge === "sw") {
      return "-bottom-1.5 -left-1.5 cursor-sw-resize";
    }
    return "-right-1.5 -bottom-1.5 cursor-se-resize";
  }

  function getEdgeResizeClass(edge: ResizeEdge): string {
    if (edge === "n") {
      return "-top-1 right-[10%] left-[10%] h-2 cursor-n-resize";
    }
    if (edge === "s") {
      return "right-[10%] -bottom-1 left-[10%] h-2 cursor-s-resize";
    }
    if (edge === "e") {
      return "top-[10%] -right-1 bottom-[10%] w-2 cursor-e-resize";
    }
    return "top-[10%] bottom-[10%] -left-1 w-2 cursor-w-resize";
  }

  // ── Move existing box ──────────────────────────────────────────────────────
  function startMove(e: React.MouseEvent<HTMLElement>, boxId: string) {
    if ((e.target as HTMLElement).closest("[data-nodrag]")) {
      return;
    }
    e.preventDefault();
    setSelectedBoxId(boxId);

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();

    const box = boxes.find((b) => b.id === boxId);
    if (!box) {
      return;
    }

    const origX = box.x;
    const origY = box.y;
    const boxWidth = box.w;
    const boxHeight = box.h;
    const sx = e.clientX;
    const sy = e.clientY;
    setDragAlignment({ active: true, xCentered: false, yCentered: false });

    function onMove(ev: MouseEvent) {
      const dx = ((ev.clientX - sx) / rect.width) * 100;
      const dy = ((ev.clientY - sy) / rect.height) * 100;
      const nextX = snapMoveAxis(origX + dx, boxWidth);
      const nextY = snapMoveAxis(origY + dy, boxHeight);
      const centerX = nextX + boxWidth / 2;
      const centerY = nextY + boxHeight / 2;
      setDragAlignment({
        active: true,
        xCentered: Math.abs(centerX - 50) <= CENTER_SNAP_THRESHOLD,
        yCentered: Math.abs(centerY - 50) <= CENTER_SNAP_THRESHOLD,
      });
      setBoxes((cur) => {
        const next = cur.map((b) =>
          b.id === boxId ? { ...b, x: nextX, y: nextY } : b
        );
        boxesRef.current = next;
        return next;
      });
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const current = cloneLayout(boxesRef.current);
      pushHistory(current);
      onLayoutChange?.(current);
      setDragAlignment({ active: false, xCentered: false, yCentered: false });
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function resizeBoxFromDrag(
    box: DeckCanvasBox,
    targetId: string,
    edge: ResizeEdge,
    ox: number,
    oy: number,
    ow: number,
    oh: number,
    dx: number,
    dy: number
  ): DeckCanvasBox {
    if (box.id !== targetId) {
      return box;
    }
    let x = ox;
    let y = oy;
    let w = ow;
    let h = oh;

    if (edge.includes("e")) {
      w = Math.max(MIN_BOX_WIDTH, Math.min(100 - ox, ow + dx));
    }
    if (edge.includes("s")) {
      h = Math.max(MIN_BOX_HEIGHT, Math.min(100 - oy, oh + dy));
    }
    if (edge.includes("w")) {
      const nw = Math.max(MIN_BOX_WIDTH, ow - dx);
      x = ox + ow - nw;
      w = nw;
    }
    if (edge.includes("n")) {
      const nh = Math.max(MIN_BOX_HEIGHT, oh - dy);
      y = oy + oh - nh;
      h = nh;
    }

    let left = x;
    let top = y;
    let right = x + w;
    let bottom = y + h;

    if (edge.includes("e")) {
      right = clampValue(snapValueToGrid(right), left + MIN_BOX_WIDTH, 100);
    }
    if (edge.includes("s")) {
      bottom = clampValue(snapValueToGrid(bottom), top + MIN_BOX_HEIGHT, 100);
    }
    if (edge.includes("w")) {
      left = clampValue(snapValueToGrid(left), 0, right - MIN_BOX_WIDTH);
    }
    if (edge.includes("n")) {
      top = clampValue(snapValueToGrid(top), 0, bottom - MIN_BOX_HEIGHT);
    }

    x = left;
    y = top;
    w = right - left;
    h = bottom - top;
    return { ...box, x, y, w, h };
  }

  // ── Resize box ────────────────────────────────────────────────────────────
  function startResize(e: React.MouseEvent, boxId: string, edge: ResizeEdge) {
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();

    const box = boxes.find((b) => b.id === boxId);
    if (!box) {
      return;
    }

    const { x: ox, y: oy, w: ow, h: oh } = box;
    const sx = e.clientX;
    const sy = e.clientY;

    function onMove(ev: MouseEvent) {
      const dx = ((ev.clientX - sx) / rect.width) * 100;
      const dy = ((ev.clientY - sy) / rect.height) * 100;

      setBoxes((cur) => {
        const next = cur.map((b) =>
          resizeBoxFromDrag(b, boxId, edge, ox, oy, ow, oh, dx, dy)
        );
        boxesRef.current = next;
        return next;
      });
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const current = cloneLayout(boxesRef.current);
      pushHistory(current);
      onLayoutChange?.(current);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // ── Drag from sidebar ────────────────────────────────────────────────────
  function handleSidebarDragStart(
    e: React.DragEvent<HTMLElement>,
    sectionId: string
  ) {
    e.dataTransfer.setData("text/plain", sectionId);
    e.dataTransfer.effectAllowed = "copy";
  }

  function handleCanvasDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverCanvas(true);
  }

  function handleCanvasDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!canvasRef.current?.contains(e.relatedTarget as Node)) {
      setDragOverCanvas(false);
    }
  }

  function handleCanvasDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOverCanvas(false);

    const sectionId = e.dataTransfer.getData("text/plain");
    if (!sectionId) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const dropX = ((e.clientX - rect.left) / rect.width) * 100;
    const dropY = ((e.clientY - rect.top) / rect.height) * 100;

    const next = [
      ...boxesRef.current,
      createBox(
        sectionId,
        Math.max(0, Math.min(60, dropX - 20)),
        Math.max(0, Math.min(64, dropY - 18)),
        40,
        36
      ),
    ];
    applyNextLayout(next);
  }

  const noSections = sections.length === 0;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ── Sections sidebar ─────────────────────────────────────────────── */}
      {showSectionsSidebar && (
        <aside className="flex w-64 shrink-0 flex-col border-r bg-background">
          <div className="border-b px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-widest">
                Sections
              </p>
            </div>
          </div>

          <div className="no-scrollbar flex flex-col gap-1.5 overflow-y-auto p-3">
            {noSections && (
              <p className="px-1 text-[11px] text-muted-foreground">
                Write <strong># to ####</strong> headings in your markdown to
                see sections here.
              </p>
            )}
            {sections.map((section, index) => (
              <button
                className="cursor-grab select-none rounded-md border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing active:opacity-70"
                draggable
                key={section.id}
                onClick={() => insertSection(section.id)}
                onDragStart={(e) => handleSidebarDragStart(e, section.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    insertSection(section.id);
                  }
                }}
                type="button"
              >
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="min-w-0 flex-1 truncate font-semibold text-xs">
                    {section.heading}
                  </span>
                </div>
                <p className="line-clamp-2 text-[9px] text-muted-foreground leading-relaxed">
                  {section.content
                    .replace(/^#+\s*/gm, "")
                    .trim()
                    .slice(0, 100)}
                </p>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* ── Canvas (16:9 preview, 1-to-1 with presentation) ─────────── */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.75 text-[10px] text-muted-foreground">
          <span className="font-medium">Grid</span>
          <div className="flex items-center gap-1">
            <button
              className={`rounded px-1.5 py-0.5 ${
                gridViewMode === "off"
                  ? "bg-muted text-foreground"
                  : "hover:bg-muted/80"
              }`}
              onClick={() => setGridViewMode("off")}
              type="button"
            >
              Off
            </button>
            <button
              className={`rounded px-1.5 py-0.5 ${
                gridViewMode === "lines"
                  ? "bg-muted text-foreground"
                  : "hover:bg-muted/80"
              }`}
              onClick={() => setGridViewMode("lines")}
              type="button"
            >
              Lines
            </button>
          </div>
          <div className="mx-1 h-3.5 w-px bg-border" />
          <div className="flex items-center gap-1">
            {([5, 10, 20] as const).map((size) => (
              <button
                className={`rounded px-1.5 py-0.5 ${
                  gridSize === size
                    ? "bg-muted text-foreground"
                    : "hover:bg-muted/80"
                }`}
                key={size}
                onClick={() => setGridSize(size)}
                type="button"
              >
                {size}
              </button>
            ))}
          </div>
          <div className="mx-1 h-3.5 w-px bg-border" />
          <span className="font-medium">Center Axes</span>
          <button
            className={`rounded px-1.5 py-0.5 ${
              centerGuidesEnabled
                ? "bg-muted text-foreground"
                : "hover:bg-muted/80"
            }`}
            onClick={() => setCenterGuidesEnabled((prev) => !prev)}
            type="button"
          >
            {centerGuidesEnabled ? "On" : "Off"}
          </button>
          <div className="mx-1 h-3.5 w-px bg-border" />
          <button
            className="rounded px-1.5 py-0.5 hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canUndo()}
            onClick={undo}
            type="button"
          >
            Undo
          </button>
          <button
            className="rounded px-1.5 py-0.5 hover:bg-muted/80"
            onClick={resetLayout}
            type="button"
          >
            Reset
          </button>
          <div className="mx-1 h-3.5 w-px bg-border" />
          <button
            className="rounded px-1.5 py-0.5 hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canBringForward()}
            onClick={bringForward}
            type="button"
          >
            Bring forward
          </button>
          <button
            className="rounded px-1.5 py-0.5 hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canSendBackward()}
            onClick={sendBackward}
            type="button"
          >
            Send backward
          </button>
          {selectedImageBox && (
            <>
              <div className="mx-1 h-3.5 w-px bg-border" />
              <span className="font-medium">Corners</span>
              <div className="flex items-center gap-1">
                {CORNER_RADIUS_OPTIONS.map((option) => {
                  const isActive =
                    (selectedImageBox.cornerRadius ?? DEFAULT_CORNER_RADIUS) ===
                    option.value;
                  return (
                    <button
                      aria-pressed={isActive}
                      className={`rounded px-1.5 py-0.5 ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "hover:bg-muted/80"
                      }`}
                      key={option.value}
                      onClick={() =>
                        setBoxCornerRadius(selectedImageBox.id, option.value)
                      }
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {selectedTextBox && (
            <>
              <div className="mx-1 h-3.5 w-px bg-border" />
              <TextColorControl
                onCommit={commitPendingHistory}
                onSelect={(color, { live }) =>
                  setBoxTextColor(selectedTextBox.id, color, {
                    trackHistory: !live,
                  })
                }
                value={selectedTextBox.textColor}
              />
            </>
          )}
          <span className="ml-auto opacity-50">
            {boxes.length} node{boxes.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Letterbox: maintains 16:9 ratio matching the presentation viewport */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/30 p-4">
          <div className="relative aspect-video max-h-full w-full shadow-xl ring-1 ring-border/50">
            <div className="absolute -top-10 right-0 z-30 flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                {notesPath && (
                  <a
                    className="flex h-6 items-center gap-1.5 rounded-sm border border-border/70 bg-background px-2 text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-muted/70 hover:text-foreground"
                    href={notesPath}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ArrowSquareOut size={12} />
                    Open notes
                  </a>
                )}
                <details className="relative">
                  <summary className="flex h-6 cursor-pointer list-none items-center gap-1.5 rounded-sm border border-border/70 bg-background px-2 text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-muted/70 hover:text-foreground">
                    <QrCode size={12} />
                    Notes QR
                  </summary>
                  <div className="absolute top-7 right-0 w-72 rounded-md border bg-popover p-2.5 text-popover-foreground shadow-md">
                    {qrImageUrl && notesPath && notesUrl ? (
                      <>
                        <p className="mb-2 font-medium text-[10px] text-muted-foreground">
                          Presenter notes (owner only)
                        </p>
                        <div className="mb-2 flex justify-center rounded border bg-white p-2">
                          <Image
                            alt="QR code for presenter notes"
                            height={176}
                            src={qrImageUrl}
                            unoptimized
                            width={176}
                          />
                        </div>
                        <code className="block break-all rounded bg-muted px-2 py-1 text-[10px]">
                          {notesUrl}
                        </code>
                        <div className="mt-2 flex items-center gap-1.5">
                          <a
                            className="inline-flex h-7 items-center rounded bg-primary px-2 font-medium text-[10px] text-primary-foreground"
                            href={notesPath}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Open notes
                          </a>
                          <button
                            className="inline-flex h-7 items-center gap-1 rounded border px-2 text-[10px]"
                            onClick={handleCopyNotesLink}
                            type="button"
                          >
                            <Copy size={10} />
                            {copiedNotesLink ? "Copied" : "Copy link"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        Save this deck first to generate a notes QR code.
                      </p>
                    )}
                  </div>
                </details>
              </div>
            </div>

            {/* Top chrome mock (h-11 = 44px matches presentation top-11) */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-11 items-center justify-end border-border/30 border-b bg-background/90 px-3">
              <span className="text-[9px] text-muted-foreground/40">
                live view
              </span>
            </div>

            {/* Canvas surface — coords 0-100% match the presentation content area exactly */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: drop surface requires drag events. */}
            {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: drop surface requires drag events. */}
            <div
              className={`@container absolute inset-x-0 top-11 bottom-11 bg-white dark:bg-neutral-900 ${
                dragOverCanvas ? "ring-2 ring-primary ring-inset" : ""
              }`}
              onDragLeave={handleCanvasDragLeave}
              onDragOver={handleCanvasDragOver}
              onDrop={handleCanvasDrop}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedBoxId(null);
                }
              }}
              ref={canvasRef}
            >
              {/* grid */}
              {gridViewMode !== "off" && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right,currentColor 1px,transparent 1px),linear-gradient(to bottom,currentColor 1px,transparent 1px)",
                    backgroundSize: `${gridSize}% ${gridSize}%`,
                  }}
                />
              )}
              {centerGuidesEnabled && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-primary/15"
                />
              )}
              {centerGuidesEnabled && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-primary/15"
                />
              )}
              {centerGuidesEnabled &&
                dragAlignment.active &&
                dragAlignment.xCentered && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-px -translate-x-1/2"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, rgb(59 130 246) 0 4px, transparent 4px 8px)",
                    }}
                  />
                )}
              {centerGuidesEnabled &&
                dragAlignment.active &&
                dragAlignment.yCentered && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-1/2 z-30 h-px -translate-y-1/2"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to right, rgb(239 68 68) 0 4px, transparent 4px 8px)",
                    }}
                  />
                )}

              {/* empty state */}
              {boxes.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="text-[11px] text-muted-foreground/50">
                    Drag or click a section to add it here
                  </p>
                </div>
              )}

              {/* nodes */}
              {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex rendering is intentional for editor canvas nodes. */}
              {boxes.map((box) => {
                const isSeparator = box.kind === "separator";
                const isComponent = box.kind === "component";
                const isImage = box.kind === "image";
                const isYoutube = box.kind === "youtube";
                const isTwitter = box.kind === "twitter";
                const isShape = box.kind === "shape";
                const isText = box.kind === "text";
                const isPageNumber = box.kind === "page-number";
                const isTimer = box.kind === "timer";
                const isQrCode = box.kind === "qr-code";
                const isUrlQr = box.kind === "url-qr";
                const isDecorative =
                  isImage ||
                  isYoutube ||
                  isTwitter ||
                  isShape ||
                  isText ||
                  isPageNumber ||
                  isTimer ||
                  isQrCode ||
                  isUrlQr;
                const section =
                  isSeparator || isDecorative
                    ? undefined
                    : sections.find(
                        (s, i) =>
                          s.id === box.sectionId ||
                          `s${i}-${s.id.slice(0, 30)}` === box.sectionId
                      );
                const Component = isComponent
                  ? getMdxComponentByName(
                      box.componentName ?? "",
                      uploadedWidgets
                    )
                  : null;
                const isOrphaned = !(
                  isSeparator ||
                  isComponent ||
                  isDecorative ||
                  section
                );
                const textStyle: CanvasTextStyle = box.textStyle ?? "body";
                const sectionHeading = section?.heading ?? "";
                const bodyContent = parseBodyContent(section?.content ?? "");
                const serializedBody = section
                  ? serializedSectionBodies[section.id]
                  : undefined;
                const attachedComponentName = box.componentName?.trim();
                const AttachedSectionComponent =
                  attachedComponentName &&
                  !(isSeparator || isComponent || isOrphaned)
                    ? getMdxComponentByName(
                        attachedComponentName,
                        uploadedWidgets
                      )
                    : null;
                let bodyContentNode: ReactNode = (
                  <p className="wrap-break-word text-[clamp(0.85rem,1.5cqw,1.2rem)] text-muted-foreground leading-snug">
                    {bodyContent.paragraphs[0]}
                  </p>
                );
                if (serializedBody) {
                  bodyContentNode = (
                    <div className="text-[clamp(0.85rem,1.5cqw,1.2rem)] text-muted-foreground leading-snug [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-[0.9em] [&_em]:text-muted-foreground [&_li]:mb-0.5 [&_ol]:text-muted-foreground [&_p]:text-muted-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted-foreground">
                      <MDXRemote {...serializedBody} components={components} />
                    </div>
                  );
                } else if (bodyContent.listItems.length > 0) {
                  bodyContentNode = (
                    <ul className="list-disc space-y-1 pl-5 text-[clamp(0.85rem,1.5cqw,1.2rem)] text-muted-foreground leading-snug">
                      {bodyContent.listItems.map((item) => (
                        <li className="wrap-break-word" key={item}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  // biome-ignore lint/a11y/noStaticElementInteractions: drag/resize surface is pointer-driven with nested controls.
                  // biome-ignore lint/a11y/noNoninteractiveElementInteractions: this container intentionally handles drag initiation.
                  <div
                    className={`group absolute cursor-grab overflow-visible rounded-md active:cursor-grabbing ${
                      box.id === selectedBoxId ? "ring-2 ring-primary/80" : ""
                    } ${
                      isOrphaned
                        ? "border border-amber-400/70 bg-amber-50/80 dark:bg-amber-950/30"
                        : ""
                    }`}
                    key={box.id}
                    onMouseDown={(e) => startMove(e, box.id)}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.w}%`,
                      height: `${box.h}%`,
                    }}
                  >
                    <button
                      aria-label="Remove markdown block"
                      className="absolute top-1 right-1 z-20 rounded-sm bg-background/90 p-0.5 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                      data-nodrag
                      onClick={() => removeBox(box.id)}
                      type="button"
                    >
                      <X size={11} />
                    </button>
                    {!(
                      isOrphaned ||
                      isSeparator ||
                      isComponent ||
                      isDecorative ||
                      attachedComponentName
                    ) && (
                      <button
                        aria-label="Cycle text style"
                        className="absolute top-1 left-1 z-20 rounded-sm bg-background/90 px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100"
                        data-nodrag
                        onClick={() => cycleBoxTextStyle(box.id)}
                        type="button"
                      >
                        {getTextStyleLabel(textStyle)}
                      </button>
                    )}

                    <div className="relative z-10 h-full overflow-hidden p-2.5">
                      {isOrphaned && (
                        <p className="mb-1 rounded-sm bg-amber-100 px-1.5 py-1 text-[10px] text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
                          Orphaned node: matching <code>##</code> section not
                          found.
                        </p>
                      )}
                      {isSeparator && (
                        <div
                          className={`flex h-full w-full ${
                            box.h > box.w ? "justify-center" : "items-center"
                          }`}
                        >
                          <div
                            className={`rounded-full bg-foreground/70 ${
                              box.h > box.w
                                ? "h-full w-[3px]"
                                : "h-[3px] w-full"
                            }`}
                          />
                        </div>
                      )}
                      {isComponent && (
                        <div className="h-full w-full overflow-auto text-foreground">
                          {Component ? (
                            <Component />
                          ) : (
                            <p className="mb-1 rounded-sm bg-amber-100 px-1.5 py-1 text-[10px] text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
                              Unknown component:{" "}
                              <code>{box.componentName}</code>
                            </p>
                          )}
                        </div>
                      )}
                      {isImage && (
                        <div
                          className={`h-full w-full overflow-hidden ${CORNER_RADIUS_CLASSES[box.cornerRadius ?? DEFAULT_CORNER_RADIUS]}`}
                        >
                          {box.imageUrl ? (
                            // biome-ignore lint/performance/noImgElement: user-provided external URLs require img tag
                            // biome-ignore lint/correctness/useImageSize: dimensions are controlled via CSS for user-provided URLs
                            <img
                              alt=""
                              className="h-full w-full object-cover"
                              src={box.imageUrl}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded border border-muted-foreground/40 border-dashed text-[10px] text-muted-foreground">
                              No URL set
                            </div>
                          )}
                        </div>
                      )}
                      {isYoutube && (
                        <div className="h-full w-full overflow-hidden rounded">
                          {box.youtubeUrl ? (
                            <YoutubePreview url={box.youtubeUrl} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded border border-muted-foreground/40 border-dashed text-[10px] text-muted-foreground">
                              No URL set
                            </div>
                          )}
                        </div>
                      )}
                      {isTwitter && (
                        <div className="h-full w-full overflow-hidden rounded">
                          {box.twitterUrl ? (
                            <TweetPreview url={box.twitterUrl} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded border border-muted-foreground/40 border-dashed text-[10px] text-muted-foreground">
                              No URL set
                            </div>
                          )}
                        </div>
                      )}
                      {isShape && (
                        <div
                          className={`h-full w-full ${box.shapeType === "circle" ? "rounded-full" : "rounded-sm"}`}
                          style={{
                            backgroundColor: box.shapeColor ?? "#818cf8",
                            clipPath: box.shapeType
                              ? SHAPE_CLIP_PATHS[box.shapeType]
                              : undefined,
                          }}
                        />
                      )}
                      {isText && (
                        <div className="h-full w-full overflow-hidden">
                          <p
                            className={`wrap-break-word ${getTextStyleClasses(box.textStyle ?? "subtitle")}`}
                            style={{ color: box.textColor }}
                          >
                            {box.staticText || "Text box"}
                          </p>
                        </div>
                      )}
                      {isPageNumber && (
                        <div className="flex h-full w-full items-center justify-center font-mono text-[clamp(0.75rem,2cqw,1.5rem)] text-foreground/70">
                          1 / N
                        </div>
                      )}
                      {isTimer && (
                        <div className="flex h-full w-full items-center justify-center font-mono text-[clamp(0.75rem,2cqw,1.5rem)] text-foreground/70">
                          00:00
                        </div>
                      )}
                      {isQrCode && (
                        <div className="flex h-full w-full items-center justify-center">
                          {qrImageUrl ? (
                            <Image
                              alt="Notes QR code"
                              className="h-full w-full object-contain"
                              height={200}
                              src={qrImageUrl}
                              unoptimized
                              width={200}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded border border-muted-foreground/40 border-dashed text-[10px] text-muted-foreground">
                              Save deck for QR
                            </div>
                          )}
                        </div>
                      )}
                      {isUrlQr && (
                        <div className="flex h-full w-full items-center justify-center">
                          {box.customQrUrl ? (
                            <Image
                              alt="QR code"
                              className="h-full w-full object-contain"
                              height={200}
                              src={`/api/qr?url=${encodeURIComponent(box.customQrUrl)}`}
                              unoptimized
                              width={200}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded border border-muted-foreground/40 border-dashed text-[10px] text-muted-foreground">
                              No URL set
                            </div>
                          )}
                        </div>
                      )}
                      {!(
                        isOrphaned ||
                        isSeparator ||
                        isComponent ||
                        isDecorative
                      ) &&
                        attachedComponentName && (
                          <div className="h-full w-full overflow-auto text-foreground">
                            <p className="mb-2 text-[10px] text-muted-foreground uppercase tracking-wide">
                              {sectionHeading}
                              {" · "}
                              {attachedComponentName}
                            </p>
                            {AttachedSectionComponent ? (
                              <AttachedSectionComponent />
                            ) : (
                              <p className="rounded-sm bg-amber-100 px-1.5 py-1 text-[10px] text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
                                Unknown component:{" "}
                                <code>{attachedComponentName}</code>
                              </p>
                            )}
                          </div>
                        )}
                      {!(
                        isOrphaned ||
                        isSeparator ||
                        isComponent ||
                        isDecorative ||
                        attachedComponentName
                      ) && (
                        <div className="h-full w-full overflow-auto text-foreground">
                          {textStyle === "body" ? (
                            <div className="space-y-2">
                              <p className="wrap-break-word font-semibold text-[clamp(1rem,2cqw,1.5rem)] leading-tight">
                                {sectionHeading}
                              </p>
                              {bodyContentNode}
                            </div>
                          ) : (
                            <p
                              className={`wrap-break-word h-full w-full select-none ${getTextStyleClasses(textStyle)}`}
                            >
                              {sectionHeading}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* resize corner handles */}
                    {(["nw", "ne", "sw", "se"] as ResizeEdge[]).map((edge) => (
                      <button
                        aria-label={`Resize ${edge}`}
                        className={`absolute z-10 h-2.5 w-2.5 rounded-sm border-2 border-blue-500 bg-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-700 ${getCornerResizeClass(
                          edge
                        )}`}
                        data-nodrag
                        key={edge}
                        onMouseDown={(e) => startResize(e, box.id, edge)}
                        type="button"
                      />
                    ))}
                    {/* resize edge handles */}
                    {(["n", "s", "e", "w"] as ResizeEdge[]).map((edge) => (
                      <button
                        aria-label={`Resize ${edge}`}
                        className={`absolute z-10 opacity-0 transition-opacity group-hover:opacity-100 ${getEdgeResizeClass(
                          edge
                        )}`}
                        data-nodrag
                        key={edge}
                        onMouseDown={(e) => startResize(e, box.id, edge)}
                        type="button"
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Bottom chrome mock (h-11 = 44px matches presentation bottom-11) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-11 items-center justify-center gap-1.5 border-border/30 border-t bg-background/90">
              <div className="h-1.5 w-1.5 rounded-full bg-foreground/25" />
              <div className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
              <div className="h-1.5 w-1.5 rounded-full bg-foreground/25" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
