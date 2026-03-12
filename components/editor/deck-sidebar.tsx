"use client";

import {
  ArrowSquareOutIcon,
  ArrowsHorizontalIcon,
  ArrowsVerticalIcon,
  DotsThreeVerticalIcon,
  Plus,
  SignOut,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient, signOut as authSignOut } from "@/lib/auth-client";
import type { Deck } from "@/lib/decks";

type SeparatorOrientation = "horizontal" | "vertical";

interface DeckSidebarProps {
  activeDeckId: string | null;
  decks: Deck[];
  onAddSeparator?: (orientation: SeparatorOrientation) => void;
  onDeleteDeck: (id: string) => void;
  onNewDeck: () => void;
  onRenameDeck: (id: string, newTitle: string) => void;
  onSelectDeck: (id: string) => void;
  showElementActions?: boolean;
}

export function DeckSidebar({
  decks,
  activeDeckId,
  onAddSeparator,
  onSelectDeck,
  onNewDeck,
  onDeleteDeck,
  onRenameDeck,
  showElementActions = false,
}: DeckSidebarProps) {
  const [deleteTarget, setDeleteTarget] = useState<Deck | null>(null);
  const [renameTarget, setRenameTarget] = useState<Deck | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [separatorDialogOpen, setSeparatorDialogOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [sessionUser, setSessionUser] = useState<{
    email?: string;
    name?: string;
  } | null>(null);

  useEffect(() => {
    authClient
      .getSession()
      .then((result) => {
        setSessionUser(result.data?.user ?? null);
      })
      .catch(() => {
        setSessionUser(null);
      });
  }, []);

  const userName = sessionUser?.name?.trim() || "Signed in";
  const userEmail = sessionUser?.email?.trim();

  async function handleSignOut() {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await authSignOut();
      window.location.href = "/sign-in";
    } finally {
      setSigningOut(false);
    }
  }

  function openRename(deck: Deck) {
    setRenameTarget(deck);
    setRenameValue(deck.title);
  }

  function commitRename() {
    if (renameTarget && renameValue.trim()) {
      onRenameDeck(renameTarget.id, renameValue.trim());
    }
    setRenameTarget(null);
  }

  return (
    <>
      <aside className="flex h-full w-48 shrink-0 flex-col border-r bg-muted/30">
        <div className="border-b px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-widest">
                Decks
              </p>
            </div>
            <button
              aria-label="New deck"
              className="mt-0.5 text-muted-foreground hover:text-foreground"
              onClick={onNewDeck}
              type="button"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <ul className="flex-1 overflow-auto py-1">
          {decks.map((deck) => (
            <li className="group flex items-center px-2" key={deck.id}>
              <button
                className={`flex-1 truncate rounded px-2 py-1 text-left text-sm ${
                  deck.id === activeDeckId
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => onSelectDeck(deck.id)}
                type="button"
              >
                {deck.title}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Deck options"
                    className="rounded p-0.5 text-muted-foreground opacity-0 hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                    type="button"
                  >
                    <DotsThreeVerticalIcon size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right">
                  {activeDeckId === deck.id && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/present/${deck.id}/1`}>
                          <ArrowSquareOutIcon size={13} />
                          Present
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onSelect={() => openRename(deck)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDeleteTarget(deck)}
                    variant="destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
          {decks.length === 0 && (
            <li className="px-3 py-2 text-muted-foreground text-xs italic">
              No decks yet
            </li>
          )}
        </ul>

        <div className="border-t px-3 py-2">
          <div className="pb-2">
            <p className="mb-1.5 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
              Elements
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                className="w-full rounded border bg-background px-2 py-1 text-left text-xs hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background"
                disabled={!showElementActions}
                onClick={() => setSeparatorDialogOpen(true)}
                type="button"
              >
                + Separator
              </button>
            </div>
          </div>
          <div className="mt-2 border-t pt-2">
            <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
              Account
            </p>
            <div className="mt-1 rounded border bg-background px-2 py-1.5">
              <p className="truncate font-medium text-xs">{userName}</p>
              {userEmail && (
                <p className="truncate text-[11px] text-muted-foreground">
                  {userEmail}
                </p>
              )}
              <button
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                disabled={signingOut}
                onClick={handleSignOut}
                type="button"
              >
                <SignOut size={12} />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Separator dialog */}
      <AlertDialog
        onOpenChange={setSeparatorDialogOpen}
        open={separatorDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add separator</AlertDialogTitle>
            <AlertDialogDescription>
              Choose the separator orientation to insert on the active slide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onAddSeparator?.("vertical")}>
              <ArrowsVerticalIcon size={13} />
              Vertical
            </AlertDialogAction>
            <AlertDialogAction onClick={() => onAddSeparator?.("horizontal")}>
              <ArrowsHorizontalIcon size={13} />
              Horizontal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        open={deleteTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deck?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be permanently deleted.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  onDeleteDeck(deleteTarget.id);
                }
                setDeleteTarget(null);
              }}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <AlertDialog
        onOpenChange={(open) => !open && setRenameTarget(null)}
        open={renameTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename deck</AlertDialogTitle>
          </AlertDialogHeader>
          <input
            aria-label="New deck title"
            className="w-full rounded border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitRename();
              }
            }}
            type="text"
            value={renameValue}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={commitRename}>Rename</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
