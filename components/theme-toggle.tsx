"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // resolvedTheme is undefined until next-themes has read storage and matched
  // the system query, so the label starts generic and sharpens after mount.
  // Rendering it unconditionally would be a hydration mismatch — the server has
  // no idea which theme this visitor resolves to.
  useEffect(() => setMounted(true), []);

  const label = !mounted
    ? "Toggle theme"
    : resolvedTheme === "dark"
      ? "Switch to light theme"
      : "Switch to dark theme";

  return (
    <button
      onClick={() =>
        // The class on <html> is what the visitor is actually looking at, so it
        // beats component state as the source of truth for "what's the other
        // one" — correct even on a click that lands before mount.
        setTheme(
          document.documentElement.classList.contains("dark") ? "light" : "dark"
        )
      }
      className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 focus-visible:ring-ring relative flex items-center justify-center rounded-md p-2 transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={label}
      title={label}
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all duration-300 dark:scale-100 dark:rotate-0" />
    </button>
  );
}
