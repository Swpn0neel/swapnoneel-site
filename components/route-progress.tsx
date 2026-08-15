"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** How long a navigation may take before it is worth telling the reader. */
const SHOW_AFTER_MS = 150;
/** Length of the fill-to-100% outro once the new route has painted. */
const FINISH_MS = 200;
/** Nothing on this site takes this long; if it does, the nav was abandoned. */
const GIVE_UP_MS = 15000;

type Phase = "idle" | "loading" | "done";

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

/**
 * A route change on a static export is usually instant, but a cold RSC payload
 * fetch can leave the old page on screen for a second or two with no feedback —
 * the click looks dropped. This shows a hairline bar along the top once a
 * navigation has outlived SHOW_AFTER_MS, so fast navigations stay silent.
 *
 * The App Router does not expose a pending-navigation signal at the layout
 * level (useLinkStatus is per-<Link>, and would have to be threaded through
 * every link on the site), so the start of a navigation is inferred from the
 * click that causes it and the end from `pathname` actually changing.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const pathnameRef = useRef<string>(pathname);
  const timers = useRef<number[]>([]);

  const enter = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };

  useEffect(() => {
    const start = () => {
      clearTimers();
      timers.current.push(
        window.setTimeout(() => enter("loading"), SHOW_AFTER_MS),
        window.setTimeout(() => enter("idle"), GIVE_UP_MS)
      );
    };

    const onClick = (event: MouseEvent) => {
      // Anything the browser handles itself (new tab, download, modified
      // click) is not a client-side navigation and gets no bar.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same document, different hash: no fetch, no bar.
      if (
        normalizePath(url.pathname) ===
          normalizePath(window.location.pathname) &&
        url.hash
      )
        return;
      if (
        normalizePath(url.pathname) === normalizePath(window.location.pathname)
      )
        return;

      start();
    };

    const onPopState = () => {
      // Popstate fires during back/forward history navigation as well as in-page
      // fragment/hash navigation. If the destination pathname is the same as the
      // current pathname (e.g. hash change / Table of Contents / in-page anchor jump),
      // no page transition or fetch is happening, so ignore it.
      if (
        normalizePath(window.location.pathname) ===
        normalizePath(pathnameRef.current)
      ) {
        return;
      }
      start();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, []);

  // The new route has rendered. Cancel a bar that never got to appear, or run
  // the outro on one that did.
  useEffect(() => {
    pathnameRef.current = pathname;
    clearTimers();
    if (phaseRef.current === "loading") {
      enter("done");
      timers.current.push(window.setTimeout(() => enter("idle"), FINISH_MS));
    } else {
      enter("idle");
    }
  }, [pathname]);

  if (phase === "idle") return null;

  return (
    <div className="route-progress" data-phase={phase} aria-hidden="true">
      <div className="route-progress-bar" />
    </div>
  );
}
