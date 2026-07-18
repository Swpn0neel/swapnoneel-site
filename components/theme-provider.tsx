"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import * as React from "react";

// Mirrors the active theme into sessionStorage. The pre-hydration script in
// app/layout.tsx trusts sessionStorage (not localStorage) on load, which
// scopes the saved preference to the browsing session: tabs opened from the
// site (e.g. the resume link) clone sessionStorage and inherit the theme,
// while a brand-new visit always starts light.
function ThemeSessionSync() {
  const { theme } = useTheme();

  React.useEffect(() => {
    if (theme !== "light" && theme !== "dark") return;
    try {
      sessionStorage.setItem("theme", theme);
    } catch {
      // storage unavailable (private mode restrictions) — theme still works,
      // it just won't survive a reload
    }
  }, [theme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSessionSync />
      {children}
    </NextThemesProvider>
  );
}
