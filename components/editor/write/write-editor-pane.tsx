"use client";

import type { ComponentType } from "react";
import { DeckSidebar } from "@/components/editor/deck-sidebar";
import { SlideOrganizer } from "@/components/editor/slide-organizer";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import type { Deck } from "@/lib/decks";
import type { MarkdownSection } from "@/lib/sections";

interface MdxEditorProps {
  onChange: (value: string) => void;
  value: string;
}

interface WriteEditorPaneProps {
  activeDeckId: string | null;
  decks: Deck[];
  editorSubView: "outline" | "text";
  MdxEditorComponent: ComponentType<MdxEditorProps>;
  mdx: string;
  mdxSections: MarkdownSection[];
  onAttachWidget: (sectionId: string, componentName: string | null) => void;
  onClear: () => void;
  onDeleteAllDecks: () => void | Promise<void>;
  onDeleteDeck: (id: string) => void | Promise<void>;
  onMdxChange: (value: string) => void;
  onRenameDeck: (id: string, newTitle: string) => void;
  onReorderSections: (newContents: string[]) => void;
  onSelectDeck: (id: string) => void;
  onSetEditorSubView: (next: "outline" | "text") => void;
  onUploadMarkdown: () => void;
  onUploadWidgetToLibrary: () => void;
  sectionWidgetMap: Record<string, string | undefined>;
  uploadError: string;
  uploading: boolean;
  widgetNames: string[];
  widgetUploading: boolean;
}

export function WriteEditorPane({
  activeDeckId,
  decks,
  editorSubView,
  mdx,
  mdxSections,
  MdxEditorComponent,
  onAttachWidget,
  onClear,
  onDeleteAllDecks,
  onDeleteDeck,
  onMdxChange,
  onRenameDeck,
  onReorderSections,
  onSelectDeck,
  onSetEditorSubView,
  onUploadMarkdown,
  onUploadWidgetToLibrary,
  sectionWidgetMap,
  uploadError,
  uploading,
  widgetNames,
  widgetUploading,
}: WriteEditorPaneProps) {
  return (
    <div className="flex min-h-0 flex-1">
      <DeckSidebar
        activeDeckId={activeDeckId}
        decks={decks}
        onDeleteAllDecks={onDeleteAllDecks}
        onDeleteDeck={onDeleteDeck}
        onRenameDeck={onRenameDeck}
        onSelectDeck={onSelectDeck}
        showElementActions={false}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1">
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger
                className={editorSubView === "text" ? "bg-muted" : ""}
                onClick={() => onSetEditorSubView("text")}
              >
                Text
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={onClear}>Clear</MenubarItem>
                <MenubarSeparator />
                <MenubarItem disabled={uploading} onSelect={onUploadMarkdown}>
                  {uploading ? "Importing…" : "Upload Markdown"}
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger
                className={editorSubView === "outline" ? "bg-muted" : ""}
                onClick={() => onSetEditorSubView("outline")}
              >
                Organize
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem disabled>{mdxSections.length} nodes</MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                  disabled={widgetUploading}
                  onSelect={onUploadWidgetToLibrary}
                >
                  {widgetUploading
                    ? "Uploading component…"
                    : "Upload Component"}
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          {uploadError && (
            <span className="text-destructive text-xs">{uploadError}</span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {editorSubView === "text" ? (
            <MdxEditorComponent onChange={onMdxChange} value={mdx} />
          ) : (
            <SlideOrganizer
              onAttachWidget={onAttachWidget}
              onReorder={onReorderSections}
              sections={mdxSections}
              sectionWidgetMap={sectionWidgetMap}
              widgetNames={widgetNames}
            />
          )}
        </div>
      </div>
    </div>
  );
}
