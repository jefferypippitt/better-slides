"use client";

import { DotsThreeVerticalIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";

interface ElementsSectionProps {
  onAddPageNumber: () => void;
  onAddTimer: () => void;
  onOpenEmoji: () => void;
  onOpenImage: () => void;
  onOpenSeparator: () => void;
  onOpenShape: () => void;
  onOpenText: () => void;
  onOpenTwitter: () => void;
  onOpenUrlQr: () => void;
  onOpenYoutube: () => void;
  showElementActions: boolean;
}

export function ElementsSection({
  onAddPageNumber,
  onAddTimer,
  onOpenEmoji,
  onOpenImage,
  onOpenSeparator,
  onOpenShape,
  onOpenText,
  onOpenTwitter,
  onOpenUrlQr,
  onOpenYoutube,
  showElementActions,
}: ElementsSectionProps) {
  return (
    <DropdownMenu>
      <Item
        className="mt-1 gap-1 p-1 transition-colors hover:bg-accent/30"
        size="xs"
        variant="outline"
      >
        <ItemContent className="min-w-0">
          <ItemTitle className="w-full max-w-full rounded-md px-2 py-1 font-medium text-muted-foreground text-xs">
            Elements
          </ItemTitle>
        </ItemContent>
        <ItemActions>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Add element"
              className="shrink-0 text-muted-foreground"
              disabled={!showElementActions}
              size="icon-sm"
              variant="ghost"
            >
              <DotsThreeVerticalIcon size={14} />
            </Button>
          </DropdownMenuTrigger>
        </ItemActions>
      </Item>
      <DropdownMenuContent align="end" side="top" sideOffset={6}>
        <DropdownMenuLabel>Add element</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onOpenSeparator}>
            Separator
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenImage}>Image</DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenYoutube}>YouTube</DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenTwitter}>
            X / Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenText}>Text</DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenShape}>Shape</DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenEmoji}>Emoji</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onAddPageNumber}>
            Page number
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onAddTimer}>Timer</DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenUrlQr}>QR Code</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
