"use client";

import { CaretUpDown, SignOut } from "@phosphor-icons/react";
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

interface SessionUser {
  email?: string;
  name?: string;
}

interface UserMenuProps {
  onDeleteAccount: () => void;
  onSignOut: () => void;
  sessionUser: SessionUser | null;
  signingOut: boolean;
}

export function UserMenu({
  onDeleteAccount,
  onSignOut,
  sessionUser,
  signingOut,
}: UserMenuProps) {
  const userName = sessionUser?.name?.trim() || "Signed in";
  const userEmail = sessionUser?.email?.trim();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-auto w-full justify-start gap-2 px-3 py-2"
          variant="ghost"
        >
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{userName}</span>
            {userEmail && (
              <span className="truncate text-muted-foreground text-xs">
                {userEmail}
              </span>
            )}
          </div>
          <CaretUpDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        side="top"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="px-1 py-1.5 text-left text-sm">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{userName}</span>
              {userEmail && (
                <span className="truncate text-muted-foreground text-xs">
                  {userEmail}
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onDeleteAccount} variant="destructive">
            Delete account
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive! *:text-destructive!"
          disabled={signingOut}
          onClick={onSignOut}
          variant="destructive"
        >
          <SignOut />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
