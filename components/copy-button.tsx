import { Check, Copy, X } from "lucide-react";
// Stateless server markup: one delegated listener on the surrounding article
// owns every button's behavior, so code fences do not become hydration islands.
export function CopyButton() {
  return (
    <button
      type="button"
      data-copy-button
      data-copy-status="idle"
      aria-label="Copy code block"
      title="Copy code block"
      className="group/copy border-border bg-background/90 hover:bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border transition-all duration-200 select-none"
    >
      <div
        aria-hidden="true"
        className="relative flex h-3 w-3 items-center justify-center"
      >
        <Copy className="absolute h-3 w-3 scale-0 rotate-90 opacity-0 transition-all duration-300 ease-in-out group-data-[copy-status=idle]/copy:scale-100 group-data-[copy-status=idle]/copy:rotate-0 group-data-[copy-status=idle]/copy:opacity-100" />
        <Check className="absolute h-3 w-3 scale-0 -rotate-90 text-emerald-600 opacity-0 transition-all duration-300 ease-in-out group-data-[copy-status=copied]/copy:scale-100 group-data-[copy-status=copied]/copy:rotate-0 group-data-[copy-status=copied]/copy:opacity-100 dark:text-emerald-400" />
        <X className="absolute h-3 w-3 scale-0 -rotate-90 text-red-600 opacity-0 transition-all duration-300 ease-in-out group-data-[copy-status=error]/copy:scale-100 group-data-[copy-status=error]/copy:rotate-0 group-data-[copy-status=error]/copy:opacity-100 dark:text-red-400" />
      </div>
      {/* The icon swap is the only feedback a sighted reader gets; this is the
          same confirmation for anyone listening. */}
      <span data-copy-announcement aria-live="polite" className="sr-only" />
    </button>
  );
}
