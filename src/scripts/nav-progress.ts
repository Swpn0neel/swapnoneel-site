import { once } from "./page-lifecycle";

/**
 * A thin progress bar across the top during client-side navigation.
 *
 * ClientRouter fetches the next document before swapping, so on a slow
 * connection there is a window where the click has registered but the page has
 * not changed — and nothing on screen says so. Next's App Router had the same
 * gap and filled it with a router-level pending state; this is the equivalent.
 *
 * Deliberately not a skeleton. A skeleton implies the shell has arrived and the
 * content is filling in, which is not what happens here: the old page is still
 * fully rendered and correct right up until the swap. A progress indicator says
 * "your click landed, something is coming", which is the true statement.
 */

/** Below this the navigation is effectively instant, and a one-frame flash of
 *  bar reads as a glitch rather than as feedback. */
const SHOW_AFTER_MS = 120;
/** How far the bar creeps while waiting. Never 1 — that is reserved for done. */
const CREEP_TARGET = 0.9;

export function initNavProgress(): void {
  once("nav-progress", () => {
    const bar = document.querySelector<HTMLElement>("[data-nav-progress]");
    if (!bar) return;

    let showTimer: number | null = null;
    let creepTimer: number | null = null;
    let progress = 0;

    const paint = () => {
      bar.style.transform = `scaleX(${progress})`;
    };

    const clearTimers = () => {
      if (showTimer !== null) window.clearTimeout(showTimer);
      if (creepTimer !== null) window.clearInterval(creepTimer);
      showTimer = null;
      creepTimer = null;
    };

    const start = () => {
      clearTimers();
      bar.dataset.active = "false";
      progress = 0;
      paint();

      showTimer = window.setTimeout(() => {
        bar.dataset.active = "true";
        creepTimer = window.setInterval(() => {
          // Ease towards the target so it slows as it goes — honest about not
          // knowing how long is left, without ever stalling completely.
          progress += (CREEP_TARGET - progress) * 0.12;
          paint();
        }, 100);
      }, SHOW_AFTER_MS);
    };

    const finish = () => {
      clearTimers();
      if (bar.dataset.active !== "true") return;
      progress = 1;
      paint();
      window.setTimeout(() => {
        bar.dataset.active = "false";
        progress = 0;
        paint();
      }, 220);
    };

    document.addEventListener("astro:before-preparation", start);
    document.addEventListener("astro:page-load", finish);
    // A navigation the router abandons — a second click mid-flight, or a
    // failure — would otherwise leave the bar stranded part-way across.
    window.addEventListener("popstate", finish);
  });
}
