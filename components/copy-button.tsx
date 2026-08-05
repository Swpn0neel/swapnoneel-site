"use client";

import { Check, Copy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CopyButtonProps {
  text: string;
}

type Status = "idle" | "copied" | "error";

const LABEL: Record<Status, string> = {
  idle: "Copy code block",
  copied: "Copied",
  error: "Copy failed",
};

/**
 * `navigator.clipboard` only exists on secure origins, so it is undefined when
 * the site is opened over plain http — previewing from a phone on the LAN, for
 * instance. Falling back to execCommand keeps the button working there instead
 * of failing silently.
 */
async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const staging = document.createElement("textarea");
  staging.value = text;
  staging.readOnly = true;
  staging.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(staging);
  staging.select();
  const copied = document.execCommand("copy");
  staging.remove();
  if (!copied) throw new Error("execCommand('copy') was rejected");
}

export function CopyButton({ text }: CopyButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reading a post is a stream of client-side navigations, so a button can
  // easily unmount inside the two seconds it spends showing the check.
  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const settle = (next: Status) => {
    setStatus(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2000);
  };

  const handleCopy = async () => {
    if (status === "copied") return;
    try {
      await writeClipboard(text);
      settle("copied");
    } catch (err) {
      console.error("Failed to copy code: ", err);
      settle("error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={LABEL[status]}
      title={LABEL[status]}
      className="border-border bg-background/90 hover:bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border transition-all duration-200 select-none"
    >
      <div
        aria-hidden="true"
        className="relative flex h-3 w-3 items-center justify-center"
      >
        <Copy
          className={`absolute h-3 w-3 transition-all duration-300 ease-in-out ${
            status === "idle"
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 rotate-90 opacity-0"
          }`}
        />
        <Check
          className={`absolute h-3 w-3 text-emerald-600 transition-all duration-300 ease-in-out dark:text-emerald-400 ${
            status === "copied"
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 -rotate-90 opacity-0"
          }`}
        />
        <X
          className={`absolute h-3 w-3 text-red-600 transition-all duration-300 ease-in-out dark:text-red-400 ${
            status === "error"
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 -rotate-90 opacity-0"
          }`}
        />
      </div>
      {/* The icon swap is the only feedback a sighted reader gets; this is the
          same confirmation for anyone listening. */}
      <span aria-live="polite" className="sr-only">
        {status === "idle" ? "" : LABEL[status]}
      </span>
    </button>
  );
}
