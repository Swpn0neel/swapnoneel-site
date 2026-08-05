export type ResolvedTheme = "light" | "dark";

/**
 * What the visitor is currently looking at.
 *
 * This is the browser-side half of a contract with THEME_INIT in
 * app/layout.tsx and the palette blocks in app/globals.css: the script writes
 * the resolved theme to `data-theme` before <body> exists, so the attribute is
 * authoritative from the first frame onwards. The media-query branch covers the
 * one case that cannot have an attribute — scripting disabled — where CSS
 * follows the OS and anything reading the theme has to resolve the same query.
 *
 * Read here rather than from next-themes' `resolvedTheme` on purpose: this is
 * correct before mount, and it is the value the pixels on screen were painted
 * from even if React state has not caught up.
 */
export function getRenderedTheme(): ResolvedTheme {
  const theme = document.documentElement.dataset.theme;

  if (theme === "light" || theme === "dark") return theme;

  return getSystemTheme();
}

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
