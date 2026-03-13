"use client";

import { DesktopNotesView } from "@/components/notes/desktop-notes-view";
import {
  type NotesViewProps,
  PhoneNotesView,
} from "@/components/notes/phone-notes-view";
import { useIsMobile } from "@/hooks/use-mobile";

export function NotesView(props: NotesViewProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <PhoneNotesView {...props} />;
  }

  return <DesktopNotesView {...props} />;
}
