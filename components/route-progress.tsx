"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A navigation that commits faster than this never shows the bar at all. Every
 * route here is prerendered and the nav links are prefetched, so the ordinary
 * case is a ~35ms swap — a loader for that reads as a flicker rather than as
 * feedback. The bar exists for the navigations prefetch did not cover: a cold
 * link, an evicted payload, a bad connection. Same threshold and same reasoning
 * as the pending pulse on the nav labels (nav-pending-label.tsx).
 */
const APPEAR_DELAY = 150;

/**
 * Nothing holds the bar on screen longer than this. A route change is what
 * retires it, so a navigation that never commits — a click the router discards,
 * a destination that resolves back to the current page — would otherwise leave
 * it crawling forever.
 */
const SAFETY_TIMEOUT = 10_000;

/** Must stay in step with the opacity transition in components.css. */
const EXIT_DURATION = 260;

type Phase = "idle" | "pending" | "leaving";
type TimerKey = "appear" | "exit" | "safety";

/**
 * Whether this click hands the router a new page to fetch.
 *
 * Everything that leaves the tab (new-tab clicks, downloads, other origins,
 * mailto:) or stays on the current page (hash links, the link to the route
 * already open) is not a navigation this bar can report on. The footer is the
 * concrete case for the target check: those are internal <Link>s carrying
 * target="_blank" deliberately, so they open a tab and this document never
 * changes — starting the bar for one would strand it until the safety timeout.
 *
 * Read during the capture phase, before <Link> handles the click: Link calls
 * preventDefault() to take the navigation over, so by the bubble phase every
 * internal link looks cancelled.
 */
function startsNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return false;

  const target = event.target;
  const anchor = target instanceof Element ? target.closest("a") : null;
  // Not `!anchor`: an <a> inside an SVG is an SVGAElement, whose href is not a
  // resolved string and which cannot be a router link.
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  if (anchor.hasAttribute("download")) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (!anchor.getAttribute("href")) return false;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }
  // mailto:/tel: land here too — their origin is "null", never the page's.
  if (url.origin !== window.location.origin) return false;
  // An unchanged pathname means a hash or query-only jump. No page is fetched,
  // and usePathname would never fire to retire the bar.
  return url.pathname !== window.location.pathname;
}

/**
 * An indeterminate progress bar across the top of the viewport, shown only once
 * a client-side navigation has been waiting longer than {@link APPEAR_DELAY}.
 *
 * Indeterminate on purpose: the router reports no progress for an in-flight RSC
 * fetch, so a filling bar would be inventing one. The sliding segment borrows
 * the idiom already used for loading images (.image-shimmer), which is the
 * vocabulary this site uses elsewhere for "this is on its way".
 *
 * Covers client-side navigation only. A cold document load paints nothing until
 * the HTML arrives, by which point there is no wait left to report.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  // The listeners below run outside React's render, so they need the live phase
  // rather than the value captured when they were created.
  const phaseRef = useRef<Phase>("idle");
  const timers = useRef<Record<TimerKey, number | null>>({
    appear: null,
    exit: null,
    safety: null,
  });

  const enter = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clear = useCallback((key: TimerKey) => {
    const id = timers.current[key];
    if (id !== null) {
      window.clearTimeout(id);
      timers.current[key] = null;
    }
  }, []);

  const finish = useCallback(() => {
    clear("appear");
    clear("safety");
    // Anything but "pending" means the bar never made it on screen, or is
    // already fading — either way its own timer owns what happens next.
    if (phaseRef.current !== "pending") return;
    enter("leaving");
    timers.current.exit = window.setTimeout(() => enter("idle"), EXIT_DURATION);
  }, [clear, enter]);

  const start = useCallback(() => {
    clear("appear");
    clear("exit");
    clear("safety");
    // A fresh navigation during the fade-out drops the old bar rather than
    // reviving a half-transparent one; it is already invisible by this point,
    // and it keeps the machine at three states with no stuck combinations.
    if (phaseRef.current !== "idle") enter("idle");
    timers.current.appear = window.setTimeout(
      () => enter("pending"),
      APPEAR_DELAY
    );
    timers.current.safety = window.setTimeout(finish, SAFETY_TIMEOUT);
  }, [clear, enter, finish]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (startsNavigation(event)) start();
    };
    // Back/forward. Programmatic router.push() is intentionally outside this
    // listener; normal site navigation is handled by links and browser history.
    const handlePopState = () => start();

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
    };
  }, [start]);

  // usePathname changes in the same commit that swaps the page in, which is
  // exactly the moment the wait ends. Runs once on mount too, where finish()
  // has nothing to retire.
  useEffect(() => {
    finish();
  }, [pathname, finish]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const id of Object.values(pending)) {
        if (id !== null) window.clearTimeout(id);
      }
    };
  }, []);

  if (phase === "idle") return null;

  // aria-hidden: a route change is already announced to assistive tech when the
  // new page takes focus, and a live region here would talk over it on every
  // slow navigation.
  return (
    <div className="route-progress" data-route-progress={phase} aria-hidden>
      <span className="route-progress__bar" />
    </div>
  );
}
