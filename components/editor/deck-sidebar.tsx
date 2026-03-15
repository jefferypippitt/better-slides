"use client";

import {
  ArrowSquareOutIcon,
  ArrowsHorizontalIcon,
  ArrowsVerticalIcon,
  DotsThreeVerticalIcon,
  Plus,
  SignOut,
} from "@phosphor-icons/react";
import { EmojiPicker } from "frimousse";
import Link from "next/link";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient, signOut as authSignOut } from "@/lib/auth-client";
import type { CanvasBox, Deck } from "@/lib/decks";
import {
  canUseAsNavigationKey,
  DEFAULT_NAVIGATION_KEYBINDS,
  formatNavigationKeyLabel,
  loadNavigationKeybinds,
  type NavigationKeybinds,
  normalizeNavigationKey,
  saveNavigationKeybinds,
} from "@/lib/navigation-keybinds";

interface DeckSidebarProps {
  activeDeckId: string | null;
  decks: Deck[];
  onAddElement?: (element: Omit<CanvasBox, "id">) => void;
  onDeleteAllDecks?: () => void | Promise<void>;
  onDeleteDeck: (id: string) => void | Promise<void>;
  onNewDeck: () => void;
  onRenameDeck: (id: string, newTitle: string) => void;
  onSelectDeck: (id: string) => void;
  showElementActions?: boolean;
}

type KeybindDialogTarget = "nextKey" | "prevKey";

function getCurrentTargetKey(
  target: KeybindDialogTarget | null,
  keybinds: NavigationKeybinds
): string | null {
  if (target === "nextKey") {
    return keybinds.nextKey;
  }
  if (target === "prevKey") {
    return keybinds.prevKey;
  }
  return null;
}

function hasNavigationKeyConflict(
  target: KeybindDialogTarget | null,
  pendingKey: string | null,
  keybinds: NavigationKeybinds
): boolean {
  if (!pendingKey) {
    return false;
  }
  if (target === "nextKey") {
    return pendingKey === keybinds.prevKey;
  }
  if (target === "prevKey") {
    return pendingKey === keybinds.nextKey;
  }
  return false;
}

function withUpdatedNavigationKey(
  target: KeybindDialogTarget,
  pendingKey: string,
  keybinds: NavigationKeybinds
): NavigationKeybinds {
  if (target === "nextKey") {
    return {
      ...keybinds,
      nextKey: pendingKey,
    };
  }

  return {
    ...keybinds,
    prevKey: pendingKey,
  };
}

function EmojiCategoryHeader({
  category,
  ...props
}: {
  category: { label: string };
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="bg-background px-3 pt-2 pb-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wide"
      {...props}
    >
      {category.label}
    </div>
  );
}

function EmojiRow({
  children,
  ...props
}: { children?: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="scroll-my-1 px-1.5" {...props}>
      {children}
    </div>
  );
}

function EmojiButton({
  emoji,
  ...props
}: {
  emoji: { emoji: string };
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex size-8 items-center justify-center rounded text-lg data-active:bg-accent"
      type="button"
      {...props}
    >
      {emoji.emoji}
    </button>
  );
}

export function DeckSidebar({
  decks,
  activeDeckId,
  onAddElement,
  onDeleteAllDecks,
  onSelectDeck,
  onNewDeck,
  onDeleteDeck,
  onRenameDeck,
  showElementActions = false,
}: DeckSidebarProps) {
  const [deleteTarget, setDeleteTarget] = useState<Deck | null>(null);
  const [deleteAllDecksDialogOpen, setDeleteAllDecksDialogOpen] =
    useState(false);
  const [deletingAllDecks, setDeletingAllDecks] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Deck | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [separatorDialogOpen, setSeparatorDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrlValue, setImageUrlValue] = useState("");
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [emojiDialogOpen, setEmojiDialogOpen] = useState(false);
  const [shapeDialogOpen, setShapeDialogOpen] = useState(false);
  const [shapeType, setShapeType] = useState<"rect" | "circle">("rect");
  const [shapeColor, setShapeColor] = useState("#84cc16");
  const [signingOut, setSigningOut] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(
    null
  );
  const [navigationKeybinds, setNavigationKeybinds] =
    useState<NavigationKeybinds>(DEFAULT_NAVIGATION_KEYBINDS);
  const [keybindDialogOpen, setKeybindDialogOpen] = useState(false);
  const [keybindDialogTarget, setKeybindDialogTarget] =
    useState<KeybindDialogTarget | null>(null);
  const [pendingKeybindValue, setPendingKeybindValue] = useState<string | null>(
    null
  );
  const [keybindDialogError, setKeybindDialogError] = useState<string | null>(
    null
  );
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

  useEffect(() => {
    setNavigationKeybinds(loadNavigationKeybinds());
  }, []);

  const updateNavigationKeybinds = useCallback((next: NavigationKeybinds) => {
    setNavigationKeybinds(next);
    saveNavigationKeybinds(next);
  }, []);

  useEffect(() => {
    if (!(keybindDialogOpen && keybindDialogTarget)) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        setKeybindDialogOpen(false);
        setKeybindDialogTarget(null);
        setPendingKeybindValue(null);
        setKeybindDialogError(null);
        return;
      }

      if (!canUseAsNavigationKey(event.key)) {
        setKeybindDialogError("That key cannot be used for navigation.");
        return;
      }

      const nextKey = normalizeNavigationKey(event.key);
      setPendingKeybindValue(nextKey);
      if (
        (keybindDialogTarget === "nextKey" &&
          nextKey === navigationKeybinds.prevKey) ||
        (keybindDialogTarget === "prevKey" &&
          nextKey === navigationKeybinds.nextKey)
      ) {
        setKeybindDialogError("Next and previous must be different keys.");
        return;
      }
      setKeybindDialogError(null);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [keybindDialogOpen, keybindDialogTarget, navigationKeybinds]);

  const currentTargetKey = getCurrentTargetKey(
    keybindDialogTarget,
    navigationKeybinds
  );
  const hasPendingConflict = hasNavigationKeyConflict(
    keybindDialogTarget,
    pendingKeybindValue,
    navigationKeybinds
  );

  const canSavePendingKeybind = Boolean(
    keybindDialogTarget &&
      pendingKeybindValue &&
      currentTargetKey &&
      pendingKeybindValue !== currentTargetKey &&
      !hasPendingConflict &&
      !keybindDialogError
  );

  function savePendingKeybind() {
    if (!(keybindDialogTarget && pendingKeybindValue && currentTargetKey)) {
      return;
    }
    if (pendingKeybindValue === currentTargetKey) {
      setKeybindDialogError("Choose a different key before saving.");
      return;
    }
    if (
      hasNavigationKeyConflict(
        keybindDialogTarget,
        pendingKeybindValue,
        navigationKeybinds
      )
    ) {
      setKeybindDialogError("Next and previous must be different keys.");
      return;
    }

    updateNavigationKeybinds(
      withUpdatedNavigationKey(
        keybindDialogTarget,
        pendingKeybindValue,
        navigationKeybinds
      )
    );

    setKeybindDialogOpen(false);
    setKeybindDialogTarget(null);
    setPendingKeybindValue(null);
    setKeybindDialogError(null);
  }

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

  async function handleDeleteAccount() {
    if (deletingAccount) {
      return;
    }
    setDeletingAccount(true);
    setDeleteAccountError(null);

    try {
      const result = await authClient.deleteUser();
      if (result.error) {
        setDeleteAccountError(
          result.error.message || "Unable to delete account."
        );
        return;
      }
      window.location.href = "/sign-in";
    } catch {
      setDeleteAccountError("Unable to delete account.");
    } finally {
      setDeletingAccount(false);
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

  async function handleDeleteAllDecks() {
    if (!onDeleteAllDecks || deletingAllDecks || decks.length === 0) {
      return;
    }
    setDeletingAllDecks(true);
    try {
      await onDeleteAllDecks();
      setDeleteAllDecksDialogOpen(false);
    } finally {
      setDeletingAllDecks(false);
    }
  }

  return (
    <>
      <aside className="flex h-full w-48 shrink-0 flex-col border-r bg-muted/30">
        <div className="border-b px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-widest">
              Decks
            </p>
            <button
              aria-label="New deck"
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              onClick={onNewDeck}
              type="button"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <ul className="no-scrollbar flex-1 overflow-auto py-1">
          {decks.map((deck) => (
            <li className="group flex items-center gap-1 px-2" key={deck.id}>
              <button
                className={`flex-1 truncate rounded border border-transparent px-2 py-1 text-left text-sm transition-colors ${
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
            <div className="mt-1 rounded border bg-background">
              <DropdownMenu>
                <div className="flex items-start justify-between gap-2 px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-xs">Elements</p>
                  </div>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Add element"
                      className="mt-0.5 rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!showElementActions}
                      type="button"
                    >
                      <DotsThreeVerticalIcon size={14} />
                    </button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end" side="top" sideOffset={6}>
                  <DropdownMenuLabel className="text-[11px]">
                    Add element
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setSeparatorDialogOpen(true)}
                  >
                    Separator
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setImageUrlValue("");
                      setImageDialogOpen(true);
                    }}
                  >
                    Image
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setTextValue("");
                      setTextDialogOpen(true);
                    }}
                  >
                    Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setShapeDialogOpen(true)}>
                    Shape
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() =>
                      onAddElement?.({
                        kind: "page-number",
                        x: 80,
                        y: 88,
                        w: 18,
                        h: 10,
                      })
                    }
                  >
                    Page number
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      onAddElement?.({
                        kind: "timer",
                        x: 2,
                        y: 88,
                        w: 18,
                        h: 10,
                      })
                    }
                  >
                    Timer
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setEmojiDialogOpen(true)}>
                    Emoji
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-1 rounded border bg-background">
              <DropdownMenu>
                <div className="flex items-start justify-between gap-2 px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-xs">
                      Navigation Keybinds
                    </p>
                  </div>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Navigation key options"
                      className="mt-0.5 rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                      type="button"
                    >
                      <DotsThreeVerticalIcon size={14} />
                    </button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end" side="top" sideOffset={6}>
                  <DropdownMenuLabel className="text-[11px]">
                    Update Keybinds
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      setKeybindDialogTarget("prevKey");
                      setPendingKeybindValue(navigationKeybinds.prevKey);
                      setKeybindDialogError(null);
                      setKeybindDialogOpen(true);
                    }}
                  >
                    Set Previous Key
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setKeybindDialogTarget("nextKey");
                      setPendingKeybindValue(navigationKeybinds.nextKey);
                      setKeybindDialogError(null);
                      setKeybindDialogOpen(true);
                    }}
                  >
                    Set Next Key
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="-mx-3 mt-2 border-t px-3 pt-2">
            <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
              Account
            </p>
            <div className="mt-1 rounded border bg-background">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Account options"
                    className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-accent/40"
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-xs">{userName}</p>
                      {userEmail && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {userEmail}
                        </p>
                      )}
                    </div>
                    <DotsThreeVerticalIcon
                      className="mt-0.5 shrink-0 text-muted-foreground"
                      size={14}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" sideOffset={6}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-xs">{userName}</p>
                      {userEmail && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {userEmail}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Decks</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        disabled={decks.length === 0 || deletingAllDecks}
                        onSelect={() => {
                          setDeleteAllDecksDialogOpen(true);
                        }}
                        variant="destructive"
                      >
                        Delete all
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Settings</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        disabled={signingOut}
                        onSelect={() => {
                          handleSignOut();
                        }}
                        variant="destructive"
                      >
                        <SignOut size={12} />
                        {signingOut ? "Signing out..." : "Sign out"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setDeleteAccountDialogOpen(true)}
                        variant="destructive"
                      >
                        Delete account
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </aside>

      {/* Separator dialog */}
      <AlertDialog
        onOpenChange={(open) => {
          setKeybindDialogOpen(open);
          if (!open) {
            setKeybindDialogTarget(null);
            setPendingKeybindValue(null);
            setKeybindDialogError(null);
          }
        }}
        open={keybindDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Set {keybindDialogTarget === "prevKey" ? "previous" : "next"} key
            </AlertDialogTitle>
            <AlertDialogDescription>
              Current keybinds are shown below.
            </AlertDialogDescription>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="default">
                Prev: {formatNavigationKeyLabel(navigationKeybinds.prevKey)}
              </Badge>
              <Badge variant="outline">
                Next: {formatNavigationKeyLabel(navigationKeybinds.nextKey)}
              </Badge>
            </div>
            <div className="pt-3">
              <p className="text-[12px] text-muted-foreground">
                Press any key to set a new value:
              </p>
            </div>
            <div className="pt-1">
              <p className="text-[12px] text-muted-foreground">New key</p>
              <Badge
                className="mt-1"
                variant={pendingKeybindValue ? "secondary" : "secondary"}
              >
                {pendingKeybindValue
                  ? formatNavigationKeyLabel(pendingKeybindValue)
                  : "Press a key..."}
              </Badge>
            </div>
            {keybindDialogError && (
              <p className="pt-1 text-[11px] text-destructive">
                {keybindDialogError}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <Button
              onClick={() => {
                updateNavigationKeybinds(DEFAULT_NAVIGATION_KEYBINDS);
                if (keybindDialogTarget === "prevKey") {
                  setPendingKeybindValue(DEFAULT_NAVIGATION_KEYBINDS.prevKey);
                } else if (keybindDialogTarget === "nextKey") {
                  setPendingKeybindValue(DEFAULT_NAVIGATION_KEYBINDS.nextKey);
                }
                setKeybindDialogError(null);
              }}
              type="button"
              variant="outline"
            >
              Reset
            </Button>
            <div className="flex items-center gap-2">
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction
                disabled={!canSavePendingKeybind}
                onClick={savePendingKeybind}
              >
                Save
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogAction
              onClick={() => {
                onAddElement?.({
                  kind: "separator",
                  x: 48,
                  y: 15,
                  w: 4,
                  h: 70,
                });
                setSeparatorDialogOpen(false);
              }}
            >
              <ArrowsVerticalIcon size={13} />
              Vertical
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                onAddElement?.({
                  kind: "separator",
                  x: 15,
                  y: 48,
                  w: 70,
                  h: 4,
                });
                setSeparatorDialogOpen(false);
              }}
            >
              <ArrowsHorizontalIcon size={13} />
              Horizontal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image dialog */}
      <AlertDialog onOpenChange={setImageDialogOpen} open={imageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add image</AlertDialogTitle>
            <AlertDialogDescription>
              Paste an image URL to embed on the slide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            aria-label="Image URL"
            className="w-full rounded border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            onChange={(e) => setImageUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && imageUrlValue.trim()) {
                onAddElement?.({
                  kind: "image",
                  imageUrl: imageUrlValue.trim(),
                  x: 10,
                  y: 10,
                  w: 40,
                  h: 50,
                });
                setImageDialogOpen(false);
              }
            }}
            placeholder="https://example.com/image.png"
            type="url"
            value={imageUrlValue}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!imageUrlValue.trim()}
              onClick={() => {
                onAddElement?.({
                  kind: "image",
                  imageUrl: imageUrlValue.trim(),
                  x: 10,
                  y: 10,
                  w: 40,
                  h: 50,
                });
                setImageDialogOpen(false);
              }}
            >
              Add image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Text dialog */}
      <AlertDialog onOpenChange={setTextDialogOpen} open={textDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add text box</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the text to display on the slide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            aria-label="Text content"
            className="w-full rounded border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && textValue.trim()) {
                onAddElement?.({
                  kind: "text",
                  staticText: textValue.trim(),
                  x: 10,
                  y: 10,
                  w: 40,
                  h: 20,
                  textStyle: "subtitle",
                });
                setTextDialogOpen(false);
              }
            }}
            placeholder="Your text here"
            type="text"
            value={textValue}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!textValue.trim()}
              onClick={() => {
                onAddElement?.({
                  kind: "text",
                  staticText: textValue.trim(),
                  x: 10,
                  y: 10,
                  w: 40,
                  h: 20,
                  textStyle: "subtitle",
                });
                setTextDialogOpen(false);
              }}
            >
              Add text
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shape dialog */}
      <AlertDialog onOpenChange={setEmojiDialogOpen} open={emojiDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add emoji</AlertDialogTitle>
            <AlertDialogDescription>
              Pick an emoji to insert on the active slide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <EmojiPicker.Root
            className="isolate flex h-[320px] w-full min-w-0 flex-col rounded border bg-background"
            onEmojiSelect={({ emoji }) => {
              onAddElement?.({
                kind: "text",
                staticText: emoji,
                textStyle: "title",
                x: 70,
                y: 20,
                w: 14,
                h: 14,
              });
              setEmojiDialogOpen(false);
            }}
          >
            <EmojiPicker.Search
              className="mx-2 mt-2 rounded border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              placeholder="Search emoji"
            />
            <EmojiPicker.Viewport className="relative mt-1 flex-1 outline-none">
              <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Loading...
              </EmojiPicker.Loading>
              <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                No emoji found.
              </EmojiPicker.Empty>
              <EmojiPicker.List
                className="select-none pb-1.5"
                components={{
                  CategoryHeader: EmojiCategoryHeader,
                  Row: EmojiRow,
                  Emoji: EmojiButton,
                }}
              />
            </EmojiPicker.Viewport>
          </EmojiPicker.Root>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shape dialog */}
      <AlertDialog onOpenChange={setShapeDialogOpen} open={shapeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add shape</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a shape type and color.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                className={`flex-1 rounded border px-3 py-2 text-sm transition-colors ${shapeType === "rect" ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                onClick={() => setShapeType("rect")}
                type="button"
              >
                Rectangle
              </button>
              <button
                className={`flex-1 rounded border px-3 py-2 text-sm transition-colors ${shapeType === "circle" ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                onClick={() => setShapeType("circle")}
                type="button"
              >
                Circle
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Color</span>
              <input
                className="h-8 w-16 cursor-pointer rounded border"
                onChange={(e) => setShapeColor(e.target.value)}
                type="color"
                value={shapeColor}
              />
              <span className="font-mono text-muted-foreground text-xs">
                {shapeColor}
              </span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onAddElement?.({
                  kind: "shape",
                  shapeType,
                  shapeColor,
                  x: 20,
                  y: 20,
                  w: 30,
                  h: 30,
                });
                setShapeDialogOpen(false);
              }}
            >
              Add shape
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog
        onOpenChange={setDeleteAllDecksDialogOpen}
        open={deleteAllDecksDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all decks?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes all decks in your workspace. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAllDecks}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingAllDecks || decks.length === 0}
              onClick={async (event) => {
                event.preventDefault();
                await handleDeleteAllDecks();
              }}
              variant="destructive"
            >
              {deletingAllDecks ? "Deleting..." : "Delete all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Account delete confirmation */}
      <AlertDialog
        onOpenChange={(open) => {
          setDeleteAccountDialogOpen(open);
          if (!open) {
            setDeleteAccountError(null);
          }
        }}
        open={deleteAccountDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
            {deleteAccountError && (
              <p className="pt-1 text-[11px] text-destructive">
                {deleteAccountError}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAccount}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingAccount}
              onClick={() => {
                handleDeleteAccount();
              }}
              variant="destructive"
            >
              {deletingAccount ? "Deleting..." : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
