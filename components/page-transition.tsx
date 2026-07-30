"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * The entrance animation itself lives in globals.css, keyed off the
 * `data-page-transition` attribute. This used to drive it from a
 * useLayoutEffect calling element.animate(), guarded by a ref comparison that
 * skipped the very first mount — which meant a page only ever animated if you
 * arrived by client-side routing.
 *
 * /resume is reachable only from the footer, and every footer link carries
 * target="_blank", so it is always a fresh document and that guard always won:
 * the one page that never animated. Any direct link, refresh or new tab hit
 * the same hole on every other page too.
 *
 * Moving it to CSS closes that gap without a second code path. `key={pathname}`
 * already remounts this div on every navigation, and remounting an element
 * restarts its CSS animation — so one declaration covers both the first paint
 * and every route change after it, and it starts at parse time instead of
 * waiting for hydration.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} data-page-transition="ready">
      {children}
    </div>
  );
}
