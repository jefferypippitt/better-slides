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

export interface NavigationKeybindsSectionProps {
  onSetNextKey: () => void;
  onSetPrevKey: () => void;
}

export function NavigationKeybindsSection({
  onSetNextKey,
  onSetPrevKey,
}: NavigationKeybindsSectionProps) {
  return (
    <DropdownMenu>
      <Item
        className="mt-1 gap-1 p-1 transition-colors hover:bg-accent/30"
        size="xs"
        variant="outline"
      >
        <ItemContent className="min-w-0">
          <ItemTitle
            className="w-full max-w-full truncate rounded-md px-2 py-1 font-medium text-muted-foreground text-xs"
            title="Navigation Keybinds"
          >
            Navigation Keybinds
          </ItemTitle>
        </ItemContent>
        <ItemActions>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Navigation key options"
              className="shrink-0 text-muted-foreground"
              size="icon-sm"
              variant="ghost"
            >
              <DotsThreeVerticalIcon size={14} />
            </Button>
          </DropdownMenuTrigger>
        </ItemActions>
      </Item>
      <DropdownMenuContent align="end" side="top" sideOffset={6}>
        <DropdownMenuLabel>Navigation Keybinds</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onSetPrevKey}>
            Set Previous Key
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onSetNextKey}>
            Set Next Key
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
