"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PhoneNotesViewProps {
  notes: (string | null)[];
  pollInterval?: number;
  syncEndpoint: string;
}

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function getOrCreateClientId(): string {
  const key = "better-slides-cid";
  const existing = sessionStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const id = generateId();
  sessionStorage.setItem(key, id);
  return id;
}

export function PhoneNotesView({
  notes,
  syncEndpoint,
  pollInterval = 1500,
}: PhoneNotesViewProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [total, setTotal] = useState(notes.length || 1);
  const [connected, setConnected] = useState(false);
  const [active, setActive] = useState(true);
  const [viewers, setViewers] = useState(0);
  const clientId = useRef<string | null>(null);

  useEffect(() => {
    clientId.current = getOrCreateClientId();
  }, []);

  const poll = useCallback(async () => {
    const cid = clientId.current;
    const url = cid
      ? `${syncEndpoint}&cid=${encodeURIComponent(cid)}`
      : syncEndpoint;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as {
        slide: number;
        total: number;
        viewers?: number;
      };
      setTotal(data.total);
      setConnected(true);
      setSlideIndex(data.slide - 1);
      if (data.viewers !== undefined) {
        setViewers(data.viewers);
      }
    } catch {
      setConnected(false);
    }
  }, [syncEndpoint]);

  useEffect(() => {
    if (!active) {
      return;
    }
    poll();
    const id = setInterval(poll, pollInterval);
    return () => clearInterval(id);
  }, [active, poll, pollInterval]);

  const navigate = useCallback(
    async (newIndex: number) => {
      const clamped = Math.max(0, Math.min(newIndex, total - 1));
      setSlideIndex(clamped);
      if (!active) {
        return;
      }
      try {
        await fetch(syncEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slide: clamped + 1, total }),
        });
      } catch {
        // ignore network errors
      }
    },
    [active, syncEndpoint, total]
  );

  const handleDisconnect = () => {
    setActive(false);
    setConnected(false);
  };

  const handleReconnect = () => {
    setActive(true);
  };

  const currentNote =
    slideIndex >= 0 && slideIndex < notes.length ? notes[slideIndex] : null;
  const label = `Slide ${slideIndex + 1} / ${total}`;
  let dotColor = "#525252";
  let statusLabel = "Paused";
  if (active) {
    dotColor = connected ? "#22c55e" : "#ef4444";
    statusLabel = connected ? "Live" : "Connecting…";
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
            <button
              onClick={handleDisconnect}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "1px solid #333",
                backgroundColor: "transparent",
                color: "#737373",
                fontSize: "13px",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                lineHeight: 1,
              }}
              title="Disconnect"
              type="button"
            >
              ✕
            </button>
          ) : (
            <button
              onClick={handleReconnect}
              style={{
                padding: "2px 8px",
                borderRadius: "6px",
                border: "1px solid #333",
                backgroundColor: "#1a1a1a",
                color: "#e5e5e5",
                fontSize: "12px",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
              type="button"
            >
              Reconnect
            </button>
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
        <button
          disabled={slideIndex <= 0}
          onClick={() => navigate(slideIndex - 1)}
          style={{
            flex: 1,
            padding: "14px",
            fontSize: "16px",
            fontWeight: 500,
            border: "1px solid #333",
            borderRadius: "10px",
            backgroundColor: slideIndex <= 0 ? "#111" : "#1a1a1a",
            color: slideIndex <= 0 ? "#444" : "#e5e5e5",
            cursor: slideIndex <= 0 ? "default" : "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
          type="button"
        >
          ← Prev
        </button>
        <button
          disabled={slideIndex >= total - 1}
          onClick={() => navigate(slideIndex + 1)}
          style={{
            flex: 1,
            padding: "14px",
            fontSize: "16px",
            fontWeight: 500,
            border: "1px solid #333",
            borderRadius: "10px",
            backgroundColor: slideIndex >= total - 1 ? "#111" : "#1a1a1a",
            color: slideIndex >= total - 1 ? "#444" : "#e5e5e5",
            cursor: slideIndex >= total - 1 ? "default" : "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
          type="button"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
