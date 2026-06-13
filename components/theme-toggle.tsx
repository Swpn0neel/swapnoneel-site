"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 focus-visible:ring-ring relative flex items-center justify-center rounded-md p-2 transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all duration-300 dark:scale-100 dark:rotate-0" />
    </button>
  );
}
