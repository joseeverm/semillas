import { useState } from "react";

/**
 * Light/dark theme. Defaults to the system preference; a manual toggle
 * overrides it and persists in localStorage. The theme is applied as a
 * `.dark` class on <html> (see @custom-variant in index.css), so it survives
 * navigation regardless of which page rendered the toggle.
 */

const STORAGE_KEY = "semillas-theme";

export type Theme = "light" | "dark";

export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage unavailable: fall through to the system preference.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  // Keep the browser/PWA status bar in tune with the page background.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#052e16" : "#16a34a");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Without storage the choice just won't survive a reload.
    }
    applyTheme(next);
    setTheme(next);
  }

  return { theme, toggleTheme };
}
