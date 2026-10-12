"use client";

import {
  ArrowSquareOutIcon,
  DotsThreeVerticalIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  DeckSidebarDialogs,
  type KeybindDialogTarget,
} from "@/components/editor/sidebar/deck-sidebar-dialogs";
import { ElementsSection } from "@/components/editor/sidebar/elements-section";
import { NavigationKeybindsSection } from "@/components/editor/sidebar/navigation-keybinds-section";
import { UserMenu } from "@/components/editor/sidebar/user-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
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
import type { ShapeType } from "@/lib/shapes";

interface DeckSidebarProps {
  activeDeckId: string | null;
  decks: Deck[];
  onAddElement?: (element: Omit<CanvasBox, "id">) => void;
  onDeleteAllDecks?: () => void | Promise<void>;
  onDeleteDeck: (id: string) => void | Promise<void>;
  onRenameDeck: (id: string, newTitle: string) => void;
  onSelectDeck: (id: string) => void;
  showElementActions?: boolean;
}

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

export function DeckSidebar({
  decks,
  activeDeckId,
  onAddElement,
  onDeleteAllDecks,
  onSelectDeck,
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
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [youtubeUrlValue, setYoutubeUrlValue] = useState("");
  const [twitterDialogOpen, setTwitterDialogOpen] = useState(false);
  const [twitterUrlValue, setTwitterUrlValue] = useState("");
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [emojiDialogOpen, setEmojiDialogOpen] = useState(false);
  const [shapeDialogOpen, setShapeDialogOpen] = useState(false);
  const [shapeType, setShapeType] = useState<ShapeType>("rect");
  const [shapeColor, setShapeColor] = useState("#84cc16");
  const [urlQrDialogOpen, setUrlQrDialogOpen] = useState(false);
  const [urlQrValue, setUrlQrValue] = useState("");
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
    image?: string | null;
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
      <aside className="flex h-full w-48 shrink-0 flex-col border-r">
        <ul className="no-scrollbar flex flex-1 flex-col gap-1 overflow-auto p-2">
          {decks.map((deck) => (
            <li key={deck.id}>
              <Item
                className={`gap-1 p-1 transition-colors ${
                  deck.id === activeDeckId
                    ? "border-accent/50 bg-accent/60"
                    : "hover:bg-accent/30"
                }`}
                size="xs"
                variant="outline"
              >
                <ItemContent className="min-w-0">
                  <button
                    className={`w-full truncate rounded-md px-2 py-1 text-left text-sm transition-colors ${
                      deck.id === activeDeckId
                        ? "text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => onSelectDeck(deck.id)}
                    type="button"
                  >
                    <ItemTitle className="w-full max-w-full font-normal">
                      {deck.title}
                    </ItemTitle>
                  </button>
                </ItemContent>
                <ItemActions>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label="Deck options"
                        className="shrink-0 text-muted-foreground"
                        size="icon-sm"
                        variant="ghost"
                      >
                        <DotsThreeVerticalIcon size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right">
                      {activeDeckId === deck.id && (
                        <>
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <Link href={`/present/${deck.id}/1`}>
                                <ArrowSquareOutIcon size={13} />
                                Present
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={() => openRename(deck)}>
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setDeleteTarget(deck)}
                          variant="destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ItemActions>
              </Item>
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
            <ElementsSection
              onAddPageNumber={() =>
                onAddElement?.({
                  kind: "page-number",
                  x: 80,
                  y: 88,
                  w: 18,
                  h: 10,
                })
              }
              onAddTimer={() =>
                onAddElement?.({
                  kind: "timer",
                  x: 2,
                  y: 88,
                  w: 18,
                  h: 10,
                })
              }
              onOpenEmoji={() => setEmojiDialogOpen(true)}
              onOpenImage={() => {
                setImageUrlValue("");
                setImageDialogOpen(true);
              }}
              onOpenSeparator={() => setSeparatorDialogOpen(true)}
              onOpenShape={() => setShapeDialogOpen(true)}
              onOpenText={() => {
                setTextValue("");
                setTextDialogOpen(true);
              }}
              onOpenTwitter={() => {
                setTwitterUrlValue("");
                setTwitterDialogOpen(true);
              }}
              onOpenUrlQr={() => {
                setUrlQrValue("");
                setUrlQrDialogOpen(true);
              }}
              onOpenYoutube={() => {
                setYoutubeUrlValue("");
                setYoutubeDialogOpen(true);
              }}
              showElementActions={showElementActions}
            />
            <NavigationKeybindsSection
              onSetNextKey={() => {
                setKeybindDialogTarget("nextKey");
                setPendingKeybindValue(navigationKeybinds.nextKey);
                setKeybindDialogError(null);
                setKeybindDialogOpen(true);
              }}
              onSetPrevKey={() => {
                setKeybindDialogTarget("prevKey");
                setPendingKeybindValue(navigationKeybinds.prevKey);
                setKeybindDialogError(null);
                setKeybindDialogOpen(true);
              }}
            />
          </div>
          <div className="-mx-3 mt-2 border-t pt-2">
            <UserMenu
              onDeleteAccount={() => {
                setDeleteAccountDialogOpen(true);
              }}
              onSignOut={handleSignOut}
              sessionUser={sessionUser}
              signingOut={signingOut}
            />
          </div>
        </div>
      </aside>

      <DeckSidebarDialogs
        canSavePendingKeybind={canSavePendingKeybind}
        decksLength={decks.length}
        deleteAccountDialogOpen={deleteAccountDialogOpen}
        deleteAccountError={deleteAccountError}
        deleteAllDecksDialogOpen={deleteAllDecksDialogOpen}
        deleteTarget={deleteTarget}
        deletingAccount={deletingAccount}
        deletingAllDecks={deletingAllDecks}
        emojiDialogOpen={emojiDialogOpen}
        formatNavigationKeyLabel={formatNavigationKeyLabel}
        handleDeleteAccount={handleDeleteAccount}
        handleDeleteAllDecks={handleDeleteAllDecks}
        imageDialogOpen={imageDialogOpen}
        imageUrlValue={imageUrlValue}
        keybindDialogError={keybindDialogError}
        keybindDialogOpen={keybindDialogOpen}
        keybindDialogTarget={keybindDialogTarget}
        navigationNextKey={navigationKeybinds.nextKey}
        navigationPrevKey={navigationKeybinds.prevKey}
        onAddElement={(element) => onAddElement?.(element)}
        onDeleteAccountDialogOpenChange={(open) => {
          setDeleteAccountDialogOpen(open);
          if (!open) {
            setDeleteAccountError(null);
          }
        }}
        onDeleteAllDecksDialogOpenChange={setDeleteAllDecksDialogOpen}
        onDeleteDeck={() => {
          if (deleteTarget) {
            onDeleteDeck(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onDeleteTargetOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onEmojiDialogOpenChange={setEmojiDialogOpen}
        onImageDialogOpenChange={setImageDialogOpen}
        onImageUrlChange={setImageUrlValue}
        onKeybindDialogOpenChange={(open) => {
          setKeybindDialogOpen(open);
          if (!open) {
            setKeybindDialogTarget(null);
            setPendingKeybindValue(null);
            setKeybindDialogError(null);
          }
        }}
        onRenameTargetOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
          }
        }}
        onRenameValueChange={setRenameValue}
        onResetKeybinds={() => {
          updateNavigationKeybinds(DEFAULT_NAVIGATION_KEYBINDS);
          if (keybindDialogTarget === "prevKey") {
            setPendingKeybindValue(DEFAULT_NAVIGATION_KEYBINDS.prevKey);
          } else if (keybindDialogTarget === "nextKey") {
            setPendingKeybindValue(DEFAULT_NAVIGATION_KEYBINDS.nextKey);
          }
          setKeybindDialogError(null);
        }}
        onSavePendingKeybind={savePendingKeybind}
        onSeparatorDialogOpenChange={setSeparatorDialogOpen}
        onShapeColorChange={setShapeColor}
        onShapeDialogOpenChange={setShapeDialogOpen}
        onShapeTypeChange={setShapeType}
        onTextDialogOpenChange={setTextDialogOpen}
        onTextValueChange={setTextValue}
        onTwitterDialogOpenChange={setTwitterDialogOpen}
        onTwitterUrlChange={setTwitterUrlValue}
        onUrlQrDialogOpenChange={setUrlQrDialogOpen}
        onUrlQrValueChange={setUrlQrValue}
        onYoutubeDialogOpenChange={setYoutubeDialogOpen}
        onYoutubeUrlChange={setYoutubeUrlValue}
        pendingKeybindValue={pendingKeybindValue}
        renameTarget={renameTarget}
        renameValue={renameValue}
        saveRename={commitRename}
        separatorDialogOpen={separatorDialogOpen}
        shapeColor={shapeColor}
        shapeDialogOpen={shapeDialogOpen}
        shapeType={shapeType}
        textDialogOpen={textDialogOpen}
        textValue={textValue}
        twitterDialogOpen={twitterDialogOpen}
        twitterUrlValue={twitterUrlValue}
        urlQrDialogOpen={urlQrDialogOpen}
        urlQrValue={urlQrValue}
        youtubeDialogOpen={youtubeDialogOpen}
        youtubeUrlValue={youtubeUrlValue}
      />
    </>
  );
}
