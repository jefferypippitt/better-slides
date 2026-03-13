"use client";

import { CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import type { NotesViewProps } from "@/components/notes/phone-notes-view";
import { useNotesSync } from "@/components/notes/use-notes-sync";
import { Button } from "@/components/ui/button";

export function DesktopNotesView({
  notes,
  syncEndpoint,
  pollInterval = 1500,
  syncMode = "poll",
}: NotesViewProps) {
  const {
    slideIndex,
    total,
    connected,
    active,
    ended,
    viewers,
    currentNote,
    label,
    dotColor,
    statusLabel,
    navigate,
    handleDisconnect,
    handleReconnect,
  } = useNotesSync({ notes, syncEndpoint, pollInterval, syncMode });

  if (ended) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <p className="font-semibold text-4xl text-muted-foreground tracking-tight">
          Presentation ended
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
      <header className="flex items-center justify-between border-border border-b px-6 py-4 text-muted-foreground text-sm">
        <span>{label}</span>

        <div className="flex items-center gap-2">
          {active && connected && viewers > 0 ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
              <span>●</span>
              <span>
                {viewers} {viewers === 1 ? "device" : "devices"}
              </span>
            </span>
          ) : null}

          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            <span>{statusLabel}</span>
          </span>

          {active ? (
            <Button
              aria-label="Disconnect"
              className="rounded-full"
              onClick={handleDisconnect}
              size="icon-sm"
              title="Disconnect"
              type="button"
              variant="ghost"
            >
              <XIcon />
            </Button>
          ) : (
            <Button
              onClick={handleReconnect}
              size="sm"
              type="button"
              variant="outline"
            >
              Reconnect
            </Button>
          )}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-10 py-8">
        {currentNote ? (
          <p className="max-w-4xl whitespace-pre-wrap text-center text-2xl leading-relaxed lg:text-3xl">
            {currentNote}
          </p>
        ) : (
          <p className="text-muted-foreground text-xl italic">
            No notes for this slide.
          </p>
        )}
      </main>

      <footer className="flex gap-3 border-border border-t px-6 py-4">
        <Button
          className="flex-1"
          disabled={slideIndex <= 0}
          onClick={() => navigate(slideIndex - 1)}
          size="lg"
          type="button"
          variant="outline"
        >
          <CaretLeftIcon data-icon="inline-start" />
          Previous
        </Button>
        <Button
          className="flex-1"
          disabled={slideIndex >= total - 1}
          onClick={() => navigate(slideIndex + 1)}
          size="lg"
          type="button"
          variant="default"
        >
          Next
          <CaretRightIcon data-icon="inline-end" />
        </Button>
      </footer>
    </div>
  );
}
