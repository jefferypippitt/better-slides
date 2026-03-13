"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseNotesSyncOptions {
  notes: (string | null)[];
  pollInterval?: number;
  syncEndpoint: string;
  syncMode?: "poll" | "broadcast";
}

interface NotesSyncData {
  active: boolean;
  connected: boolean;
  currentNote: string | null;
  dotColor: string;
  ended: boolean;
  handleDisconnect: () => void;
  handleReconnect: () => void;
  label: string;
  navigate: (newIndex: number) => Promise<void>;
  slideIndex: number;
  statusLabel: string;
  total: number;
  viewers: number;
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

export function useNotesSync({
  notes,
  syncEndpoint,
  pollInterval = 1500,
  syncMode = "poll",
}: UseNotesSyncOptions): NotesSyncData {
  const [slideIndex, setSlideIndex] = useState(0);
  const [total, setTotal] = useState(notes.length || 1);
  const [connected, setConnected] = useState(false);
  const [active, setActive] = useState(true);
  const [ended, setEnded] = useState(false);
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
        ended?: boolean;
      };
      if (data.ended) {
        setEnded(true);
        setActive(false);
        setConnected(false);
        return;
      }
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

  const extractDeckId = useCallback((): string | null => {
    try {
      const url =
        typeof window === "undefined"
          ? new URL(syncEndpoint, "http://localhost")
          : new URL(syncEndpoint, window.location.origin);
      return url.searchParams.get("deckId");
    } catch {
      return null;
    }
  }, [syncEndpoint]);

  const getChannelName = useCallback((): string | null => {
    const deckId = extractDeckId();
    if (!deckId) {
      return null;
    }
    return `better-slides-notes-${deckId}`;
  }, [extractDeckId]);

  useEffect(() => {
    if (syncMode !== "poll") {
      return;
    }
    if (!active) {
      return;
    }
    poll();
    const id = setInterval(poll, pollInterval);
    return () => clearInterval(id);
  }, [active, poll, pollInterval, syncMode]);

  useEffect(() => {
    if (syncMode !== "broadcast") {
      return;
    }
    if (!active) {
      setConnected(false);
      return;
    }
    const channelName = getChannelName();
    if (!channelName) {
      return;
    }
    const channel = new BroadcastChannel(channelName);
    setConnected(false);
    let timeoutId = window.setTimeout(() => {
      setConnected(false);
    }, 2500);

    const onMessage = (event: MessageEvent<unknown>) => {
      const message = event.data as
        | { kind?: "state" | "ended"; slide?: number; total?: number }
        | undefined;
      if (!message) {
        return;
      }
      if (message.kind === "ended") {
        setEnded(true);
        setActive(false);
        setConnected(false);
        window.clearTimeout(timeoutId);
        channel.close();
        return;
      }
      if (message.kind !== "state") {
        return;
      }
      if (typeof message.total === "number") {
        setTotal(message.total);
      }
      if (typeof message.slide === "number") {
        setSlideIndex(Math.max(0, message.slide - 1));
      }
      setConnected(true);
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setConnected(false);
      }, 2500);
    };

    channel.addEventListener("message", onMessage);
    channel.postMessage({ kind: "request-state" });

    return () => {
      window.clearTimeout(timeoutId);
      channel.removeEventListener("message", onMessage);
      channel.close();
    };
  }, [active, getChannelName, syncMode]);

  const navigate = useCallback(
    async (newIndex: number) => {
      const clamped = Math.max(0, Math.min(newIndex, total - 1));
      setSlideIndex(clamped);

      if (!active) {
        return;
      }

      if (syncMode === "broadcast") {
        const channelName = getChannelName();
        if (channelName) {
          const channel = new BroadcastChannel(channelName);
          channel.postMessage({
            kind: "control",
            slide: clamped + 1,
            total,
          });
          channel.close();
        }
        return;
      }
      try {
        await fetch(syncEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slide: clamped + 1, total }),
        });
      } catch {
        // Ignore network errors for a smoother notes experience.
      }
    },
    [active, getChannelName, syncEndpoint, syncMode, total]
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

  return {
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
  };
}
