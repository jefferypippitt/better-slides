export interface NavigationKeybinds {
  nextKey: string;
  prevKey: string;
}

export const NAVIGATION_KEYBINDS_STORAGE_KEY =
  "better-slides.navigation-keybinds";

export const DEFAULT_NAVIGATION_KEYBINDS: NavigationKeybinds = {
  nextKey: "ArrowRight",
  prevKey: "ArrowLeft",
};

const DISALLOWED_KEYS = new Set([
  "Alt",
  "CapsLock",
  "Control",
  "Meta",
  "NumLock",
  "ScrollLock",
  "Shift",
]);

export function normalizeNavigationKey(rawKey: string): string {
  if (rawKey === " ") {
    return "Space";
  }

  if (rawKey.length === 1) {
    return rawKey.toLowerCase();
  }

  return rawKey;
}

export function canUseAsNavigationKey(rawKey: string): boolean {
  const key = normalizeNavigationKey(rawKey);
  if (key.length === 0) {
    return false;
  }
  return !DISALLOWED_KEYS.has(key);
}

export function formatNavigationKeyLabel(rawKey: string): string {
  const key = normalizeNavigationKey(rawKey);
  if (key.startsWith("Arrow")) {
    return `${key.slice("Arrow".length)} Arrow`;
  }
  if (key === "Space") {
    return "Space";
  }
  if (key.length === 1) {
    return key.toUpperCase();
  }
  return key;
}

function sanitizeNavigationKeybinds(value: unknown): NavigationKeybinds | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybe = value as Partial<NavigationKeybinds>;
  if (typeof maybe.nextKey !== "string" || typeof maybe.prevKey !== "string") {
    return null;
  }

  const nextKey = normalizeNavigationKey(maybe.nextKey);
  const prevKey = normalizeNavigationKey(maybe.prevKey);
  if (!(nextKey && prevKey) || nextKey === prevKey) {
    return null;
  }

  if (!(canUseAsNavigationKey(nextKey) && canUseAsNavigationKey(prevKey))) {
    return null;
  }

  return { nextKey, prevKey };
}

export function loadNavigationKeybinds(): NavigationKeybinds {
  if (typeof window === "undefined") {
    return DEFAULT_NAVIGATION_KEYBINDS;
  }

  const raw = window.localStorage.getItem(NAVIGATION_KEYBINDS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_NAVIGATION_KEYBINDS;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeNavigationKeybinds(parsed) ?? DEFAULT_NAVIGATION_KEYBINDS;
  } catch {
    return DEFAULT_NAVIGATION_KEYBINDS;
  }
}

export function saveNavigationKeybinds(bindings: NavigationKeybinds): void {
  if (typeof window === "undefined") {
    return;
  }

  const sanitized = sanitizeNavigationKeybinds(bindings);
  if (!sanitized) {
    return;
  }

  window.localStorage.setItem(
    NAVIGATION_KEYBINDS_STORAGE_KEY,
    JSON.stringify(sanitized)
  );
}
