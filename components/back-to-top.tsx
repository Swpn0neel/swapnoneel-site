"use client";

import { NARRATION_VIEWPORT_OVERRIDE_EVENT } from "@/lib/narration-events";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Stay hidden until the reader has moved meaningfully away from the top —
// matches the old back-to-top threshold, now shared by both directions.
const SHOW_THRESHOLD = 400;
// Treat "within a few px of the true bottom" as the bottom: browsers round
// scrollY to subpixels differently, so an exact equality check flickers.
const BOTTOM_EPSILON = 4;

type Direction = "up" | "down";

export function BackToTop() {
  const [direction, setDirection] = useState<Direction>("down");
  // Rotation of the icon in degrees. Always incremented by +180 (never
  // reset or decremented) on a direction flip: 0→180 sweeps up→right→down,
  // and the *next* flip, 180→360, sweeps down→left→up — since 90deg is the
  // "right" side of a full turn and 270deg is the "left" side, alternating
  // 180deg steps naturally alternates which side each flip sweeps through.
  const [angle, setAngle] = useState(180);
  const [isVisible, setIsVisible] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const lastScrollY = useRef(0);
  const directionRef = useRef<Direction>("down");

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;

      // Ignore sub-pixel jitter (some trackpads/browsers fire noisy deltas)
      // so the arrow doesn't flip on scroll wobble.
      let nextDirection: Direction | null = null;
      if (delta > 2) nextDirection = "up";
      else if (delta < -2) nextDirection = "down";
      if (nextDirection) {
        setDirection(nextDirection);
        if (nextDirection !== directionRef.current) {
          directionRef.current = nextDirection;
          setAngle((prev) => prev + 180);
        }
      }

      const atBottom =
        window.innerHeight + y >=
        document.documentElement.scrollHeight - BOTTOM_EPSILON;
      const scrollingDown = nextDirection === "down" || delta >= 0;

      setIsVisible(y > SHOW_THRESHOLD && !(scrollingDown && atBottom));
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
    if (direction === "up") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`border-border bg-background/80 text-muted-foreground hover:border-foreground/20 hover:text-foreground fixed right-8 bottom-8 z-100 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 hover:shadow-sm active:scale-95 ${
        isVisible && !isBlocked
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
      aria-label={direction === "up" ? "Back to top" : "Scroll to bottom"}
    >
      {/* An up-arrow rotated 180° reads as a down-arrow, so a single icon
          can rotate smoothly between the two states instead of swapping
          components. `angle` only ever grows (see the comment above its
          state), which is what makes each flip sweep the requested side
          instead of just reversing back along the same arc. */}
      <span
        className="inline-flex transition-transform duration-300 ease-in-out"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <ArrowUp size={18} strokeWidth={1.5} />
      </span>
    </button>
  );
}
