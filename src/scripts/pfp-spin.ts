import { getRenderedTheme } from "@/lib/theme";

/** Vanilla port of components/pfp-spin.tsx. The two refs become closure state. */
export function initPfpSpin(button: HTMLButtonElement): void {
  let current: Animation | null = null;

  const inner = () =>
    button.querySelector<HTMLElement>(".pfp-flip-card-inner") ?? null;

  // The resting angles below have to agree with --pfp-rest in global.css, so
  // they resolve the theme the same way the palette does.
  const isDark = () => getRenderedTheme() === "dark";

  button.addEventListener("click", () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = inner();
    if (!el) return;

    // Cancel any running animation for a clean restart.
    if (current) {
      current.cancel();
      current = null;
    }

    const startedFromDark = isDark();
    // Dark resting = 0deg (front face = b/w); light resting = 180deg (colour).
    const startDeg = startedFromDark ? 0 : 180;

    // Quadratic ease-out: deg(t) = 1080 * (2t - t^2). Fast start that settles
    // to nearly stopped. Velocities per 25% slice: 18.9 -> 13.5 -> 8.1 -> 2.7.
    const settle = (t: number) => Math.round(startDeg + 1080 * (2 * t - t * t));

    // fill: "none" — CSS reclaims control once done, so no stuck inline style.
    const spin = el.animate(
      [
        { transform: `rotateY(${settle(0)}deg)` },
        { transform: `rotateY(${settle(0.25)}deg)`, offset: 0.25 },
        { transform: `rotateY(${settle(0.5)}deg)`, offset: 0.5 },
        { transform: `rotateY(${settle(0.75)}deg)`, offset: 0.75 },
        { transform: `rotateY(${settle(1)}deg)` },
      ],
      { duration: 1200, easing: "linear", fill: "none" }
    );
    current = spin;

    spin.addEventListener("cancel", () => {
      current = null;
    });

    spin.addEventListener("finish", () => {
      current = null;
      const darkNow = isDark();
      const hovering =
        button.querySelector(".pfp-flip-card")?.matches(":hover") ?? false;

      // Where the animation visually ended, and where it should have.
      const startFace = startedFromDark ? 0 : 180;
      const desiredFace = darkNow ? (hovering ? 180 : 0) : hovering ? 0 : 180;
      if (startFace === desiredFace) return;

      // A quick corrective 180 to land on the right face — the theme may have
      // changed, or the pointer may have arrived, while the spin was running.
      const from = settle(1);
      const fix = el.animate(
        [
          { transform: `rotateY(${from}deg)` },
          { transform: `rotateY(${from + 180}deg)` },
        ],
        { duration: 380, easing: "ease-in-out", fill: "none" }
      );
      current = fix;
      fix.addEventListener("finish", () => {
        current = null;
      });
      fix.addEventListener("cancel", () => {
        current = null;
      });
    });
  });
}
