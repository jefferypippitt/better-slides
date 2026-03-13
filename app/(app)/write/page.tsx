"use client";

import {
  ArrowSquareOut,
  Copy,
  Plus,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DeckSidebar } from "@/components/editor/deck-sidebar";
import type { CanvasBox } from "@/components/editor/layout-canvas";
import { LayoutCanvas } from "@/components/editor/layout-canvas";
import { SlideOrganizer } from "@/components/editor/slide-organizer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import type { Deck, SlideLayout } from "@/lib/decks";
import { DEFAULT_DECK_MDX, DEFAULT_DECK_TITLE } from "@/lib/default-deck";
import { parseMarkdownSections } from "@/lib/sections";
import {
  createDeckAction,
  deleteDeckAction,
  listDecksAction,
  updateDeckAction,
  uploadDeckWidgetAction,
} from "@/server/actions/decks";

const MdxEditor = dynamic(
  () =>
    import("@/components/editor/mdx-editor").then((m) => ({
      default: m.MdxEditor,
    })),
  { ssr: false }
);

const MARKDOWN_EXTS = new Set([".md", ".mdx"]);
const FRONT_MATTER_RE = /^---[\s\S]*?---\n?/;
const TITLE_MAX_LENGTH = 80;
const NOTES_MAX_LENGTH = 1500;
const MDX_MAX_BYTES = 500_000;

function getFileExt(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

function extractFrontmatter(mdxContent: string): string {
  return mdxContent.match(FRONT_MATTER_RE)?.[0] ?? "";
}

function reconstructMdx(
  frontmatter: string,
  sectionContents: string[]
): string {
  return frontmatter + sectionContents.join("\n\n");
}

function newSlide(): SlideLayout {
  return { id: nanoid(), canvasLayout: [], speakerNotes: "" };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: page component intentionally coordinates editor state in one place.
export default function WritePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"editor" | "layout">("editor");
  const [editorSubView, setEditorSubView] = useState<"text" | "outline">(
    "text"
  );
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [mdx, setMdx] = useState(DEFAULT_DECK_MDX);
  const [title, setTitle] = useState(DEFAULT_DECK_TITLE);
  const [slides, setSlides] = useState<SlideLayout[]>([]);
  const [deckWidgets, setDeckWidgets] = useState<Deck["widgets"]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [widgetUploading, setWidgetUploading] = useState(false);
  const [widgetAttachTargetSectionId, setWidgetAttachTargetSectionId] =
    useState<string | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesSlideIndex, setNotesSlideIndex] = useState<number | null>(null);
  const [copiedNotes, setCopiedNotes] = useState(false);

  const initialLoadDone = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const widgetFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialLoadDone.current) {
      return;
    }
    initialLoadDone.current = true;
    listDecksAction()
      .then((data) => {
        setDecks(data);
        if (data.length > 0) {
          const firstDeck = data[0];
          const mdxContent =
            firstDeck.mdx.trim().length > 0 ? firstDeck.mdx : DEFAULT_DECK_MDX;
          const deckTitle =
            firstDeck.title.trim().length > 0
              ? firstDeck.title
              : DEFAULT_DECK_TITLE;
          setActiveDeckId(firstDeck.id);
          setMdx(mdxContent);
          setTitle(deckTitle);
          setSlides(firstDeck.slides);
          setDeckWidgets(firstDeck.widgets);
          setActiveSlideIndex(0);
        }
      })
      .catch((_err: unknown) => {
        // ignore initial load errors
      });
  }, []);

  function loadDeck(deck: Deck) {
    const mdxContent = deck.mdx.trim().length > 0 ? deck.mdx : DEFAULT_DECK_MDX;
    const deckTitle =
      deck.title.trim().length > 0 ? deck.title : DEFAULT_DECK_TITLE;
    setActiveDeckId(deck.id);
    setMdx(mdxContent);
    setTitle(deckTitle);
    setSlides(deck.slides);
    setDeckWidgets(deck.widgets);
    setActiveSlideIndex(0);
  }

  function handleSelectDeck(id: string) {
    const deck = decks.find((d) => d.id === id);
    if (deck) {
      loadDeck(deck);
    }
  }

  async function handleNewDeck() {
    const deck = await createDeckAction({
      title: DEFAULT_DECK_TITLE,
      mdx: DEFAULT_DECK_MDX,
    });
    setDecks((prev) => [...prev, deck]);
    loadDeck(deck);
  }

  async function handleRenameDeck(id: string, newTitle: string) {
    await updateDeckAction(id, { title: newTitle });
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title: newTitle } : d))
    );
    if (id === activeDeckId) {
      setTitle(newTitle);
    }
  }

  async function handleDeleteDeck(id: string) {
    await deleteDeckAction(id);
    setDecks((prev) => {
      const remaining = prev.filter((d) => d.id !== id);
      if (id === activeDeckId) {
        if (remaining.length > 0) {
          loadDeck(remaining[0]);
        } else {
          setActiveDeckId(null);
          setMdx(DEFAULT_DECK_MDX);
          setTitle(DEFAULT_DECK_TITLE);
          setSlides([]);
          setDeckWidgets([]);
          setActiveSlideIndex(0);
        }
      }
      return remaining;
    });
  }

  const handleSave = useCallback(
    async (overrides?: { mdx?: string; slides?: SlideLayout[] }) => {
      const effectiveMdx = overrides?.mdx ?? mdx;
      const effectiveSlides = overrides?.slides ?? slides;
      setSaving(true);
      try {
        if (activeDeckId) {
          const updated = await updateDeckAction(activeDeckId, {
            title,
            mdx: effectiveMdx,
            slides: effectiveSlides,
          });
          setDecks((prev) =>
            prev.map((d) => (d.id === updated.id ? updated : d))
          );
          if (updated.id === activeDeckId) {
            setDeckWidgets(updated.widgets);
          }
        } else {
          const deck = await createDeckAction({
            title,
            mdx: effectiveMdx,
            slides: effectiveSlides,
          });
          setDecks((prev) => [...prev, deck]);
          setActiveDeckId(deck.id);
          setDeckWidgets(deck.widgets);
        }
      } finally {
        setSaving(false);
      }
    },
    [activeDeckId, slides, title, mdx]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  function handleSectionReorder(newContents: string[]) {
    const fm = extractFrontmatter(mdx);
    setMdx(reconstructMdx(fm, newContents));
  }

  function handleAttachWidgetToSection(
    sectionId: string,
    componentName: string | null
  ) {
    setSlides((prev) => {
      const nextSlides = prev.length > 0 ? [...prev] : [newSlide()];
      const targetIndex =
        prev.length > 0 ? Math.min(activeSlideIndex, nextSlides.length - 1) : 0;
      const targetSlide = nextSlides[targetIndex] ?? newSlide();
      const nextLayout = [...targetSlide.canvasLayout];
      const targetBoxIndex = nextLayout.findIndex(
        (box) =>
          box.kind !== "component" &&
          box.kind !== "separator" &&
          box.sectionId === sectionId
      );
      if (targetBoxIndex >= 0) {
        const targetBox = nextLayout[targetBoxIndex];
        nextLayout[targetBoxIndex] = {
          ...targetBox,
          componentName: componentName ?? undefined,
        };
      } else {
        nextLayout.push({
          h: 36,
          id: `box-${nanoid()}`,
          kind: "section",
          sectionId,
          w: 40,
          x: 8 + ((nextLayout.length * 4) % 40),
          y: 10 + ((nextLayout.length * 4) % 40),
          componentName: componentName ?? undefined,
          textStyle: "body",
        });
      }
      nextSlides[targetIndex] = { ...targetSlide, canvasLayout: nextLayout };
      return nextSlides;
    });
  }

  function handleUploadWidgetToLibrary() {
    setWidgetAttachTargetSectionId(null);
    widgetFileInputRef.current?.click();
  }

  async function handlePresent() {
    if (!activeDeckId) {
      return;
    }
    setPresenting(true);
    try {
      await handleSave();
      router.push(`/present/${activeDeckId}/1`);
    } finally {
      setPresenting(false);
    }
  }

  // ── Content clear / upload ────────────────────────────────────────────

  function handleClear() {
    setMdx("");
    setSlides([]);
    setActiveSlideIndex(0);
    setUploadError("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    e.target.value = ""; // allow re-selecting the same file
    setUploadError("");
    setUploading(true);
    try {
      if (!MARKDOWN_EXTS.has(getFileExt(file.name))) {
        setUploadError("Only Markdown files (.md, .mdx) are supported.");
        return;
      }
      if (file.size > MDX_MAX_BYTES) {
        setUploadError("File is too large. Maximum size is 500 KB.");
        return;
      }
      const text = await file.text();
      const cleanedMdx = text.replace(/\r/g, "").split("\0").join("");
      setMdx(cleanedMdx);
      setSlides([]);
      setActiveSlideIndex(0);
      await handleSave({ mdx: cleanedMdx, slides: [] });
    } catch {
      setUploadError("Failed to import Markdown file. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleWidgetFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    e.target.value = "";
    setWidgetUploading(true);

    const targetSectionId = widgetAttachTargetSectionId;

    const doUpload = async () => {
      // Auto-save the deck first if it hasn't been persisted yet
      let deckId = activeDeckId;
      if (!deckId) {
        const deck = await createDeckAction({ title, mdx, slides });
        setDecks((prev) => [...prev, deck]);
        setActiveDeckId(deck.id);
        setDeckWidgets(deck.widgets);
        deckId = deck.id;
      }

      const sourceTsx = await file.text();
      const widget = await uploadDeckWidgetAction({
        deckId,
        fileName: file.name,
        sourceTsx,
      });
      setDeckWidgets((prev) => {
        const next = prev.filter((entry) => entry.id !== widget.id);
        next.push(widget);
        return next;
      });
      if (targetSectionId) {
        handleAttachWidgetToSection(targetSectionId, widget.componentName);
      }
      return widget.componentName;
    };

    const promise = doUpload();

    toast.promise(promise, {
      loading: `Uploading ${file.name}…`,
      success: (componentName) => `"${componentName}" uploaded successfully`,
      error: (err: unknown) =>
        err instanceof Error && err.message
          ? err.message
          : "React widget upload failed. Use a pure React TSX component.",
    });

    try {
      await promise;
    } catch {
      // handled by toast
    } finally {
      setWidgetUploading(false);
      setWidgetAttachTargetSectionId(null);
    }
  }

  // ── Slide management ──────────────────────────────────────────────────

  function handleAddSlide() {
    const next = [...slides, newSlide()];
    setSlides(next);
    setActiveSlideIndex(next.length - 1);
  }

  function handleDeleteSlide(index: number) {
    if (slides.length <= 1) {
      return;
    }
    const next = slides.filter((_, i) => i !== index);
    setSlides(next);
    setActiveSlideIndex(Math.min(activeSlideIndex, next.length - 1));
  }

  function handleAddElement(element: Omit<CanvasBox, "id">) {
    const box: CanvasBox = {
      ...element,
      id: `${element.kind ?? "box"}-${nanoid()}`,
    };

    if (slides.length === 0) {
      setSlides([{ canvasLayout: [box], id: nanoid(), speakerNotes: "" }]);
      setActiveSlideIndex(0);
      return;
    }

    setSlides((prev) =>
      prev.map((slide, index) =>
        index === activeSlideIndex
          ? { ...slide, canvasLayout: [...slide.canvasLayout, box] }
          : slide
      )
    );
  }

  function handleSlideLayoutChange(canvasLayout: CanvasBox[]) {
    setSlides((prev) =>
      prev.map((s, i) => (i === activeSlideIndex ? { ...s, canvasLayout } : s))
    );
  }

  function handleSpeakerNotesChangeForSlide(index: number, value: string) {
    setSlides((prev) =>
      prev.map((slide, i) =>
        i === index ? { ...slide, speakerNotes: value } : slide
      )
    );
  }

  function openNotesDialog(index: number) {
    setActiveSlideIndex(index);
    setNotesSlideIndex(index);
    setCopiedNotes(false);
    setNotesDialogOpen(true);
  }

  async function copyNotesFromDialog() {
    if (notesSlideIndex === null) {
      return;
    }
    const notes = slides[notesSlideIndex]?.speakerNotes ?? "";
    try {
      await navigator.clipboard.writeText(notes);
      setCopiedNotes(true);
      setTimeout(() => setCopiedNotes(false), 1500);
    } catch {
      setCopiedNotes(false);
    }
  }

  const activeSlide = slides[activeSlideIndex];
  const dialogSlideIndex = notesSlideIndex ?? activeSlideIndex;
  const dialogSlide = slides[dialogSlideIndex];
  const mdxSections = useMemo(() => parseMarkdownSections(mdx), [mdx]);
  const outlineSectionWidgetMap = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const box of activeSlide?.canvasLayout ?? []) {
      if (
        box.kind === "component" ||
        box.kind === "separator" ||
        box.kind === "image" ||
        box.kind === "shape" ||
        box.kind === "text" ||
        box.kind === "page-number" ||
        box.kind === "timer" ||
        box.kind === "qr-code"
      ) {
        continue;
      }
      if (!(box.sectionId && box.componentName)) {
        continue;
      }
      map[box.sectionId] = box.componentName;
    }
    return map;
  }, [activeSlide]);
  const availableWidgetNames = useMemo(
    () => [...new Set(deckWidgets.map((widget) => widget.componentName))],
    [deckWidgets]
  );

  async function handleSwitchToLayout() {
    await handleSave();
    setViewMode("layout");
  }
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b px-4 py-2">
        <span className="rounded bg-muted px-2 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          {viewMode === "editor" ? "Writing" : "Layout"}
        </span>
        <input
          aria-label="Deck title"
          className="min-w-0 flex-1 bg-transparent font-medium text-sm outline-none"
          maxLength={TITLE_MAX_LENGTH}
          onChange={(e) => setTitle(e.target.value)}
          type="text"
          value={title}
        />
        <Button
          disabled={saving}
          onClick={() => handleSave()}
          size="sm"
          variant="outline"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          onClick={() =>
            viewMode === "editor"
              ? handleSwitchToLayout()
              : setViewMode("editor")
          }
          size="sm"
          variant="outline"
        >
          {viewMode === "editor" ? "Edit Layout" : "Back to Editor"}
        </Button>
        {activeDeckId && (
          <Button
            disabled={saving || presenting}
            onClick={handlePresent}
            size="sm"
            variant="outline"
          >
            <ArrowSquareOut className="mr-1" size={14} />
            {presenting ? "Opening…" : "Present"}
          </Button>
        )}
        <ThemeToggle />
      </header>

      {viewMode === "editor" ? (
        <div className="flex min-h-0 flex-1">
          <DeckSidebar
            activeDeckId={activeDeckId}
            decks={decks}
            onDeleteDeck={handleDeleteDeck}
            onNewDeck={handleNewDeck}
            onRenameDeck={handleRenameDeck}
            onSelectDeck={handleSelectDeck}
            showElementActions={false}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Editor toolbar */}
            <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
              {/* Text / Outline toggle */}
              <div className="flex items-center rounded border text-[11px]">
                <button
                  className={`rounded-l px-2 py-1 transition-colors ${
                    editorSubView === "text"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60"
                  }`}
                  onClick={() => setEditorSubView("text")}
                  type="button"
                >
                  Text
                </button>
                <button
                  className={`rounded-r border-l px-2 py-1 transition-colors ${
                    editorSubView === "outline"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60"
                  }`}
                  onClick={() => setEditorSubView("outline")}
                  type="button"
                >
                  Outline
                </button>
              </div>

              {editorSubView === "text" && (
                <>
                  <button
                    className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={handleClear}
                    type="button"
                  >
                    <X size={12} />
                    Clear
                  </button>
                  <button
                    className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <UploadSimple size={12} />
                    {uploading ? "Importing…" : "Upload Markdown"}
                  </button>
                  {uploadError && (
                    <span className="text-[11px] text-destructive">
                      {uploadError}
                    </span>
                  )}
                </>
              )}

              {editorSubView === "outline" && (
                <>
                  <span className="text-[11px] text-muted-foreground">
                    {mdxSections.length} nodes
                  </span>
                  <button
                    className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={widgetUploading}
                    onClick={handleUploadWidgetToLibrary}
                    type="button"
                  >
                    <UploadSimple size={12} />
                    {widgetUploading
                      ? "Uploading component…"
                      : "Upload Component"}
                  </button>
                </>
              )}

              {editorSubView === "text" && (
                <span className="ml-auto text-[10px] text-muted-foreground/50">
                  Deck content: MD, MDX · React widgets: upload in Outline
                </span>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {editorSubView === "text" ? (
                <MdxEditor onChange={setMdx} value={mdx} />
              ) : (
                <SlideOrganizer
                  onAttachWidget={handleAttachWidgetToSection}
                  onReorder={handleSectionReorder}
                  sections={mdxSections}
                  sectionWidgetMap={outlineSectionWidgetMap}
                  widgetNames={availableWidgetNames}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <DeckSidebar
            activeDeckId={activeDeckId}
            decks={decks}
            onAddElement={handleAddElement}
            onDeleteDeck={handleDeleteDeck}
            onNewDeck={handleNewDeck}
            onRenameDeck={handleRenameDeck}
            onSelectDeck={handleSelectDeck}
            showElementActions
          />

          {/* Slides panel */}
          <aside className="flex w-36 shrink-0 flex-col border-r bg-background">
            <div className="border-b px-3 py-2.5">
              <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-widest">
                Slides
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
              {slides.length === 0 && (
                <p className="text-[10px] text-muted-foreground">
                  No slides yet. Click + to add one.
                </p>
              )}
              {slides.map((slide, i) => (
                <div
                  className={`rounded border p-1 ${
                    i === activeSlideIndex
                      ? "border-primary/60 bg-primary/5"
                      : "border-border/70 bg-background"
                  }`}
                  key={slide.id}
                >
                  <div className="mb-1 flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      Slide {i + 1}
                    </span>
                    {slides.length > 1 && (
                      <button
                        aria-label="Delete slide"
                        className="ml-auto rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteSlide(i)}
                        type="button"
                      >
                        <Trash size={10} />
                      </button>
                    )}
                  </div>
                  <button
                    className={`flex aspect-video w-full items-center justify-center rounded border font-medium text-[10px] transition-colors ${
                      i === activeSlideIndex
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/60"
                    }`}
                    onClick={() => setActiveSlideIndex(i)}
                    type="button"
                  >
                    <span>{i + 1}</span>
                  </button>
                  <button
                    className="mt-1.5 flex w-full justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => openNotesDialog(i)}
                    type="button"
                  >
                    <Badge
                      className={`w-full justify-center py-1 text-[10px] ${
                        slide.speakerNotes?.trim()
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      }`}
                    >
                      {slide.speakerNotes?.trim() ? "Notes on" : "No notes"}
                    </Badge>
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t p-2">
              <button
                className="flex w-full items-center justify-center gap-1 rounded border border-dashed py-1.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                onClick={handleAddSlide}
                type="button"
              >
                <Plus size={10} weight="bold" />
                Add slide
              </button>
            </div>
          </aside>

          {/* Canvas */}
          <div className="min-w-0 flex-1 overflow-hidden">
            {slides.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                <button
                  className="rounded-md border px-4 py-2 hover:bg-muted"
                  onClick={handleAddSlide}
                  type="button"
                >
                  <Plus className="mb-1 inline" size={14} /> Add your first
                  slide
                </button>
              </div>
            ) : (
              <LayoutCanvas
                initialLayout={activeSlide?.canvasLayout ?? []}
                key={activeSlide?.id ?? "empty"}
                mdx={mdx}
                notesPath={
                  activeDeckId
                    ? `/notes/${activeDeckId}?mode=window`
                    : undefined
                }
                onLayoutChange={handleSlideLayoutChange}
                qrPath={
                  activeDeckId ? `/api/notes-qr/${activeDeckId}` : undefined
                }
                showSectionsSidebar
                uploadedWidgets={deckWidgets.map((widget) => ({
                  compiledJs: widget.compiledJs,
                  componentName: widget.componentName,
                }))}
              />
            )}
          </div>
        </div>
      )}

      {/* Hidden file input shared across editor modes */}
      <input
        accept=".md,.mdx"
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />
      <input
        accept=".tsx,.ts"
        className="hidden"
        onChange={handleWidgetFileChange}
        ref={widgetFileInputRef}
        type="file"
      />

      <Dialog onOpenChange={setNotesDialogOpen} open={notesDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Slide notes</DialogTitle>
            <DialogDescription>
              Add presenter-only notes for slide {dialogSlideIndex + 1}.
            </DialogDescription>
          </DialogHeader>

          {dialogSlide && (
            <InputGroup className="h-auto">
              <InputGroupAddon align="block-start" className="border-b">
                <InputGroupButton
                  className="ml-auto"
                  onClick={() =>
                    handleSpeakerNotesChangeForSlide(dialogSlideIndex, "")
                  }
                  size="icon-xs"
                  variant="ghost"
                >
                  <X size={12} />
                </InputGroupButton>
                <InputGroupButton
                  onClick={copyNotesFromDialog}
                  size="icon-xs"
                  variant="ghost"
                >
                  <Copy size={12} />
                </InputGroupButton>
              </InputGroupAddon>
              <InputGroupTextarea
                className="max-h-[400px] min-h-[220px] resize-none overflow-y-auto"
                maxLength={NOTES_MAX_LENGTH}
                onChange={(e) =>
                  handleSpeakerNotesChangeForSlide(
                    dialogSlideIndex,
                    e.target.value
                  )
                }
                placeholder="Write what you want to remember while presenting this slide..."
                value={dialogSlide.speakerNotes ?? ""}
              />
              <InputGroupAddon align="block-end" className="border-t">
                <InputGroupText
                  className={
                    !copiedNotes &&
                    (dialogSlide.speakerNotes ?? "").length >=
                      NOTES_MAX_LENGTH * 0.9
                      ? "text-destructive"
                      : undefined
                  }
                >
                  {copiedNotes
                    ? "Copied to clipboard"
                    : `${(dialogSlide.speakerNotes ?? "").length} / ${NOTES_MAX_LENGTH}`}
                </InputGroupText>
                <InputGroupButton
                  className="ml-auto"
                  onClick={() => setNotesDialogOpen(false)}
                  size="sm"
                  variant="default"
                >
                  Done
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
