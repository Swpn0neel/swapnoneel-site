"use client";

import { getOptionalIdleScheduler } from "@/lib/idle-scheduler";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

const prefetchedRoutes = new Set<string>();

export function useRoutePrefetch() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (href: string) => {
      const isCurrentRoute =
        pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
      if (isCurrentRoute) return;
      if (prefetchedRoutes.has(href)) return;
      prefetchedRoutes.add(href);
      router.prefetch(href);
    },
    [pathname, router]
  );
}

/** Prefetches the single most likely next route after load yields to idle. */
export function useLikelyRoutePrefetch(href: string, enabled: boolean) {
  const prefetch = useRoutePrefetch();

  useEffect(() => {
    if (!enabled) return;

    const idleScheduler = getOptionalIdleScheduler();
    let idleHandle: number | null = null;
    let fallbackTimer: number | null = null;
    const schedule = () => {
      if (idleScheduler.requestIdleCallback) {
        idleHandle = idleScheduler.requestIdleCallback(() => prefetch(href), {
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
      if (idleHandle !== null) {
        idleScheduler.cancelIdleCallback?.(idleHandle);
      }
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
    };
  }, [enabled, href, prefetch]);
}
