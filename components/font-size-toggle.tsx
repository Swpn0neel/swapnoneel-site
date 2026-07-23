"use client";

import { i18n } from "@/lib/i18n";
import { useEffect, useState } from "react";

/** Steps the A-/A/A+ control moves between. The scale multiplies every rem
 *  font-size inside `.prose` (see --prose-scale in globals.css); "md" is 1,
 *  i.e. exactly the sizes the site shipped with. */
const STEPS = [
  { id: "sm", label: "A-", scale: 0.9 },
  { id: "md", label: "A", scale: 1 },
  { id: "lg", label: "A+", scale: 1.15 },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export const PROSE_SCALE_KEY = "prose-scale";

const isStepId = (value: string | null): value is StepId =>
  STEPS.some((s) => s.id === value);

export function FontSizeToggle() {
  const [active, setActive] = useState<StepId>("md");

  // The server can't know the stored preference, so render the default and
  // sync afterwards. The pre-hydration script in layout.tsx has already put
  // the right size on screen; this only catches the button highlight up.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROSE_SCALE_KEY);
      if (isStepId(stored)) setActive(stored);
    } catch {
      /* private mode / storage disabled — stay on the default */
    }
  }, []);

  const select = (step: (typeof STEPS)[number]) => {
    setActive(step.id);
    // Set on <html> rather than the article: the preference outlives this
    // page, and only .prose reads the variable, so nothing else shifts.
    document.documentElement.style.setProperty(
      "--prose-scale",
      String(step.scale)
    );
    try {
      localStorage.setItem(PROSE_SCALE_KEY, step.id);
    } catch {
      /* preference just won't persist */
    }
  };

  return (
    <div
      role="group"
      aria-label={i18n.blog.textSizeLabel}
      className="border-border divide-border flex w-fit items-stretch divide-x overflow-hidden rounded-sm border"
    >
      {STEPS.map((step) => {
        const isActive = active === step.id;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => select(step)}
            aria-pressed={isActive}
            title={i18n.blog.textSizeTitles[step.id]}
            className={`flex w-8 cursor-pointer items-center justify-center py-1 text-xs leading-none font-medium transition-colors ${
              isActive
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
