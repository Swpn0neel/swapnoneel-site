"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import * as React from "react";

// Mirrors --background for each theme. Mobile browsers tint their chrome
// (address bar, status bar) from <meta name="theme-color">, and Next's
// `viewport.themeColor` can only key off the prefers-color-scheme media query —
// which is wrong the moment a visitor picks a theme that disagrees with their
// OS. So the tag is owned here instead, driven by the theme actually in effect.
const THEME_COLOR = { light: "#ffffff", dark: "#0a0a0a" } as const;

function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;

    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = THEME_COLOR[resolvedTheme];
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  );
}
