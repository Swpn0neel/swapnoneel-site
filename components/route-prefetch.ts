"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

const prefetchedRoutes = new Set<string>();

export function useRoutePrefetch() {
  const router = useRouter();

  return useCallback(
    (href: string) => {
      if (prefetchedRoutes.has(href)) return;
      prefetchedRoutes.add(href);
      router.prefetch(href);
    },
    [router]
  );
}

/** Prefetches the single most likely next route after load yields to idle. */
export function useLikelyRoutePrefetch(href: string, enabled: boolean) {
  const prefetch = useRoutePrefetch();

  useEffect(() => {
    if (!enabled) return;

    let idleHandle: number | null = null;
    let fallbackTimer: number | null = null;
    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(() => prefetch(href), {
          timeout: 3000,
        });
      } else {
        fallbackTimer = window.setTimeout(() => prefetch(href), 1500);
      }
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      window.removeEventListener("load", schedule);
      if (idleHandle !== null) window.cancelIdleCallback(idleHandle);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
    };
  }, [enabled, href, prefetch]);
}
