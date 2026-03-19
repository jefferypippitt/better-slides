"use client";

import {
  ArrowsHorizontalIcon,
  ArrowsVerticalIcon,
} from "@phosphor-icons/react";
import { EmojiPicker } from "frimousse";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
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
import type { Deck } from "@/lib/decks";

export type KeybindDialogTarget = "nextKey" | "prevKey";

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

interface DeckSidebarDialogsProps {
  canSavePendingKeybind: boolean;
  decksLength: number;
  deleteAccountDialogOpen: boolean;
  deleteAccountError: string | null;
  deleteAllDecksDialogOpen: boolean;
  deleteTarget: Deck | null;
  deletingAccount: boolean;
  deletingAllDecks: boolean;
  emojiDialogOpen: boolean;
  formatNavigationKeyLabel: (key: string) => string;
  handleDeleteAccount: () => void;
  handleDeleteAllDecks: () => Promise<void>;
  imageDialogOpen: boolean;
  imageUrlValue: string;
  keybindDialogError: string | null;
  keybindDialogOpen: boolean;
  keybindDialogTarget: KeybindDialogTarget | null;
  navigationNextKey: string;
  navigationPrevKey: string;
  onAddElement: (element: {
    kind:
      | "image"
      | "page-number"
      | "separator"
      | "shape"
      | "text"
      | "timer"
      | "twitter"
      | "url-qr"
      | "youtube";
    customQrUrl?: string;
    h: number;
    imageUrl?: string;
    shapeColor?: string;
    shapeType?: "circle" | "rect";
    staticText?: string;
    textStyle?: "body" | "subtitle" | "title";
    twitterUrl?: string;
    w: number;
    x: number;
    y: number;
    youtubeUrl?: string;
  }) => void;
  onDeleteAccountDialogOpenChange: (open: boolean) => void;
  onDeleteAllDecksDialogOpenChange: (open: boolean) => void;
  onDeleteDeck: () => void;
  onDeleteTargetOpenChange: (open: boolean) => void;
  onEmojiDialogOpenChange: (open: boolean) => void;
  onImageDialogOpenChange: (open: boolean) => void;
  onImageUrlChange: (value: string) => void;
  onKeybindDialogOpenChange: (open: boolean) => void;
  onRenameTargetOpenChange: (open: boolean) => void;
  onRenameValueChange: (value: string) => void;
  onResetKeybinds: () => void;
  onSavePendingKeybind: () => void;
  onSeparatorDialogOpenChange: (open: boolean) => void;
  onShapeColorChange: (value: string) => void;
  onShapeDialogOpenChange: (open: boolean) => void;
  onShapeTypeChange: (value: "circle" | "rect") => void;
  onTextDialogOpenChange: (open: boolean) => void;
  onTextValueChange: (value: string) => void;
  onTwitterDialogOpenChange: (open: boolean) => void;
  onTwitterUrlChange: (value: string) => void;
  onUrlQrDialogOpenChange: (open: boolean) => void;
  onUrlQrValueChange: (value: string) => void;
  onYoutubeDialogOpenChange: (open: boolean) => void;
  onYoutubeUrlChange: (value: string) => void;
  pendingKeybindValue: string | null;
  renameTarget: Deck | null;
  renameValue: string;
  saveRename: () => void;
  separatorDialogOpen: boolean;
  shapeColor: string;
  shapeDialogOpen: boolean;
  shapeType: "circle" | "rect";
  textDialogOpen: boolean;
  textValue: string;
  twitterDialogOpen: boolean;
  twitterUrlValue: string;
  urlQrDialogOpen: boolean;
  urlQrValue: string;
  youtubeDialogOpen: boolean;
  youtubeUrlValue: string;
}

export function DeckSidebarDialogs({
  canSavePendingKeybind,
  decksLength,
  deleteAccountDialogOpen,
  deleteAccountError,
  deleteTarget,
  deletingAccount,
  deletingAllDecks,
  formatNavigationKeyLabel,
  handleDeleteAccount,
  handleDeleteAllDecks,
  imageDialogOpen,
  imageUrlValue,
  keybindDialogError,
  keybindDialogOpen,
  keybindDialogTarget,
  navigationNextKey,
  navigationPrevKey,
  onAddElement,
  onDeleteAccountDialogOpenChange,
  onDeleteDeck,
  onDeleteTargetOpenChange,
  onDeleteAllDecksDialogOpenChange,
  onEmojiDialogOpenChange,
  onImageDialogOpenChange,
  onImageUrlChange,
  onKeybindDialogOpenChange,
  onRenameTargetOpenChange,
  onRenameValueChange,
  onResetKeybinds,
  onSavePendingKeybind,
  onSeparatorDialogOpenChange,
  onShapeColorChange,
  onShapeDialogOpenChange,
  onShapeTypeChange,
  onTextDialogOpenChange,
  onTextValueChange,
  onTwitterDialogOpenChange,
  onTwitterUrlChange,
  onUrlQrDialogOpenChange,
  onUrlQrValueChange,
  onYoutubeDialogOpenChange,
  onYoutubeUrlChange,
  pendingKeybindValue,
  renameTarget,
  renameValue,
  saveRename,
  separatorDialogOpen,
  shapeColor,
  shapeDialogOpen,
  shapeType,
  textDialogOpen,
  textValue,
  twitterDialogOpen,
  twitterUrlValue,
  urlQrDialogOpen,
  urlQrValue,
  youtubeDialogOpen,
  youtubeUrlValue,
  emojiDialogOpen,
  deleteAllDecksDialogOpen,
}: DeckSidebarDialogsProps) {
  return (
    <>
      <AlertDialog
        onOpenChange={onKeybindDialogOpenChange}
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
                Prev: {formatNavigationKeyLabel(navigationPrevKey)}
              </Badge>
              <Badge variant="outline">
                Next: {formatNavigationKeyLabel(navigationNextKey)}
              </Badge>
            </div>
            <div className="pt-3">
              <p className="text-[12px] text-muted-foreground">
                Press any key to set a new value:
              </p>
            </div>
            <div className="pt-1">
              <p className="text-[12px] text-muted-foreground">New key</p>
              <Badge className="mt-1" variant="secondary">
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
            <Button onClick={onResetKeybinds} type="button" variant="outline">
              Reset
            </Button>
            <div className="flex items-center gap-2">
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction
                disabled={!canSavePendingKeybind}
                onClick={onSavePendingKeybind}
              >
                Save
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={onSeparatorDialogOpenChange}
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
                onAddElement({
                  kind: "separator",
                  x: 48,
                  y: 15,
                  w: 4,
                  h: 70,
                });
                onSeparatorDialogOpenChange(false);
              }}
            >
              <ArrowsVerticalIcon size={13} />
              Vertical
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                onAddElement({
                  kind: "separator",
                  x: 15,
                  y: 48,
                  w: 70,
                  h: 4,
                });
                onSeparatorDialogOpenChange(false);
              }}
            >
              <ArrowsHorizontalIcon size={13} />
              Horizontal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={onImageDialogOpenChange}
        open={imageDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add image</AlertDialogTitle>
            <AlertDialogDescription>
              Paste an image URL to embed on the slide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="Image URL"
            onChange={(e) => onImageUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && imageUrlValue.trim()) {
                onAddElement({
                  kind: "image",
                  imageUrl: imageUrlValue.trim(),
                  x: 10,
                  y: 10,
                  w: 40,
                  h: 50,
                });
                onImageDialogOpenChange(false);
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
                onAddElement({
                  kind: "image",
                  imageUrl: imageUrlValue.trim(),
                  x: 10,
                  y: 10,
                  w: 40,
                  h: 50,
                });
                onImageDialogOpenChange(false);
              }}
            >
              Add image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={onYoutubeDialogOpenChange}
        open={youtubeDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add YouTube video</AlertDialogTitle>
            <AlertDialogDescription>
              Paste a YouTube video URL to embed on the slide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="YouTube URL"
            onChange={(e) => onYoutubeUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && youtubeUrlValue.trim()) {
                onAddElement({
                  kind: "youtube",
                  youtubeUrl: youtubeUrlValue.trim(),
                  x: 10,
                  y: 10,
                  w: 60,
                  h: 55,
                });
                onYoutubeDialogOpenChange(false);
              }
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            type="url"
            value={youtubeUrlValue}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!youtubeUrlValue.trim()}
              onClick={() => {
                onAddElement({
                  kind: "youtube",
                  youtubeUrl: youtubeUrlValue.trim(),
                  x: 10,
                  y: 10,
                  w: 60,
                  h: 55,
                });
                onYoutubeDialogOpenChange(false);
              }}
            >
              Add video
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={onTwitterDialogOpenChange}
        open={twitterDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add X / Twitter post</AlertDialogTitle>
            <AlertDialogDescription>
              Paste a tweet or X post URL to embed on the slide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="X / Twitter post URL"
            onChange={(e) => onTwitterUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && twitterUrlValue.trim()) {
                onAddElement({
                  kind: "twitter",
                  twitterUrl: twitterUrlValue.trim(),
                  x: 10,
                  y: 10,
                  w: 35,
                  h: 60,
                });
                onTwitterDialogOpenChange(false);
              }
            }}
            placeholder="https://x.com/user/status/..."
            type="url"
            value={twitterUrlValue}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!twitterUrlValue.trim()}
              onClick={() => {
                onAddElement({
                  kind: "twitter",
                  twitterUrl: twitterUrlValue.trim(),
                  x: 10,
                  y: 10,
                  w: 35,
                  h: 60,
                });
                onTwitterDialogOpenChange(false);
              }}
            >
              Add post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={onTextDialogOpenChange} open={textDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add text box</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the text to display on the slide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="Text content"
            onChange={(e) => onTextValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && textValue.trim()) {
                onAddElement({
                  kind: "text",
                  staticText: textValue.trim(),
                  x: 10,
                  y: 10,
                  w: 40,
                  h: 20,
                  textStyle: "subtitle",
                });
                onTextDialogOpenChange(false);
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
                onAddElement({
                  kind: "text",
                  staticText: textValue.trim(),
                  x: 10,
                  y: 10,
                  w: 40,
                  h: 20,
                  textStyle: "subtitle",
                });
                onTextDialogOpenChange(false);
              }}
            >
              Add text
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={onEmojiDialogOpenChange}
        open={emojiDialogOpen}
      >
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
              onAddElement({
                kind: "text",
                staticText: emoji,
                textStyle: "title",
                x: 70,
                y: 20,
                w: 14,
                h: 14,
              });
              onEmojiDialogOpenChange(false);
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

      <AlertDialog
        onOpenChange={onShapeDialogOpenChange}
        open={shapeDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add shape</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a shape type and color.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => onShapeTypeChange("rect")}
                variant={shapeType === "rect" ? "secondary" : "outline"}
              >
                Rectangle
              </Button>
              <Button
                className="flex-1"
                onClick={() => onShapeTypeChange("circle")}
                variant={shapeType === "circle" ? "secondary" : "outline"}
              >
                Circle
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Color</span>
              <input
                className="h-8 w-16 cursor-pointer rounded border"
                onChange={(e) => onShapeColorChange(e.target.value)}
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
                onAddElement({
                  kind: "shape",
                  shapeType,
                  shapeColor,
                  x: 20,
                  y: 20,
                  w: 30,
                  h: 30,
                });
                onShapeDialogOpenChange(false);
              }}
            >
              Add shape
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={onUrlQrDialogOpenChange}
        open={urlQrDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add QR code</AlertDialogTitle>
            <AlertDialogDescription>
              Paste a URL to generate a QR code on the slide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            onChange={(e) => onUrlQrValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && urlQrValue.trim()) {
                onAddElement({
                  kind: "url-qr",
                  customQrUrl: urlQrValue.trim(),
                  x: 30,
                  y: 15,
                  w: 30,
                  h: 70,
                });
                onUrlQrDialogOpenChange(false);
              }
            }}
            placeholder="https://example.com"
            type="url"
            value={urlQrValue}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!urlQrValue.trim()}
              onClick={() => {
                onAddElement({
                  kind: "url-qr",
                  customQrUrl: urlQrValue.trim(),
                  x: 30,
                  y: 15,
                  w: 30,
                  h: 70,
                });
                onUrlQrDialogOpenChange(false);
              }}
            >
              Add QR code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={onDeleteAllDecksDialogOpenChange}
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
              disabled={deletingAllDecks || decksLength === 0}
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
        onOpenChange={onDeleteTargetOpenChange}
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
            <AlertDialogAction onClick={onDeleteDeck} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={onRenameTargetOpenChange}
        open={renameTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename deck</AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            aria-label="New deck title"
            onChange={(e) => onRenameValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                saveRename();
              }
            }}
            type="text"
            value={renameValue}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveRename}>Rename</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={onDeleteAccountDialogOpenChange}
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
              onClick={handleDeleteAccount}
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
