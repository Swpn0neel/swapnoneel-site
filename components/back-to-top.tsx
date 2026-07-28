"use client";

import { NARRATION_VIEWPORT_OVERRIDE_EVENT } from "@/lib/narration-events";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

// Stay hidden until the reader has scrolled meaningfully away from the top.
// Crossing this line on the way down fades the button in; coming back up
// past it fades it out again.
const SHOW_THRESHOLD = 400;

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const update = () => setIsVisible(window.scrollY > SHOW_THRESHOLD);

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const check = () => setIsBlocked(document.body.style.overflow === "hidden");
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => mo.disconnect();
  }, []);

  const handleClick = () => {
    // Narration normally keeps the current word in view. Treat this explicit
    // navigation action like a manual scroll so that auto-follow does not
    // immediately pull the reader back during the smooth scroll.
    window.dispatchEvent(new Event(NARRATION_VIEWPORT_OVERRIDE_EVENT));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={handleClick}
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
