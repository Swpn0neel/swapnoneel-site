import { getSystemTheme, type ResolvedTheme } from "@/lib/theme";

/**
 * Replaces next-themes.
 *
 * next-themes was doing four things here: persisting a preference, resolving
 * "system" against the OS, writing `data-theme` and `color-scheme` to <html>,
 * and re-resolving when the OS flips. None of that needs React, and all of it
 * was arriving after hydration — which is why THEME_INIT exists in the layout
 * at all. That inline script stays exactly as it was; this module is only the
 * part that has to keep running after first paint.
 *
 * The contract with THEME_INIT and the palette blocks in global.css is
 * unchanged: `data-theme` on <html> is authoritative from the first frame, and
 * the media-query arm of the palette covers the scripting-disabled case.
 */

export type ThemePreference = ResolvedTheme | "system";

const STORAGE_KEY = "theme";

/**
 * Mirrors --background for each theme. Mobile browsers tint their chrome from
 * <meta name="theme-color">, and a static tag can only ever key off
 * prefers-color-scheme — wrong the moment a visitor picks a theme that
 * disagrees with their OS. So the tag is owned here, driven by the theme
 * actually in effect.
 */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: "#ffffff",
  dark: "#0a0a0a",
};

/** Guarded: some privacy modes and embedded browsers make localStorage throw. */
function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* storage unavailable */
  }
  return "system";
}

function writePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    /* storage unavailable */
  }
}

function syncThemeColor(theme: ResolvedTheme): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLOR[theme];
}

/**
 * Writes the resolved theme to the document. Deliberately does not touch
 * storage — the toggle drives its own View Transition around this call and
 * decides separately what preference to persist.
 */
export function applyResolvedTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  syncThemeColor(theme);
}

/**
 * Persists the visitor's choice, handing the preference back to "system"
 * whenever they land on what their OS already asks for.
 *
 * Without that, the first click is a one-way door: a dark-OS visitor who
 * toggles to light and back is left on an explicit "dark" that no longer
 * follows the OS, and the media-query palette that renders the no-script case
 * is dead for them from then on.
 */
export function persistTheme(theme: ResolvedTheme): void {
  writePreference(theme === getSystemTheme() ? "system" : theme);
}

/**
 * Keeps the document in step with the OS while the preference is "system".
 * Idempotent, so a re-run after a client-side navigation is harmless.
 */
let started = false;
export function startThemeSync(): void {
  if (started) return;
  started = true;

  // THEME_INIT already resolved and wrote the theme before <body> existed. This
  // re-applies the same value only to attach the theme-color meta, which cannot
  // be set from the inline script because <head> is still being parsed.
  const initial =
    readPreference() === "system"
      ? getSystemTheme()
      : (readPreference() as ResolvedTheme);
  applyResolvedTheme(initial);

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      if (readPreference() !== "system") return;
      applyResolvedTheme(event.matches ? "dark" : "light");
    });
}
