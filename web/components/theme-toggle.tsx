"use client";

import { useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

function read(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
}

const listeners = new Set<() => void>();
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem("ajs-theme");
    else localStorage.setItem("ajs-theme", theme);
  } catch {
    // Theme still applies for this visit.
  }
  listeners.forEach((l) => l());
}

const order: Theme[] = ["system", "light", "dark"];
const labels: Record<Theme, string> = { system: "Auto", light: "Light", dark: "Dark" };

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as Theme);
  const next = order[(order.indexOf(theme) + 1) % order.length];
  return (
    <button
      type="button"
      onClick={() => apply(next)}
      className="rounded-md px-3 py-1.5 text-sm text-mist-ink transition-colors duration-300 hover:bg-surface/50 hover:text-ink"
      aria-label={`Theme: ${labels[theme]}. Switch to ${labels[next]}.`}
    >
      {theme === "dark" ? "☾" : theme === "light" ? "☀" : "◐"}{" "}
      <span className="max-sm:sr-only">{labels[theme]}</span>
    </button>
  );
}
