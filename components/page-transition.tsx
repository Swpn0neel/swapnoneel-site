"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

/**
 * On first SSR paint / document load, content is rendered instantly with 100%
 * opacity and zero offset (data-page-transition="instant") to maximize Speed Index,
 * FCP, and LCP.
 *
 * On client-side route changes, `pathname` differs from the initial mount path,
 * switching to data-page-transition="ready" which triggers the smooth CSS
 * `page-enter` animation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [entryPathname] = useState(pathname);
  // Sticky: once the visitor has navigated at all, every later route animates,
  // including a return to the route they landed on. Held in state rather than a
  // ref because a ref written during render is not safe to read in the same
  // render — adjusting state during render is the supported form of this.
  const [navigated, setNavigated] = useState(false);
  const isNavigating = navigated || pathname !== entryPathname;
  if (isNavigating && !navigated) setNavigated(true);

  return (
    <div key={pathname} data-page-transition={isNavigating ? "ready" : "instant"}>
      {children}
    </div>
  );
}
