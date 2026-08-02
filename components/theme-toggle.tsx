"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { type MouseEvent, useEffect, useRef, useState } from "react";

const THEME_TRANSITION_DURATION = 360;

type Theme = "light" | "dark";

function getRenderedTheme(): Theme {
  const theme = document.documentElement.dataset.theme;

  if (theme === "light" || theme === "dark") return theme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewTransitionSequenceRef = useRef(0);

  // resolvedTheme is undefined until next-themes has read storage and matched
  // the system query, so the label starts generic and sharpens after mount.
  // Rendering it unconditionally would be a hydration mismatch — the server has
  // no idea which theme this visitor resolves to.
  useEffect(() => {
    setMounted(true);

    return () => {
      viewTransitionSequenceRef.current += 1;

      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }

      document.documentElement.classList.remove(
        "theme-transition",
        "theme-view-transition"
      );
    };
  }, []);

  const label = !mounted
    ? "Toggle theme"
    : resolvedTheme === "dark"
      ? "Switch to light theme"
      : "Switch to dark theme";

  const handleThemeChange = (event: MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement;
    const rect = event.currentTarget.getBoundingClientRect();
    const keyboardActivation = event.detail === 0;
    const x = keyboardActivation ? rect.left + rect.width / 2 : event.clientX;
    const y = keyboardActivation ? rect.top + rect.height / 2 : event.clientY;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const nextTheme = getRenderedTheme() === "dark" ? "light" : "dark";
    const commitTheme = () => {
      // Mutate synchronously so View Transitions captures the new theme in its
      // update callback. setTheme owns React state and the single storage write.
      root.dataset.theme = nextTheme;
      setTheme(nextTheme);
    };

    root.style.setProperty("--theme-x", `${x}px`);
    root.style.setProperty("--theme-y", `${y}px`);
    root.style.setProperty("--theme-radius", `${radius}px`);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      viewTransitionSequenceRef.current += 1;

      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }

      root.classList.remove("theme-transition", "theme-view-transition");
      commitTheme();
      return;
    }

    if (typeof document.startViewTransition === "function") {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }

      root.classList.remove("theme-transition");
      root.classList.add("theme-view-transition");

      try {
        const transitionSequence = ++viewTransitionSequenceRef.current;
        const transition = document.startViewTransition(commitTheme);
        const finishTransition = () => {
          if (viewTransitionSequenceRef.current !== transitionSequence) return;
          root.classList.remove("theme-view-transition");
        };

        void transition.finished.then(finishTransition, finishTransition);
        return;
      } catch {
        root.classList.remove("theme-view-transition");
      }
    }

    viewTransitionSequenceRef.current += 1;

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      root.classList.remove("theme-transition");
      void root.offsetWidth;
    }

    root.classList.add("theme-transition");
    void root.offsetWidth;
    commitTheme();

    fallbackTimerRef.current = setTimeout(() => {
      root.classList.remove("theme-transition");
      fallbackTimerRef.current = null;
    }, THEME_TRANSITION_DURATION);
  };

  return (
    <button
      type="button"
      onClick={handleThemeChange}
      className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 focus-visible:ring-ring relative flex items-center justify-center rounded-md p-2 transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={label}
      title={label}
    >
      <Sun className="theme-toggle-sun theme-toggle-icon h-4 w-4 scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="theme-toggle-moon theme-toggle-icon absolute h-4 w-4 scale-0 rotate-90 transition-all duration-300 dark:scale-100 dark:rotate-0" />
    </button>
  );
}
