"use client";

import { getRenderedTheme, getSystemTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const label = !mounted
    ? "Toggle theme"
    : resolvedTheme === "dark"
      ? "Switch to light theme"
      : "Switch to dark theme";

  const handleToggle = () => {
    const run = () => {
      const current = getRenderedTheme();
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      setTheme(next === getSystemTheme() ? "system" : next);
    };

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startVT = (document as unknown as { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }).startViewTransition?.bind(
      document
    );
    if (startVT && !prefersReduced) {
      document.documentElement.classList.add("theme-view-transition");
      const vt = startVT(run);
      // `finished` rejects when a transition is skipped or superseded — which
      // is exactly what a second click does — and a bare .finally() would
      // re-throw that as an unhandled rejection. The class has to come off
      // either way, so both outcomes land here.
      const done = () => {
        document.documentElement.classList.remove("theme-view-transition");
      };
      vt.finished.then(done, done);
    } else {
      run();
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 focus-visible:ring-ring relative flex items-center justify-center rounded-md p-2 transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={label}
      title={label}
    >
      <Sun className="theme-toggle-sun h-4 w-4 scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="theme-toggle-moon absolute h-4 w-4 scale-0 rotate-90 transition-all duration-300 dark:scale-100 dark:rotate-0" />
    </button>
  );
}
