"use client";

import { ArrowSquareOut, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WriteTopBarProps {
  activeDeckId: string | null;
  decksCount: number;
  onDeleteAllDecks: () => void | Promise<void>;
  onNewDeck: () => void | Promise<void>;
  onPresent: () => void;
  onSave: () => void;
  onTitleChange: (value: string) => void;
  onToggleView: () => void;
  presenting: boolean;
  saving: boolean;
  title: string;
  titleMaxLength: number;
  viewMode: "editor" | "layout";
}

export function WriteTopBar({
  activeDeckId,
  decksCount,
  onDeleteAllDecks,
  onNewDeck,
  onPresent,
  onSave,
  onTitleChange,
  onToggleView,
  presenting,
  saving,
  title,
  titleMaxLength,
  viewMode,
}: WriteTopBarProps) {
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deletingAllDecks, setDeletingAllDecks] = useState(false);

  async function handleDeleteAllDecks() {
    if (deletingAllDecks || decksCount === 0) {
      return;
    }
    setDeletingAllDecks(true);
    try {
      await onDeleteAllDecks();
      setDeleteAllDialogOpen(false);
    } finally {
      setDeletingAllDecks(false);
    }
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b px-4 py-2">
        <Badge className="uppercase tracking-wide" variant="secondary">
          {viewMode === "editor" ? "Writing" : "Layout"}
        </Badge>
        <Input
          aria-label="Deck title"
          className="min-w-0 flex-1 border-transparent bg-transparent font-medium shadow-none focus-visible:border-ring"
          maxLength={titleMaxLength}
          onChange={(e) => onTitleChange(e.target.value)}
          type="text"
          value={title}
        />
        <Button onClick={onNewDeck} size="sm" variant="outline">
          <Plus size={14} />
          New Deck
        </Button>
        <Button
          aria-label="Delete all decks"
          disabled={decksCount === 0}
          onClick={() => setDeleteAllDialogOpen(true)}
          size="icon-sm"
          variant="destructive"
        >
          <Trash size={14} />
        </Button>
        <Button disabled={saving} onClick={onSave} size="sm" variant="default">
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button onClick={onToggleView} size="sm" variant="outline">
          {viewMode === "editor" ? "Edit Layout" : "Back to Editor"}
        </Button>
        {activeDeckId && (
          <Button
            disabled={saving || presenting}
            onClick={onPresent}
            size="sm"
            variant="outline"
          >
            <ArrowSquareOut className="mr-1" size={14} />
            {presenting ? "Opening…" : "Present"}
          </Button>
        )}
        <ThemeToggle />
      </header>
      <AlertDialog
        onOpenChange={setDeleteAllDialogOpen}
        open={deleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all decks?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every deck permanently and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingAllDecks || decksCount === 0}
              onClick={handleDeleteAllDecks}
            >
              {deletingAllDecks ? "Deleting…" : "Delete all decks"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
