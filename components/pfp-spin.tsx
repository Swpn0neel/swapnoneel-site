"use client";

import { useRef } from "react";

export function PfpSpin({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const animRef = useRef<Animation | null>(null);

  function getInner() {
    return (
      ref.current?.querySelector<HTMLElement>(".pfp-flip-card-inner") ?? null
    );
  }

  function isLight() {
    return document.documentElement.classList.contains("light");
  }

  function handleClick() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
        { transform: `rotateY(${settle(0.5)}deg)`, offset: 0.5 },
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

      // Check if the cursor is still over the flip card
      const hovering =
        ref.current?.querySelector(".pfp-flip-card")?.matches(":hover") ??
        false;

      // Where the animation visually ended (mod 360°)
      const startFace = startedFromLight ? 180 : 0;

      // Desired final face (mod 360°):
      //   No hover → theme resting:  dark=0°,   light=180°
      //   Hover    → theme hover:    dark=180°,  light=0°
      const desiredFace = lightNow ? (hovering ? 0 : 180) : hovering ? 180 : 0;

      if (startFace !== desiredFace) {
        // Play a quick 180° corrective flip to land on the right face
        const from = settle(1);
        const to = from + 180;

        const fix = inner.animate(
          [
            { transform: `rotateY(${from}deg)` },
            { transform: `rotateY(${to}deg)` },
          ],
          { duration: 380, easing: "ease-in-out", fill: "none" }
        );

        animRef.current = fix;
        fix.addEventListener("finish", () => {
          animRef.current = null;
        });
        fix.addEventListener("cancel", () => {
          animRef.current = null;
        });
      }
    });

    anim.addEventListener("cancel", () => {
      animRef.current = null;
    });
  }

  return (
    <button
      type="button"
      ref={ref}
      onClick={handleClick}
      className="block w-fit cursor-pointer appearance-none self-start border-0 bg-transparent p-0 text-left"
      aria-label="Animate profile photo"
    >
      {children}
    </button>
  );
}
