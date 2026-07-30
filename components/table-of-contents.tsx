"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface HeadingItem {
  text: string;
  slug: string;
  level: number;
}

interface TableOfContentsProps {
  headings: HeadingItem[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (headings.length === 0) return null;

  // Calculate the sorted unique levels present in these headings
  const uniqueLevels = Array.from(new Set(headings.map((h) => h.level))).sort(
    (a, b) => a - b
  );

  return (
    <div className="border-border bg-secondary/15 relative mb-6 rounded-md border transition-all duration-300">
      {/* Clickable Minimal Header Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-muted-foreground hover:text-foreground group text-2xs flex w-full cursor-pointer items-center justify-between p-4 font-bold tracking-wider uppercase transition-all duration-300 select-none focus:outline-none md:p-5"
      >
        <span>Table of Contents</span>
        <ChevronDown
          className={`h-4 w-4 transition-all duration-300 ${
            isExpanded
              ? "text-foreground rotate-180"
              : "text-faint-foreground group-hover:text-foreground"
          }`}
        />
      </button>

      {/* Dynamic Collapsible Heading Navigation */}
      <div
        className={`overflow-hidden px-4 transition-all duration-500 ease-in-out md:px-5 ${
          isExpanded ? "max-h-[1200px] pb-5 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="border-border/30 space-y-2 border-t pt-4">
          {headings.map((item, idx) => {
            const depth = uniqueLevels.indexOf(item.level);
            // Sizes track the reader's A-/A/A+ choice via --prose-scale (the
            // same variable .prose reads in globals.css), so the TOC stays
            // proportional to the article body it's navigating.
            // Two sizes, not four. The old ramp ran 0.86 / 0.82 / 0.78 / 0.74
            // rem — 1.05x between levels, which is below the threshold at
            // which a size difference is perceived at all, so the real depth
            // signal was an opacity ladder whose lower rungs failed contrast.
            // Depth is carried by indent first (the one cue that scales to any
            // number of levels), then weight, then the four-step text ramp:
            // foreground -> body -> muted -> faint, the same tiers the rest of
            // the site uses, so a heading's depth here matches how prominently
            // it reads in the article. Sizes still track --prose-scale so the
            // panel stays proportional to what it navigates.
            const size =
              depth <= 1
                ? "text-[calc(0.875rem*var(--prose-scale,1))]"
                : "text-[calc(0.75rem*var(--prose-scale,1))]";
            let indentClass = "";
            if (depth === 0) {
              indentClass = `${size} font-semibold text-foreground`;
            } else if (depth === 1) {
              indentClass = `${size} pl-4 font-medium text-body-foreground`;
            } else if (depth === 2) {
              indentClass = `${size} pl-8 text-muted-foreground`;
            } else {
              // Accommodate depth 3 (pl-12), depth 4 (pl-16), etc.
              const paddingClass =
                depth === 3 ? "pl-12" : depth === 4 ? "pl-16" : "pl-20";
              indentClass = `${size} ${paddingClass} text-faint-foreground`;
            }
            return (
              <a
                key={idx}
                href={`#${item.slug}`}
                // No base colour here: every depth branch sets its own, and two
                // competing text-* utilities on one element resolve by
                // Tailwind's output order rather than the order written here.
                className={`hover:text-foreground block transition-colors ${indentClass}`}
              >
                {item.text}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
