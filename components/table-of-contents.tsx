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
            // Depth reads off indent and weight. It used to also ride a
            // five-stop opacity ladder (/95 → /90 → /75 → /60) whose lower
            // rungs measured 2.8:1 and 3.4:1 against the panel — below AA —
            // and the ┗/•/- glyphs that marked each level sat at /20–/30,
            // i.e. ~1.4:1, which is not a faint character but an unrendered
            // one. Every level is now a named, contrast-checked token.
            let indentClass = "";
            if (depth === 0) {
              indentClass =
                "font-bold text-[calc(0.86rem*var(--prose-scale,1))] text-foreground";
            } else if (depth === 1) {
              indentClass =
                "pl-4 font-semibold text-[calc(0.82rem*var(--prose-scale,1))] text-muted-foreground";
            } else if (depth === 2) {
              indentClass =
                "pl-8 text-[calc(0.78rem*var(--prose-scale,1))] text-muted-foreground";
            } else {
              // Accommodate depth 3 (pl-12), depth 4 (pl-16), etc.
              const paddingClass =
                depth === 3 ? "pl-12" : depth === 4 ? "pl-16" : "pl-20";
              indentClass = `${paddingClass} text-[calc(0.74rem*var(--prose-scale,1))] text-faint-foreground`;
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
