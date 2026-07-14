"use client";

import { useRef } from "react";

export function PfpSpin({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);

  function getInner() {
    return ref.current?.querySelector<HTMLElement>(".pfp-flip-card-inner") ?? null;
  }

  function isLight() {
    return document.documentElement.classList.contains("light");
  }

  function handleClick() {
    const inner = getInner();
    if (!inner) return;

    // Cancel any running animation for a clean restart
    if (animRef.current) {
      animRef.current.cancel();
      animRef.current = null;
    }

    const startedFromLight = isLight();
    // Dark resting = 0°  (front face = b/w)
    // Light resting = 180° (back face = color)
    const startDeg = startedFromLight ? 180 : 0;

    // Quadratic ease-out: deg(t) = 1080 * (2t − t²)
    // Gives a fast start that smoothly settles to nearly-stopped at the end.
    // Velocities per 25%-time slice: 18.9 → 13.5 → 8.1 → 2.7 deg/%
    const settle = (t: number) => Math.round(startDeg + 1080 * (2 * t - t * t));

    const anim = inner.animate(
      [
        { transform: `rotateY(${settle(0)}deg)` },
        { transform: `rotateY(${settle(0.25)}deg)`, offset: 0.25 },
        { transform: `rotateY(${settle(0.5)}deg)`, offset: 0.50 },
        { transform: `rotateY(${settle(0.75)}deg)`, offset: 0.75 },
        { transform: `rotateY(${settle(1)}deg)` },
      ],
      // fill: "none" — CSS reclaims control once done (no stuck inline style)
      { duration: 1200, easing: "linear", fill: "none" }
    );

    animRef.current = anim;

    anim.addEventListener("finish", () => {
      animRef.current = null;
      const lightNow = isLight();

      // If the theme flipped mid-spin, the animation ended on the wrong face.
      // Play a quick 180° corrective flip so the final face matches the new theme.
      if (lightNow !== startedFromLight) {
        const from = settle(1);          // where the main spin stopped
        const to = from + 180;         // flip to the opposite face

        const fix = inner.animate(
          [
            { transform: `rotateY(${from}deg)` },
            { transform: `rotateY(${to}deg)` },
          ],
          { duration: 380, easing: "ease-in-out", fill: "none" }
        );

        animRef.current = fix;
        fix.addEventListener("finish", () => { animRef.current = null; });
        fix.addEventListener("cancel", () => { animRef.current = null; });
      }
    });

    anim.addEventListener("cancel", () => { animRef.current = null; });
  }

  return (
    <div ref={ref} onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  );
}
