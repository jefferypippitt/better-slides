"use client";

import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComponentType } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { CanvasBox } from "@/components/editor/layout-canvas";
import { WriteEditorPane } from "@/components/editor/write/write-editor-pane";
import { WriteLayoutPane } from "@/components/editor/write/write-layout-pane";
import { WriteSpeakerNotesDialog } from "@/components/editor/write/write-speaker-notes-dialog";
import { WriteTopBar } from "@/components/editor/write/write-top-bar";
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

interface MdxEditorLikeProps {
  onChange: (value: string) => void;
  value: string;
}

const MARKDOWN_EXTS = new Set([".md", ".mdx"]);
const FRONT_MATTER_RE = /^---[\s\S]*?---\n?/;
const TRAILING_WHITESPACE_RE = /\s$/;
const TITLE_MAX_LENGTH = 80;
const NOTES_MAX_LENGTH = 1500;
const MDX_MAX_BYTES = 500_000;

type SpeechRecognitionResultLike = ArrayLike<{ transcript: string }> & {
  isFinal?: boolean;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
};

interface SpeechRecognitionInstanceLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionInstanceLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructorLike | null {
  if (typeof window === "undefined") {
    return null;
  }
  const windowWithSpeech = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return (
    windowWithSpeech.SpeechRecognition ??
    windowWithSpeech.webkitSpeechRecognition ??
    null
  );
}

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

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [speechSupported, setSpeechSupported] = useState(false);
  const [dictatingNotes, setDictatingNotes] = useState(false);
  const [notesSpeechError, setNotesSpeechError] = useState<string | null>(null);

  const initialLoadDone = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const widgetFileInputRef = useRef<HTMLInputElement>(null);
  const notesRecognitionRef = useRef<SpeechRecognitionInstanceLike | null>(
    null
  );

  const loadDeck = useCallback((deck: Deck) => {
    const mdxContent = deck.mdx.trim().length > 0 ? deck.mdx : DEFAULT_DECK_MDX;
    const deckTitle =
      deck.title.trim().length > 0 ? deck.title : DEFAULT_DECK_TITLE;
    setActiveDeckId(deck.id);
    setMdx(mdxContent);
    setTitle(deckTitle);
    setSlides(deck.slides);
    setDeckWidgets(deck.widgets);
    setActiveSlideIndex(0);
  }, []);

  useEffect(() => {
    if (initialLoadDone.current) {
      return;
    }
    initialLoadDone.current = true;
    const preferredDeckId = searchParams.get("deck");
    listDecksAction()
      .then((data) => {
        setDecks(data);
        if (data.length > 0) {
          const match = preferredDeckId
            ? data.find((d) => d.id === preferredDeckId)
            : undefined;
          loadDeck(match ?? data[0]);
        }
        if (preferredDeckId) {
          router.replace("/write", { scroll: false });
        }
      })
      .catch((_err: unknown) => {
        // ignore initial load errors
      });
  }, [loadDeck, router, searchParams]);

  useEffect(() => {
    setSpeechSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  function handleSelectDeck(id: string) {
    const deck = decks.find((d) => d.id === id);
    if (deck) {
      loadDeck(deck);
    }
  }

  async function handleNewDeck() {
    try {
      const deck = await createDeckAction({
        title: DEFAULT_DECK_TITLE,
        mdx: DEFAULT_DECK_MDX,
      });
      setDecks((prev) => [...prev, deck]);
      loadDeck(deck);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create deck."
      );
    }
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

  async function handleDeleteAllDecks() {
    const deckIds = decks.map((deck) => deck.id);
    if (deckIds.length === 0) {
      return;
    }

    await Promise.all(deckIds.map((id) => deleteDeckAction(id)));
    setDecks([]);
    setActiveDeckId(null);
    setMdx(DEFAULT_DECK_MDX);
    setTitle(DEFAULT_DECK_TITLE);
    setSlides([]);
    setDeckWidgets([]);
    setActiveSlideIndex(0);
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
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save deck."
        );
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

  const appendSpeakerNotesForSlide = useCallback(
    (index: number, transcript: string) => {
      const cleanedTranscript = transcript.replace(/\s+/g, " ").trim();
      if (!cleanedTranscript) {
        return;
      }
      setSlides((prev) =>
        prev.map((slide, i) => {
          if (i !== index) {
            return slide;
          }
          const currentNotes = slide.speakerNotes ?? "";
          const spacer =
            currentNotes.length === 0 ||
            TRAILING_WHITESPACE_RE.test(currentNotes)
              ? ""
              : " ";
          const nextNotes =
            `${currentNotes}${spacer}${cleanedTranscript}`.slice(
              0,
              NOTES_MAX_LENGTH
            );
          return { ...slide, speakerNotes: nextNotes };
        })
      );
    },
    []
  );

  function openNotesDialog(index: number) {
    stopNotesDictation();
    setNotesSpeechError(null);
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

  const stopNotesDictation = useCallback(() => {
    notesRecognitionRef.current?.stop();
    notesRecognitionRef.current = null;
    setDictatingNotes(false);
  }, []);

  const startNotesDictation = useCallback(() => {
    if (notesSlideIndex === null) {
      return;
    }
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      setNotesSpeechError(
        "Speech recognition is not supported in this browser. Use Chrome or Edge."
      );
      return;
    }
    setNotesSpeechError(null);

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-US";

    const targetSlideIndex = notesSlideIndex;

    recognition.onresult = (event) => {
      let transcriptChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result?.isFinal) {
          continue;
        }
        const transcript = result[0]?.transcript?.trim();
        if (transcript) {
          transcriptChunk = `${transcriptChunk} ${transcript}`;
        }
      }
      if (transcriptChunk.trim().length > 0) {
        appendSpeakerNotesForSlide(targetSlideIndex, transcriptChunk);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setNotesSpeechError(
          "Microphone access was denied. Enable mic permissions and try again."
        );
      } else if (event.error === "audio-capture") {
        setNotesSpeechError("No microphone was detected.");
      } else {
        setNotesSpeechError("Speech recognition failed. Try again.");
      }
    };

    recognition.onend = () => {
      notesRecognitionRef.current = null;
      setDictatingNotes(false);
    };

    notesRecognitionRef.current = recognition;
    try {
      recognition.start();
      setDictatingNotes(true);
    } catch {
      notesRecognitionRef.current = null;
      setDictatingNotes(false);
      setNotesSpeechError("Unable to start speech recognition.");
    }
  }, [appendSpeakerNotesForSlide, notesSlideIndex]);

  const toggleNotesDictation = useCallback(() => {
    if (dictatingNotes) {
      stopNotesDictation();
      return;
    }
    startNotesDictation();
  }, [dictatingNotes, startNotesDictation, stopNotesDictation]);

  useEffect(() => {
    if (notesDialogOpen) {
      return;
    }
    stopNotesDictation();
    setNotesSpeechError(null);
  }, [notesDialogOpen, stopNotesDictation]);

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
      <WriteTopBar
        activeDeckId={activeDeckId}
        decksCount={decks.length}
        onDeleteAllDecks={handleDeleteAllDecks}
        onNewDeck={handleNewDeck}
        onPresent={handlePresent}
        onSave={() => {
          handleSave().then(() => undefined);
        }}
        onTitleChange={setTitle}
        onToggleView={() => {
          if (viewMode === "editor") {
            handleSwitchToLayout().then(() => undefined);
            return;
          }
          setViewMode("editor");
        }}
        presenting={presenting}
        saving={saving}
        title={title}
        titleMaxLength={TITLE_MAX_LENGTH}
        viewMode={viewMode}
      />

      {viewMode === "editor" ? (
        <WriteEditorPane
          activeDeckId={activeDeckId}
          decks={decks}
          editorSubView={editorSubView}
          MdxEditorComponent={MdxEditor as ComponentType<MdxEditorLikeProps>}
          mdx={mdx}
          mdxSections={mdxSections}
          onAttachWidget={handleAttachWidgetToSection}
          onClear={handleClear}
          onDeleteAllDecks={handleDeleteAllDecks}
          onDeleteDeck={handleDeleteDeck}
          onMdxChange={setMdx}
          onRenameDeck={handleRenameDeck}
          onReorderSections={handleSectionReorder}
          onSelectDeck={handleSelectDeck}
          onSetEditorSubView={setEditorSubView}
          onUploadMarkdown={() => fileInputRef.current?.click()}
          onUploadWidgetToLibrary={handleUploadWidgetToLibrary}
          sectionWidgetMap={outlineSectionWidgetMap}
          uploadError={uploadError}
          uploading={uploading}
          widgetNames={availableWidgetNames}
          widgetUploading={widgetUploading}
        />
      ) : (
        <WriteLayoutPane
          activeDeckId={activeDeckId}
          activeSlide={activeSlide}
          activeSlideIndex={activeSlideIndex}
          decks={decks}
          deckWidgets={deckWidgets}
          mdx={mdx}
          onAddElement={handleAddElement}
          onAddSlide={handleAddSlide}
          onDeleteAllDecks={handleDeleteAllDecks}
          onDeleteDeck={handleDeleteDeck}
          onDeleteSlide={handleDeleteSlide}
          onLayoutChange={handleSlideLayoutChange}
          onOpenNotesDialog={openNotesDialog}
          onRenameDeck={handleRenameDeck}
          onSelectDeck={handleSelectDeck}
          onSelectSlide={setActiveSlideIndex}
          slides={slides}
        />
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

      <WriteSpeakerNotesDialog
        copiedNotes={copiedNotes}
        dictatingNotes={dictatingNotes}
        notesDialogOpen={notesDialogOpen}
        notesMaxLength={NOTES_MAX_LENGTH}
        notesSpeechError={notesSpeechError}
        onClearNotes={() =>
          handleSpeakerNotesChangeForSlide(dialogSlideIndex, "")
        }
        onClose={() => setNotesDialogOpen(false)}
        onCopyNotes={copyNotesFromDialog}
        onNotesChange={(value) =>
          handleSpeakerNotesChangeForSlide(dialogSlideIndex, value)
        }
        onNotesDialogOpenChange={setNotesDialogOpen}
        onToggleDictation={toggleNotesDictation}
        slide={dialogSlide}
        slideIndexLabel={dialogSlideIndex}
        speechSupported={speechSupported}
      />
    </div>
  );
}
