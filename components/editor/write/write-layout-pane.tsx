"use client";

import { DotsThreeVertical, Plus, Trash } from "@phosphor-icons/react";
import { DeckSidebar } from "@/components/editor/deck-sidebar";
import { LayoutCanvas } from "@/components/editor/layout-canvas";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Deck, SlideLayout } from "@/lib/decks";

interface WriteLayoutPaneProps {
  activeDeckId: string | null;
  activeSlide: SlideLayout | undefined;
  activeSlideIndex: number;
  decks: Deck[];
  deckWidgets: Deck["widgets"];
  mdx: string;
  onAddElement: Parameters<typeof DeckSidebar>[0]["onAddElement"];
  onAddSlide: () => void;
  onDeleteAllDecks: () => void | Promise<void>;
  onDeleteDeck: (id: string) => void | Promise<void>;
  onDeleteSlide: (index: number) => void;
  onLayoutChange: (canvasLayout: SlideLayout["canvasLayout"]) => void;
  onOpenNotesDialog: (index: number) => void;
  onRenameDeck: (id: string, newTitle: string) => void;
  onSelectDeck: (id: string) => void;
  onSelectSlide: (index: number) => void;
  slides: SlideLayout[];
}

export function WriteLayoutPane({
  activeDeckId,
  activeSlide,
  activeSlideIndex,
  deckWidgets,
  decks,
  mdx,
  onAddElement,
  onAddSlide,
  onDeleteAllDecks,
  onDeleteDeck,
  onDeleteSlide,
  onLayoutChange,
  onOpenNotesDialog,
  onRenameDeck,
  onSelectDeck,
  onSelectSlide,
  slides,
}: WriteLayoutPaneProps) {
  return (
    <div className="flex min-h-0 flex-1">
      <DeckSidebar
        activeDeckId={activeDeckId}
        decks={decks}
        onAddElement={onAddElement}
        onDeleteAllDecks={onDeleteAllDecks}
        onDeleteDeck={onDeleteDeck}
        onRenameDeck={onRenameDeck}
        onSelectDeck={onSelectDeck}
        showElementActions
      />

      <aside className="flex w-36 shrink-0 flex-col border-r bg-background">
        <div className="border-b px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-widest">
              Slides
            </p>
          </div>
        </div>
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
          {slides.length === 0 && (
            <p className="text-[10px] text-muted-foreground">
              No slides yet. Click + to add one.
            </p>
          )}
          {slides.map((slide, i) => (
            <div
              className={`group relative rounded border p-2 transition-colors ${
                i === activeSlideIndex ? "border-primary" : "border-border"
              }`}
              key={slide.id}
            >
              <div className="absolute top-1 right-1 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label={`Slide ${i + 1} actions`}
                      className="h-4 w-4 border border-border bg-background/90 opacity-100 shadow-sm"
                      size="icon"
                      variant="ghost"
                    >
                      <DotsThreeVertical size={12} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={4}>
                    <DropdownMenuItem onSelect={() => onOpenNotesDialog(i)}>
                      {slide.speakerNotes?.trim() ? "Edit notes" : "Add notes"}
                    </DropdownMenuItem>
                    {slides.length > 1 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => onDeleteSlide(i)}
                        >
                          <Trash size={12} />
                          Delete slide
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                className="h-auto w-full p-1 hover:bg-transparent"
                onClick={() => onSelectSlide(i)}
                variant="ghost"
              >
                <div className="w-full space-y-0.5">
                  <div
                    className={`mt-3 aspect-4/3 w-full rounded-sm border p-1 ${
                      i === activeSlideIndex
                        ? "border-primary"
                        : "border-border"
                    }`}
                  >
                    <div className="h-full w-full space-y-1 rounded-[2px] border border-border/70 p-1">
                      <div className="h-1 w-2/3 rounded-[2px] border border-border/70" />
                      <div className="h-1 w-1/2 rounded-[2px] border border-border/70" />
                      <div className="h-4 w-full rounded-[2px] border border-border/70" />
                    </div>
                  </div>
                  <p className="text-center font-medium text-[10px] text-muted-foreground">
                    Slide {i + 1}
                  </p>
                </div>
              </Button>
            </div>
          ))}
        </div>
        <div className="border-t p-2">
          <Button
            className="w-full"
            onClick={onAddSlide}
            size="sm"
            variant="default"
          >
            <Plus />
            Add Slide
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-hidden">
        {slides.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            <Button onClick={onAddSlide} variant="outline">
              <Plus size={14} /> Add your first slide
            </Button>
          </div>
        ) : (
          <LayoutCanvas
            initialLayout={activeSlide?.canvasLayout ?? []}
            key={activeSlide?.id ?? "empty"}
            mdx={mdx}
            notesPath={
              activeDeckId ? `/notes/${activeDeckId}?mode=window` : undefined
            }
            onLayoutChange={onLayoutChange}
            qrPath={activeDeckId ? `/api/notes-qr/${activeDeckId}` : undefined}
            showSectionsSidebar
            uploadedWidgets={deckWidgets.map((widget) => ({
              compiledJs: widget.compiledJs,
              componentName: widget.componentName,
            }))}
          />
        )}
      </div>
    </div>
  );
}
