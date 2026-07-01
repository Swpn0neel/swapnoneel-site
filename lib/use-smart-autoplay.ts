"use client";

import type { AutoplayType } from "embla-carousel-autoplay";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { useCallback, useEffect, useRef } from "react";

type EmblaApi = NonNullable<UseEmblaCarouselType[1]>;

const RESUME_AFTER_IDLE_MS = 7000;

// Every synced carousel must use the same Embla `duration` (scroll-animation
// speed) — otherwise even perfectly-aligned autoplay ticks visibly drift
// apart because one carousel's slide animation finishes before the other's.
export const SYNCED_SCROLL_DURATION = 30;

// Every carousel using this hook registers here so a resuming instance can
// find the others and line up its next tick with theirs, instead of each
// carousel running its own independently-timed clock.
const registeredAutoplays = new Set<AutoplayType>();

function getOtherRunningAutoplay(self: AutoplayType): AutoplayType | null {
  for (const other of registeredAutoplays) {
    if (other !== self && other.isPlaying()) return other;
  }
  return null;
}

/**
 * Layers behavior on top of an embla-carousel-autoplay instance:
 * - pauses while the carousel is scrolled out of view (saves battery/CPU)
 * - pauses on drag/touch interaction, then resumes after 7s of no further
 *   interaction, instead of yanking the carousel away from the user immediately
 * - whenever this instance resumes (for any reason above, or via the returned
 *   `pause`/`resume` for hover/focus), it lines up with another currently-running
 *   carousel's next tick instead of starting its own fresh countdown, so
 *   multiple carousels stay in sync
 *
 * Requires the Autoplay plugin to be configured with `stopOnInteraction: true`
 * so it doesn't restart itself on pointerUp before this hook's timer runs.
 *
 * Callers must route ALL pause/resume triggers (hover, focus, etc.) through
 * the returned `pause`/`resume` functions instead of calling the Autoplay
 * instance's own `.stop()`/`.play()` directly — otherwise those calls bypass
 * the alignment logic and reintroduce drift.
 */
export function useSmartAutoplay(
  emblaApi: EmblaApi | undefined,
  autoplay: AutoplayType
) {
  const isVisibleRef = useRef(true);
  const pausedByInteractionRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const clearSyncTimer = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);

  const resumeIfAllowed = useCallback(() => {
    if (!isVisibleRef.current || pausedByInteractionRef.current) return;

    clearSyncTimer();
    const other = getOtherRunningAutoplay(autoplay);
    const wait = other?.timeUntilNext();

    if (wait && wait > 0) {
      syncTimeoutRef.current = setTimeout(() => autoplay.play(), wait);
    } else {
      autoplay.play();
    }
  }, [autoplay, clearSyncTimer]);

  // For hover/focus: pause immediately, resume immediately-but-aligned (no
  // 7s wait — that grace period is specifically for drag/touch interaction).
  const pause = useCallback(() => {
    pausedByInteractionRef.current = true;
    clearResumeTimer();
    clearSyncTimer();
    autoplay.stop();
  }, [autoplay, clearResumeTimer, clearSyncTimer]);

  const resume = useCallback(() => {
    pausedByInteractionRef.current = false;
    resumeIfAllowed();
  }, [resumeIfAllowed]);

  useEffect(() => {
    registeredAutoplays.add(autoplay);
    return () => {
      registeredAutoplays.delete(autoplay);
    };
  }, [autoplay]);

  useEffect(() => {
    if (!emblaApi) return;

    const onPointerDown = () => {
      pausedByInteractionRef.current = true;
      clearResumeTimer();
      clearSyncTimer();
    };

    const onPointerUp = () => {
      clearResumeTimer();
      resumeTimeoutRef.current = setTimeout(() => {
        pausedByInteractionRef.current = false;
        resumeIfAllowed();
      }, RESUME_AFTER_IDLE_MS);
    };

    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("pointerUp", onPointerUp);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          resumeIfAllowed();
        } else {
          clearSyncTimer();
          autoplay.stop();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(emblaApi.rootNode());

    return () => {
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("pointerUp", onPointerUp);
      observer.disconnect();
      clearResumeTimer();
      clearSyncTimer();
    };
  }, [emblaApi, autoplay, resumeIfAllowed, clearResumeTimer, clearSyncTimer]);

  return { pause, resume };
}
