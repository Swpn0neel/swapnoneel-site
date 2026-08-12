"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

let overlayModulePromise:
  | ReturnType<typeof importProjectOverlay>
  | undefined;

function importProjectOverlay() {
  return import("./project-overlay");
}

export function preloadProjectOverlay() {
  overlayModulePromise ??= importProjectOverlay();
  return overlayModulePromise;
}

export const LazyProjectOverlay = dynamic(
  () =>
    preloadProjectOverlay().then((module) => ({
      default: module.ProjectOverlay,
    })),
  { ssr: false }
);

/**
 * Warms the modal code and its static detail data shortly before it can be
 * used. The fallback after load runs only when the main thread becomes idle;
 * pointer/focus handlers can call preloadProjectOverlay directly for intent.
 */
export function useProjectOverlayPreload<T extends HTMLElement>() {
  const sectionRef = useRef<T>(null);

  useEffect(() => {
    const section = sectionRef.current;
    let idleHandle: number | null = null;
    let fallbackTimer: number | null = null;
    let observer: IntersectionObserver | null = null;
    let cancelled = false;

    const warm = () => {
      if (!cancelled) void preloadProjectOverlay();
    };

    const scheduleAfterLoad = () => {
      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(warm, { timeout: 2500 });
      } else {
        fallbackTimer = window.setTimeout(warm, 1500);
      }
    };

    if (document.readyState === "complete") {
      scheduleAfterLoad();
    } else {
      window.addEventListener("load", scheduleAfterLoad, { once: true });
    }

    if (section && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer?.disconnect();
          warm();
        },
        { rootMargin: "240px 0px" }
      );
      observer.observe(section);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleAfterLoad);
      observer?.disconnect();
      if (idleHandle !== null) window.cancelIdleCallback(idleHandle);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
    };
  }, []);

  return sectionRef;
}
