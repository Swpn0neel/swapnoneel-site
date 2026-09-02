"use client";

import {
  getRenderedTheme,
  getSystemTheme,
  type ResolvedTheme,
} from "@/lib/theme";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Theme = ResolvedTheme | "system";

// Same key and values next-themes used, so a visitor's saved choice survives
// the swap; THEME_INIT in app/layout.tsx reads the same key before first paint.
const STORAGE_KEY = "theme";

type ThemeContextValue = {
  /** The stored preference — "system" follows the OS. */
  theme: Theme;
  /** What is on screen. Undefined until mounted; the server cannot know it. */
  resolvedTheme: ResolvedTheme | undefined;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

// The same two writes THEME_INIT makes before <body> exists. Every rule keyed
// on the theme reads data-theme; colorScheme keeps form controls, scrollbars
// and the canvas in step in the same frame.
function paint(resolved: ResolvedTheme) {
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

// Mirrors --background for each theme. Mobile browsers tint their chrome
// (address bar, status bar) from <meta name="theme-color">, and Next's
// `viewport.themeColor` can only key off the prefers-color-scheme media query —
// which is wrong the moment a visitor picks a theme that disagrees with their
// OS. So the tag is owned here, driven by the theme actually in effect.
const THEME_COLOR = { light: "#ffffff", dark: "#0a0a0a" } as const;

function syncThemeColor(resolved: ResolvedTheme) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLOR[resolved];
}

/**
 * Theme state for the site. This used to be next-themes, which injected a
 * second pre-paint script doing exactly what THEME_INIT already does and
 * shipped a few KB of options the site never used. What is left is the part
 * that has to be React: the stored preference, the resolved value the toggle
 * and Cal embed read, the live follow of the OS setting while on "system",
 * and cross-tab sync through the `storage` event.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolved] = useState<ResolvedTheme>();
  const themeRef = useRef<Theme>("system");

  const commit = useCallback((next: Theme) => {
    themeRef.current = next;
    setThemeState(next);
    const resolved = resolve(next);
    paint(resolved);
    setResolved(resolved);
    syncThemeColor(resolved);
  }, []);

  // Mount: adopt what THEME_INIT already painted rather than repainting.
  useEffect(() => {
    const stored = readStored();
    themeRef.current = stored;
    setThemeState(stored);
    const rendered = getRenderedTheme();
    setResolved(rendered);
    syncThemeColor(rendered);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (themeRef.current === "system") commit("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) commit(readStored());
    };
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [commit]);

  const setTheme = useCallback(
    (next: Theme) => {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* private mode — the choice lasts for this page only */
      }
      commit(next);
    },
    [commit]
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
