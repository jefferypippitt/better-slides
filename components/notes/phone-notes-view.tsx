"use client";

import { CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import { useNotesSync } from "@/components/notes/use-notes-sync";
import { Button } from "@/components/ui/button";

export interface NotesViewProps {
  notes: (string | null)[];
  pollInterval?: number;
  syncEndpoint: string;
  syncMode?: "poll" | "broadcast";
}

export function PhoneNotesView({
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
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          color: "#525252",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "36px",
          fontWeight: 600,
          letterSpacing: "-0.025em",
        }}
      >
        Presentation ended
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0a0a0a",
        color: "#e5e5e5",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid #262626",
          fontSize: "13px",
          color: "#737373",
        }}
      >
        <span>{label}</span>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Viewer count */}
          {active && connected && viewers > 0 && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "#525252",
              }}
            >
              <span>●</span>
              <span>
                {viewers} {viewers === 1 ? "device" : "devices"}
              </span>
            </span>
          )}

          {/* Status dot + label */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: dotColor,
                flexShrink: 0,
              }}
            />
            <span>{statusLabel}</span>
          </div>

          {/* Disconnect / Reconnect */}
          {active ? (
            <Button
              aria-label="Disconnect"
              className="rounded-full"
              onClick={handleDisconnect}
              size="icon-sm"
              title="Disconnect"
              type="button"
              variant="outline"
            >
              <XIcon />
            </Button>
          ) : (
            <Button
              onClick={handleReconnect}
              size="xs"
              type="button"
              variant="outline"
            >
              Reconnect
            </Button>
          )}
        </div>
      </div>

      {/* Note content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px",
        }}
      >
        {currentNote ? (
          <p
            style={{
              fontSize: "clamp(18px, 4vw, 28px)",
              lineHeight: 1.6,
              maxWidth: "640px",
              whiteSpace: "pre-wrap",
              opacity: active ? 1 : 0.5,
            }}
          >
            {currentNote}
          </p>
        ) : (
          <p
            style={{ fontSize: "18px", color: "#525252", fontStyle: "italic" }}
          >
            No notes for this slide.
          </p>
        )}
      </div>

      {/* Prev / Next controls */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "16px 20px",
          borderTop: "1px solid #262626",
        }}
      >
        <Button
          className="flex-1"
          disabled={slideIndex <= 0}
          onClick={() => navigate(slideIndex - 1)}
          size="lg"
          type="button"
          variant="outline"
        >
          <CaretLeftIcon data-icon="inline-start" />
          Prev
        </Button>
        <Button
          className="flex-1"
          disabled={slideIndex >= total - 1}
          onClick={() => navigate(slideIndex + 1)}
          size="lg"
          type="button"
          variant="outline"
        >
          Next
          <CaretRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
