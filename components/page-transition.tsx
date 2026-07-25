"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useLayoutEffect, useRef } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPathRef = useRef(pathname);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;

    if (
      !containerRef.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const animation = containerRef.current.animate(
      [
        { opacity: 0, transform: "translate3d(0, 1rem, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
      ],
      {
        duration: 200,
        easing: "ease-in-out",
      }
    );

    return () => animation.cancel();
  }, [pathname]);

  return (
    <div key={pathname} ref={containerRef} data-page-transition="ready">
      {children}
    </div>
  );
}
