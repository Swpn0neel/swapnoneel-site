"use client";

import { NARRATION_VIEWPORT_OVERRIDE_EVENT } from "@/lib/narration-events";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Stay hidden until the reader has scrolled meaningfully away from the top.
// Crossing this line on the way down fades the button in; coming back up
// past it fades it out again.
const SHOW_THRESHOLD = 400;

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const next = window.scrollY > SHOW_THRESHOLD;
      // Scroll can fire every frame. Only ask React to render when this
      // control crosses its visibility threshold.
      if (next === isVisibleRef.current) return;
      isVisibleRef.current = next;
      setIsVisible(next);
    };

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

  const hidden = !isVisible || isBlocked;

  return (
    <button
      onClick={handleClick}
      // pointer-events-none only takes the button away from the mouse. Faded
      // out it was still a tab stop and still in the accessibility tree, so a
      // keyboard user tabbing the page landed on an invisible 48px control and
      // a screen reader announced a button that is not on screen. `inert`
      // removes it from both until it is actually shown.
      inert={hidden}
      className={`border-border bg-background/80 text-muted-foreground hover:border-foreground/20 hover:text-foreground fixed right-8 bottom-8 z-100 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 hover:shadow-sm active:scale-95 ${
        hidden
          ? "pointer-events-none translate-y-4 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
      aria-label="Back to top"
    >
      <ArrowUp size={18} strokeWidth={1.5} />
    </button>
  );
}
