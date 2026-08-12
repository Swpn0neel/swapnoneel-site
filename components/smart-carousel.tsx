"use client";

import type { EmblaCarouselType } from "embla-carousel";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const DEFAULT_AUTOPLAY_DELAY_MS = 2500;
const AUTOPLAY_START_DELAY_MS = 1500;
const RESUME_AFTER_INTERACTION_MS = 7000;
const SYNCED_SCROLL_DURATION = 30;

// Shared beat every synced carousel counts against, anchored the first time one
// of them schedules a move. A carousel whose delay is a whole multiple of the
// beat only moves on the beats divisible by that multiple — so the projects
// strip (2 beats) steps in unison with every second step of the socials strip
// (1 beat), rather than the two drifting on independent timers.
let beatOrigin: number | null = null;

// A timer can fire a moment before its deadline, which would otherwise resolve
// to the beat that just passed and schedule a ~0ms timeout — advancing twice in
// one beat. Treat anything within this window as already at the next beat.
const BEAT_TOLERANCE_MS = 80;

// Target time of the next beat this carousel is allowed to move on, or null if
// its delay does not divide into the beat and it should run free.
function nextSyncedTick(now: number, delay: number) {
  if (delay % DEFAULT_AUTOPLAY_DELAY_MS !== 0) return null;

  const multiple = delay / DEFAULT_AUTOPLAY_DELAY_MS;
  if (beatOrigin === null) beatOrigin = now;

  const from = now + BEAT_TOLERANCE_MS - beatOrigin;
  const elapsedBeats = Math.floor(from / DEFAULT_AUTOPLAY_DELAY_MS);
  // Round up to the next beat this carousel owns, always ahead of now.
  const nextBeat = (Math.floor(elapsedBeats / multiple) + 1) * multiple;
  return beatOrigin + nextBeat * DEFAULT_AUTOPLAY_DELAY_MS;
}

interface SmartCarouselProps {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  autoplayDelay?: number;
  align?: "start" | "center";
  dragFree?: boolean;
  onSlideChange?: (index: number) => void;
  /**
   * Holds autoplay for reasons the carousel cannot observe itself — an open
   * modal, or a pointer resting on sibling UI that is driven by the slide
   * position. The built-in hover/focus/visibility gates still apply on top.
   */
  paused?: boolean;
}

export function SmartCarousel({
  children,
  ariaLabel,
  className = "",
  autoplayDelay = DEFAULT_AUTOPLAY_DELAY_MS,
  align = "start",
  dragFree = true,
  onSlideChange,
  paused = false,
}: SmartCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<EmblaCarouselType | null>(null);
  const autoplayTimerRef = useRef<number | null>(null);
  const autoplayStartTimerRef = useRef<number | null>(null);
  const autoplayIdleRef = useRef<number | null>(null);
  const interactionTimerRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const interactingRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const autoplayReadyRef = useRef(false);
  const pausedRef = useRef(paused);
  const releaseInteractionRef = useRef<(() => void) | null>(null);
  const onSlideChangeRef = useRef(onSlideChange);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    onSlideChangeRef.current = onSlideChange;
  }, [onSlideChange]);

  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current !== null) {
      window.clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const canAutoplay = useCallback(() => {
    // hoveredRef can latch if the element under the pointer changed without a
    // pointerleave — a re-render or a layout shift under a still cursor. The
    // DOM is the authority, so re-derive from it rather than trust the flag.
    const root = rootRef.current;
    if (hoveredRef.current && root && !root.matches(":hover")) {
      hoveredRef.current = false;
    }

    return Boolean(
      apiRef.current &&
      visibleRef.current &&
      !pausedRef.current &&
      !document.hidden &&
      !hoveredRef.current &&
      !focusedRef.current &&
      !interactingRef.current &&
      !reducedMotionRef.current &&
      autoplayReadyRef.current &&
      !(
        navigator as Navigator & { connection?: { saveData?: boolean } }
      ).connection?.saveData
    );
  }, []);

  const clearAutoplayStart = useCallback(() => {
    if (autoplayStartTimerRef.current !== null) {
      window.clearTimeout(autoplayStartTimerRef.current);
      autoplayStartTimerRef.current = null;
    }
    if (autoplayIdleRef.current !== null) {
      window.cancelIdleCallback(autoplayIdleRef.current);
      autoplayIdleRef.current = null;
    }
  }, []);

  const scheduleAutoplay = useCallback(() => {
    clearAutoplayTimer();

    if (!canAutoplay()) return;

    const now = performance.now();
    const nextTickAt =
      nextSyncedTick(now, autoplayDelay) ?? now + autoplayDelay;

    autoplayTimerRef.current = window.setTimeout(
      () => {
        autoplayTimerRef.current = null;
        if (!canAutoplay()) return;

        apiRef.current?.scrollNext();
        scheduleAutoplay();
      },
      Math.max(0, nextTickAt - now)
    );
  }, [autoplayDelay, canAutoplay, clearAutoplayTimer]);

  const scheduleAutoplayStart = useCallback(() => {
    clearAutoplayStart();
    autoplayReadyRef.current = false;

    const startDelay = () => {
      autoplayIdleRef.current = null;
      autoplayStartTimerRef.current = window.setTimeout(() => {
        autoplayStartTimerRef.current = null;
        autoplayReadyRef.current = true;
        scheduleAutoplay();
      }, AUTOPLAY_START_DELAY_MS);
    };

    if ("requestIdleCallback" in window) {
      autoplayIdleRef.current = window.requestIdleCallback(startDelay, {
        timeout: 2000,
      });
    } else {
      autoplayStartTimerRef.current = window.setTimeout(() => {
        autoplayStartTimerRef.current = null;
        startDelay();
      }, 0);
    }
  }, [clearAutoplayStart, scheduleAutoplay]);

  const resumeAfterInteraction = useCallback(() => {
    if (interactionTimerRef.current !== null) {
      window.clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = window.setTimeout(() => {
      interactionTimerRef.current = null;
      interactingRef.current = false;
      scheduleAutoplay();
    }, RESUME_AFTER_INTERACTION_MS);
  }, [scheduleAutoplay]);

  // Embla binds mouse drag release to the ownerDocument and never takes
  // pointer capture, so a drag that starts on a slide and ends anywhere else
  // on the page — a flick that drifts off the strip, which is most of them —
  // dispatches its pointerup somewhere React cannot see from this subtree.
  // Waiting for onPointerUpCapture there latches interactingRef on for the
  // life of the page and autoplay never comes back. Bind the release to the
  // window, where it always lands.
  const pauseForInteraction = useCallback(() => {
    interactingRef.current = true;
    if (interactionTimerRef.current !== null) {
      window.clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = null;
    }
    clearAutoplayTimer();

    if (releaseInteractionRef.current) return;
    const release = () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      releaseInteractionRef.current = null;
      resumeAfterInteraction();
    };
    releaseInteractionRef.current = release;
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  }, [clearAutoplayTimer, resumeAfterInteraction]);

  useEffect(() => {
    pausedRef.current = paused;
    scheduleAutoplay();
  }, [paused, scheduleAutoplay]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let loadObserver: IntersectionObserver | null = null;

    const initialise = async () => {
      if (apiRef.current || cancelled) return;

      const { default: EmblaCarousel } = await import("embla-carousel");
      if (cancelled || !rootRef.current) return;

      // The fallback track carries a lead-in margin that Embla must not see —
      // it measures the DOM, so the offset would be applied twice. Dropping it
      // through `enhanced` alone is not enough: that render is scheduled, and
      // the browser can paint the doubled offset before React flushes. Write
      // the attribute here so the margin is gone in the same task that
      // constructs Embla; the state below then re-renders to the same value.
      rootRef.current.dataset.carouselEnhanced = "true";

      apiRef.current = EmblaCarousel(rootRef.current, {
        align,
        containScroll: false,
        dragFree,
        duration: SYNCED_SCROLL_DURATION,
        loop: true,
      });
      const notifySlideChange = () => {
        if (!apiRef.current) return;
        onSlideChangeRef.current?.(apiRef.current.selectedScrollSnap());
      };
      apiRef.current.on("select", notifySlideChange);
      notifySlideChange();
      setEnhanced(true);
      scheduleAutoplay();
    };

    if ("IntersectionObserver" in window) {
      loadObserver = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          loadObserver?.disconnect();
          void initialise();
        },
        { rootMargin: "320px 0px" }
      );
      loadObserver.observe(root);
    } else {
      void initialise();
    }

    return () => {
      cancelled = true;
      loadObserver?.disconnect();
      clearAutoplayStart();
      clearAutoplayTimer();
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, [
    align,
    clearAutoplayStart,
    clearAutoplayTimer,
    dragFree,
    scheduleAutoplay,
  ]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      reducedMotionRef.current = mediaQuery.matches;
      scheduleAutoplay();
    };
    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          scheduleAutoplayStart();
        } else {
          autoplayReadyRef.current = false;
          clearAutoplayStart();
          clearAutoplayTimer();
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(root);

    const onVisibilityChange = () => scheduleAutoplay();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mediaQuery.removeEventListener("change", updateReducedMotion);
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearAutoplayStart();
      releaseInteractionRef.current?.();
      if (interactionTimerRef.current !== null) {
        window.clearTimeout(interactionTimerRef.current);
        interactionTimerRef.current = null;
      }
    };
  }, [
    clearAutoplayStart,
    clearAutoplayTimer,
    scheduleAutoplay,
    scheduleAutoplayStart,
  ]);

  // The track is overflow-clipped once Embla is driving it, so the browser
  // cannot scroll a focused off-screen slide into view by itself — tabbing
  // would silently land on something invisible. Only keyboard focus moves the
  // track; a click already lands on what the user pointed at.
  const revealFocusedSlide = useCallback((target: EventTarget) => {
    const api = apiRef.current;
    if (!api || !(target instanceof HTMLElement)) return;
    if (!target.matches(":focus-visible")) return;

    const index = api.slideNodes().findIndex((slide) => slide.contains(target));
    if (index !== -1 && index !== api.selectedScrollSnap()) api.scrollTo(index);
  }, []);

  // Counterpart to revealFocusedSlide: the arrow keys move the track, so they
  // have to carry focus along or they strand it on the slide they just pushed
  // out of sight. Only relevant when focus already sits inside a slide.
  const followSelectedSlide = useCallback(() => {
    const api = apiRef.current;
    const active = document.activeElement;
    if (!api || !(active instanceof HTMLElement)) return;

    const slides = api.slideNodes();
    if (!slides.some((slide) => slide.contains(active))) return;

    slides[api.selectedScrollSnap()]
      ?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      ?.focus({ preventScroll: true });
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      apiRef.current?.scrollPrev();
      followSelectedSlide();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      apiRef.current?.scrollNext();
      followSelectedSlide();
    }
  };

  return (
    <div
      ref={rootRef}
      className={`smart-carousel ${className}`}
      data-carousel-align={align}
      data-carousel-enhanced={enhanced ? "true" : "false"}
      onKeyDown={handleKeyDown}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        hoveredRef.current = true;
        clearAutoplayTimer();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") return;
        hoveredRef.current = false;
        scheduleAutoplay();
      }}
      onFocusCapture={(event) => {
        focusedRef.current = true;
        clearAutoplayTimer();
        revealFocusedSlide(event.target);
      }}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        focusedRef.current = false;
        scheduleAutoplay();
      }}
      onPointerDownCapture={pauseForInteraction}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
    >
      {children}
    </div>
  );
}
