"use client";

import { NARRATION_VIEWPORT_OVERRIDE_EVENT } from "@/lib/narration-events";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const toggle = () => setIsVisible(window.scrollY > 400);
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  useEffect(() => {
    const check = () => setIsBlocked(document.body.style.overflow === "hidden");
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => mo.disconnect();
  }, []);

  const scrollToTop = () => {
    // Narration normally keeps the current word in view. Treat this explicit
    // navigation action like a manual scroll so that auto-follow does not
    // immediately pull the reader back down during the smooth scroll.
    window.dispatchEvent(new Event(NARRATION_VIEWPORT_OVERRIDE_EVENT));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`border-border bg-background/80 text-muted-foreground hover:border-foreground/20 hover:text-foreground fixed right-8 bottom-8 z-100 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 hover:shadow-sm active:scale-95 ${
        isVisible && !isBlocked
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
      aria-label="Back to top"
    >
      <ArrowUp size={18} strokeWidth={1.5} />
    </button>
  );
}
