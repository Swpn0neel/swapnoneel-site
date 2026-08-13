"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useRef } from "react";

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
  const initialPathname = useRef(pathname);
  const isNavigating = useRef(false);

  if (pathname !== initialPathname.current) {
    isNavigating.current = true;
  }

  return (
    <div
      key={pathname}
      data-page-transition={isNavigating.current ? "ready" : "instant"}
    >
      {children}
    </div>
  );
}
