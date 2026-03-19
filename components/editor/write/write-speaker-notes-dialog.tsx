"use client";

import { Copy, Microphone, X } from "@phosphor-icons/react";
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
import { Spinner } from "@/components/ui/spinner";
import type { SlideLayout } from "@/lib/decks";

interface WriteSpeakerNotesDialogProps {
  copiedNotes: boolean;
  dictatingNotes: boolean;
  notesDialogOpen: boolean;
  notesMaxLength: number;
  notesSpeechError: string | null;
  onClearNotes: () => void;
  onClose: () => void;
  onCopyNotes: () => void;
  onNotesChange: (value: string) => void;
  onNotesDialogOpenChange: (open: boolean) => void;
  onToggleDictation: () => void;
  slide: SlideLayout | undefined;
  slideIndexLabel: number;
  speechSupported: boolean;
}

export function WriteSpeakerNotesDialog({
  copiedNotes,
  dictatingNotes,
  notesDialogOpen,
  notesMaxLength,
  notesSpeechError,
  onClearNotes,
  onClose,
  onCopyNotes,
  onNotesDialogOpenChange,
  onNotesChange,
  onToggleDictation,
  slide,
  slideIndexLabel,
  speechSupported,
}: WriteSpeakerNotesDialogProps) {
  return (
    <Dialog onOpenChange={onNotesDialogOpenChange} open={notesDialogOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Slide notes</DialogTitle>
          <DialogDescription>
            Add presenter notes for slide {slideIndexLabel + 1}.
          </DialogDescription>
        </DialogHeader>

        {slide && (
          <InputGroup className="h-auto">
            <InputGroupAddon align="block-start" className="border-b">
              <InputGroupButton
                aria-label="Clear notes"
                className="ml-auto"
                onClick={onClearNotes}
                size="icon-xs"
                title="Clear notes"
                variant="outline"
              >
                <X size={12} />
              </InputGroupButton>
              <InputGroupButton
                aria-label="Copy notes"
                onClick={onCopyNotes}
                size="icon-xs"
                title="Copy notes"
                variant="outline"
              >
                <Copy size={12} />
              </InputGroupButton>
              <InputGroupButton
                aria-label={
                  dictatingNotes
                    ? "Stop speech dictation"
                    : "Start speech dictation"
                }
                disabled={!speechSupported}
                onClick={onToggleDictation}
                size="icon-xs"
                title={dictatingNotes ? "Stop dictation" : "Start dictation"}
                variant="outline"
              >
                {dictatingNotes ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <Microphone size={12} />
                )}
              </InputGroupButton>
            </InputGroupAddon>
            <InputGroupTextarea
              className="max-h-[400px] min-h-[220px] resize-none overflow-y-auto"
              maxLength={notesMaxLength}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Write what you want to remember while presenting this slide..."
              value={slide.speakerNotes ?? ""}
            />
            <InputGroupAddon align="block-end" className="border-t">
              {notesSpeechError && (
                <InputGroupText className="text-destructive">
                  {notesSpeechError}
                </InputGroupText>
              )}
              <InputGroupText
                className={
                  !copiedNotes &&
                  (slide.speakerNotes ?? "").length >= notesMaxLength * 0.9
                    ? "text-destructive"
                    : undefined
                }
              >
                {copiedNotes
                  ? "Copied to clipboard"
                  : `${(slide.speakerNotes ?? "").length} / ${notesMaxLength}`}
              </InputGroupText>
              <InputGroupButton
                className="ml-auto"
                onClick={onClose}
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
  );
}
